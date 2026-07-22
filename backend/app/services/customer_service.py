from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


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