from fastapi import APIRouter, Depends, Response, status, HTTPException
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

from app.schemas.ai_summary import AISummaryResponse
from app.services.ai_service import get_stored_summary, generate_and_store_summary

@router.get(
    "/{customer_id}/ai-summary",
    response_model=AISummaryResponse,
)
def get_customer_ai_summary(
    customer_id: int,
    db: Session = Depends(get_db),
):
    return get_stored_summary(db, customer_id)

@router.post(
    "/{customer_id}/ai-summary/generate",
    response_model=AISummaryResponse,
)
def generate_customer_ai_summary(
    customer_id: int,
    db: Session = Depends(get_db),
):
    return generate_and_store_summary(db, customer_id)


from fastapi import UploadFile, File
from app.services.customer_service import import_customers_from_csv

import logging
logger = logging.getLogger("uvicorn.error")

@router.post(
    "/import",
    response_model=dict,
)
def import_customers_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Reject files that don't have .csv extension
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV files (.csv) are accepted."
        )

    # Read bytes
    try:
        content_bytes = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read file: {e}"
        )

    # Reject empty files
    if not content_bytes or len(content_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV file is empty."
        )

    # Decode bytes safely
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = content_bytes.decode("latin-1")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to decode file content. Please check file encoding."
            )

    result = import_customers_from_csv(db, content_str)
    logger.info(f"Bulk CSV Import complete for '{file.filename}': Total={result['total']}, Imported={result['imported']}, Skipped={result['skipped']}, Failed={result['failed']}")
    return result