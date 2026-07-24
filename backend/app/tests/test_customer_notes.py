import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.database import get_db
from app.main import app
from app.models.customer import Customer
from app.models.note import Note
from app.models.ai_summary import AISummary

# Setup testing database in-memory SQLite
from sqlalchemy.pool import StaticPool

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    db = TestingSessionLocal()
    db.query(Note).delete()
    db.query(AISummary).delete()
    db.query(Customer).delete()
    db.commit()
    db.close()


# ==========================================
# CUSTOMER CRUD TESTS
# ==========================================

def test_create_customer():
    response = client.post("/customers", json={
        "name": "Suraj Sharma",
        "email": "suraj@example.com",
        "company": "Apex Solutions",
        "phone": "9876543210",
        "status": "Lead"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Suraj Sharma"
    assert data["email"] == "suraj@example.com"
    assert "id" in data

def test_get_customer():
    response = client.post("/customers", json={
        "name": "Suraj Sharma",
        "email": "suraj@example.com",
        "company": "Apex Solutions",
        "phone": "9876543210",
        "status": "Lead"
    })
    c_id = response.json()["id"]

    response = client.get(f"/customers/{c_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Suraj Sharma"

def test_update_customer():
    response = client.post("/customers", json={
        "name": "Suraj Sharma",
        "email": "suraj@example.com",
        "company": "Apex Solutions",
        "phone": "9876543210",
        "status": "Lead"
    })
    c_id = response.json()["id"]

    response = client.put(f"/customers/{c_id}", json={
        "name": "Suraj Sharma Updated",
        "email": "suraj.updated@example.com",
        "company": "Apex Corp",
        "phone": "9123456789",
        "status": "Opportunity"
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Suraj Sharma Updated"
    assert response.json()["status"] == "Opportunity"

def test_delete_customer():
    response = client.post("/customers", json={
        "name": "Suraj Sharma",
        "email": "suraj@example.com",
        "company": "Apex Solutions",
        "phone": "9876543210",
        "status": "Lead"
    })
    c_id = response.json()["id"]

    response = client.delete(f"/customers/{c_id}")
    assert response.status_code == 204

    response = client.get(f"/customers/{c_id}")
    assert response.status_code == 404


# ==========================================
# NOTES CRUD TESTS
# ==========================================

def test_create_note():
    res = client.post("/customers", json={
        "name": "Suraj Sharma",
        "email": "suraj@example.com",
        "company": "Apex Solutions",
        "phone": "9876543210",
        "status": "Lead"
    })
    c_id = res.json()["id"]

    response = client.post(f"/customers/{c_id}/notes", json={
        "content": "Discussed dashboard widgets cap Rs. 5,000."
    })
    assert response.status_code == 201
    assert response.json()["content"] == "Discussed dashboard widgets cap Rs. 5,000."
    assert response.json()["customer_id"] == c_id

def test_get_notes():
    res = client.post("/customers", json={
        "name": "Suraj Sharma",
        "email": "suraj@example.com",
        "company": "Apex Solutions",
        "phone": "9876543210",
        "status": "Lead"
    })
    c_id = res.json()["id"]

    client.post(f"/customers/{c_id}/notes", json={"content": "Note 1"})
    client.post(f"/customers/{c_id}/notes", json={"content": "Note 2"})

    response = client.get(f"/customers/{c_id}/notes")
    assert response.status_code == 200
    assert len(response.json()) == 2


# ==========================================
# CSV BULK IMPORT TESTS
# ==========================================

def test_csv_import_success():
    csv_content = "name,email,company,phone,status\nRohan Sharma,rohan@example.com,Airtel,9876543210,Opportunity\n"
    response = client.post(
        "/customers/import",
        files={"file": ("import.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["imported"] == 1
    assert data["failed"] == 0

def test_csv_import_duplicate_email():
    client.post("/customers", json={
        "name": "Rohan Sharma",
        "email": "rohan@example.com",
        "company": "Airtel",
        "phone": "9876543210",
        "status": "Opportunity"
    })

    csv_content = "name,email,company,phone,status\nRohan Sharma,rohan@example.com,Airtel,9876543210,Opportunity\n"
    response = client.post(
        "/customers/import",
        files={"file": ("import.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["imported"] == 0
    assert data["skipped"] == 1

def test_csv_import_invalid_email():
    csv_content = "name,email,company,phone,status\nRohan Sharma,invalid_email,Airtel,9876543210,Opportunity\n"
    response = client.post(
        "/customers/import",
        files={"file": ("import.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["imported"] == 0
    assert data["failed"] == 1
    assert len(data["errors"]) == 1

def test_csv_import_missing_columns():
    csv_content = "name,company,phone,status\nRohan Sharma,Airtel,9876543210,Opportunity\n"
    response = client.post(
        "/customers/import",
        files={"file": ("import.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 400

def test_csv_import_empty_csv():
    response = client.post(
        "/customers/import",
        files={"file": ("import.csv", io.BytesIO(b""), "text/csv")}
    )
    assert response.status_code == 400


# ==========================================
# TRANSCRIPT IMPORT TESTS
# ==========================================

@patch("app.routers.note.parse_conversation_with_gemini")
def test_transcript_import_preview(mock_gemini):
    mock_gemini.return_value = {
        "overview": {
            "meeting_summary": "Extracted discussion.",
            "key_topics": ["Pricing"],
            "action_items": ["Send proposal"],
            "overall_sentiment": "Positive"
        },
        "notes": [
            {"content": "Discussed pricing options.", "confidence": 0.95}
        ]
    }

    res_c = client.post("/customers", json={
        "name": "Suraj Sharma",
        "email": "suraj@example.com",
        "company": "Apex Solutions",
        "phone": "9876543210",
        "status": "Lead"
    })
    c_id = res_c.json()["id"]

    txt_content = "Transcript dialog details here."
    response = client.post(
        f"/customers/{c_id}/notes/import-preview",
        files={"file": ("transcript.txt", io.BytesIO(txt_content.encode("utf-8")), "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "overview" in data
    assert data["notes"][0]["content"] == "Discussed pricing options."

def test_transcript_import_invalid_extension():
    res_c = client.post("/customers", json={
        "name": "Suraj", "email": "suraj@example.com", "company": "Apex", "phone": "123", "status": "Lead"
    })
    c_id = res_c.json()["id"]

    response = client.post(
        f"/customers/{c_id}/notes/import-preview",
        files={"file": ("transcript.pdf", io.BytesIO(b"pdf bytes"), "application/pdf")}
    )
    assert response.status_code == 400


# ==========================================
# AI SUMMARY TESTS
# ==========================================

@patch("app.routers.customer.generate_and_store_summary")
def test_ai_summary_generate(mock_generate):
    from datetime import datetime
    mock_generate.return_value = AISummary(
        id=1,
        customer_id=1,
        summary="A professional summary details.",
        insights=["Insight 1"],
        action_items=["Action 1"],
        is_outdated=False,
        last_updated=datetime.utcnow()
    )

    response = client.post("/customers/1/ai-summary/generate")
    assert response.status_code == 200
    assert response.json()["summary"] == "A professional summary details."

def test_ai_summary_outdated_on_note_change():
    res_c = client.post("/customers", json={
        "name": "Suraj", "email": "suraj@example.com", "company": "Apex", "phone": "123", "status": "Lead"
    })
    c_id = res_c.json()["id"]

    db = TestingSessionLocal()
    summary = AISummary(
        customer_id=c_id,
        summary="Initial summary",
        insights=[],
        action_items=[],
        is_outdated=False
    )
    db.add(summary)
    db.commit()
    db.close()

    response = client.get(f"/customers/{c_id}/ai-summary")
    assert response.json()["is_outdated"] is False

    client.post(f"/customers/{c_id}/notes", json={
        "content": "New discussion log detail."
    })

    response = client.get(f"/customers/{c_id}/ai-summary")
    assert response.json()["is_outdated"] is True
