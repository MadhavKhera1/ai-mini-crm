from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate

logger = logging.getLogger("uvicorn.error")


def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    existing_customer = (
        db.query(Customer)
        .filter(Customer.email == customer.email)
        .first()
    )

    if existing_customer:
        raise HTTPException(
            status_code=409,
            detail="Customer with this email already exists.",
        )

    db_customer = Customer(
        name=customer.name,
        email=customer.email,
        company=customer.company,
        phone=customer.phone,
        status=customer.status,
    )

    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    logger.info(f"Successfully registered customer profile: {db_customer.name} ({db_customer.email}) [ID: {db_customer.id}]")
    return db_customer

def get_all_customers(db: Session) -> list[Customer]:
    return db.query(Customer).all()

def get_customer_by_id(db: Session, customer_id: int) -> Customer:
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

    return customer

def update_customer(
    db: Session,
    customer_id: int,
    customer_data: CustomerUpdate,
) -> Customer:
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

    existing_customer = (
        db.query(Customer)
        .filter(
            Customer.email == customer_data.email,
            Customer.id != customer_id,
        )
        .first()
    )

    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer with this email already exists.",
        )

    customer.name = customer_data.name
    customer.email = customer_data.email
    customer.company = customer_data.company
    customer.phone = customer_data.phone
    customer.status = customer_data.status

    db.commit()
    db.refresh(customer)

    return customer


def delete_customer(
    db: Session,
    customer_id: int,
) -> None:
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

    db.delete(customer)
    db.commit()
    logger.info(f"Successfully discarded customer profile ID: {customer_id}")


def import_customers_from_csv(db: Session, csv_content: str) -> dict:
    import csv
    import io
    import re
    
    EMAIL_REGEX = re.compile(r"^[^@]+@[^@]+\.[^@]+$")
    ALLOWED_STATUSES = {"Lead", "Contacted", "Opportunity", "Customer", "Closed"}
    
    f = io.StringIO(csv_content)
    reader = csv.DictReader(f)
    
    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty or formatted incorrectly."
        )
        
    # Standardize fieldnames (stripped and lowercase)
    headers = [h.strip().lower() for h in reader.fieldnames if h]
    
    if "name" not in headers or "email" not in headers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required CSV headers. File must contain 'name' and 'email'."
        )
        
    # Map headers to original keys
    key_map = {}
    for h in reader.fieldnames:
        if h:
            key_map[h.strip().lower()] = h
            
    total = 0
    imported = 0
    skipped = 0
    failed = 0
    errors = []
    
    # Load all existing emails from the database into memory for quick lookup
    existing_emails = {c[0] for c in db.query(Customer.email).all()}
    processed_emails_in_batch = set()
    
    row_idx = 1
    for row in reader:
        row_idx += 1
        total += 1
        
        name_val = row.get(key_map.get("name", ""))
        email_val = row.get(key_map.get("email", ""))
        company_val = row.get(key_map.get("company", ""))
        phone_val = row.get(key_map.get("phone", ""))
        status_val = row.get(key_map.get("status", ""))
        
        name = name_val.strip() if name_val else ""
        email = email_val.strip() if email_val else ""
        company = company_val.strip() if company_val else ""
        phone = phone_val.strip() if phone_val else ""
        status_str = status_val.strip() if status_val else "Lead"
        
        # Validation checks
        if not name:
            failed += 1
            errors.append(f"Row {row_idx}: Name cannot be empty.")
            continue
            
        if not email:
            failed += 1
            errors.append(f"Row {row_idx}: Email cannot be empty.")
            continue
            
        if not EMAIL_REGEX.match(email):
            failed += 1
            errors.append(f"Row {row_idx}: Invalid email format.")
            continue
            
        if status_str not in ALLOWED_STATUSES:
            failed += 1
            errors.append(f"Row {row_idx}: Invalid status '{status_str}'. Allowed values: Lead, Contacted, Opportunity, Customer, Closed.")
            continue
            
        # Check duplicates
        if email in existing_emails or email in processed_emails_in_batch:
            skipped += 1
            continue
            
        db_customer = Customer(
            name=name,
            email=email,
            company=company,
            phone=phone,
            status=status_str
        )
        db.add(db_customer)
        processed_emails_in_batch.add(email)
        imported += 1
        
    db.commit()
    
    return {
        "total": total,
        "imported": imported,
        "skipped": skipped,
        "failed": failed,
        "errors": errors
    }