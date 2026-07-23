from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.note import (
    NoteCreate, 
    NoteUpdate,
    NoteResponse
)

from app.services.note_service import (
    create_note,
    get_notes_by_customer,
    update_note,
    delete_note,
)

router = APIRouter(
    tags=["Notes"],
)

@router.post(
    "/customers/{customer_id}/notes",
    response_model=NoteResponse,
    status_code=201,
)
def create_note_endpoint(
    customer_id: int,
    note: NoteCreate,
    db: Session = Depends(get_db),
):
    return create_note(
        db=db,
        customer_id=customer_id,
        note_data=note,
    )


@router.get(
    "/customers/{customer_id}/notes",
    response_model=list[NoteResponse],
)
def get_notes_endpoint(
    customer_id: int,
    db: Session = Depends(get_db),
):
    return get_notes_by_customer(
        db=db,
        customer_id=customer_id,
    )

@router.put(
    "/notes/{note_id}",
    response_model=NoteResponse,
)
def update_note_endpoint(
    note_id: int,
    note: NoteUpdate,
    db: Session = Depends(get_db),
):
    return update_note(
        db=db,
        note_id=note_id,
        note_data=note,
    )

@router.delete(
    "/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_note_endpoint(
    note_id: int,
    db: Session = Depends(get_db),
):
    delete_note(
        db=db,
        note_id=note_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)