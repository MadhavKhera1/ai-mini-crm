from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.customer import Customer
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate


def create_note(
    db: Session,
    customer_id: int,
    note_data: NoteCreate,
) -> Note:
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    note = Note(
        customer_id=customer_id,
        content=note_data.content,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    from app.services.ai_service import mark_summary_outdated
    mark_summary_outdated(db, customer_id)

    return note

def get_notes_by_customer(
    db: Session,
    customer_id: int,
) -> list[Note]:
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return (
        db.query(Note)
        .filter(Note.customer_id == customer_id)
        .order_by(Note.created_at.desc())
        .all()
    )


def update_note(
    db: Session,
    note_id: int,
    note_data: NoteUpdate,
) -> Note:
    note = (
        db.query(Note)
        .filter(Note.id == note_id)
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found.",
        )

    note.content = note_data.content

    db.commit()
    db.refresh(note)

    from app.services.ai_service import mark_summary_outdated
    mark_summary_outdated(db, note.customer_id)

    return note


def delete_note(
    db: Session,
    note_id: int,
) -> None:
    note = (
        db.query(Note)
        .filter(Note.id == note_id)
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found.",
        )

    customer_id = note.customer_id
    db.delete(note)
    db.commit()

    from app.services.ai_service import mark_summary_outdated
    mark_summary_outdated(db, customer_id)