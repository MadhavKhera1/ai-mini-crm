from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.services.customer_service import (
        create_customer,
        get_all_customers,
        get_customer_by_id,
        update_customer,
        delete_customer,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=201,
)
def create_customer_endpoint(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
):
    return create_customer(db, customer)


@router.get(
    "",
    response_model=list[CustomerResponse],
)
def get_customers(
    db: Session = Depends(get_db),
):
    return get_all_customers(db)

@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    return get_customer_by_id(db, customer_id)

@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer_endpoint(
    customer_id: int,
    customer: CustomerUpdate,
    db: Session = Depends(get_db),
):
    return update_customer(
        db=db,
        customer_id=customer_id,
        customer_data=customer,
    )

@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
):
    delete_customer(db, customer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)