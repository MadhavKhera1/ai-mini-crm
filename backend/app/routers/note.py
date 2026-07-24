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


from fastapi import UploadFile, File, HTTPException
from app.services.note_service import (
    extract_text_from_file,
    parse_conversation_with_gemini,
    detect_duplicates
)
from app.models.note import Note
from app.services.ai_service import mark_summary_outdated

@router.post(
    "/customers/{customer_id}/notes/import-preview",
    response_model=dict
)
def import_notes_preview_endpoint(
    customer_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    filename = file.filename or ""
    if not (filename.endswith(".txt") or filename.endswith(".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only text (.txt) and Word document (.docx) files are supported."
        )
        
    try:
        content_bytes = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read file: {e}"
        )
        
    if not content_bytes or len(content_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
        
    try:
        text_content = extract_text_from_file(filename, content_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not parse file content: {e}"
        )
        
    result = parse_conversation_with_gemini(text_content)
    candidate_notes = result.get("notes", [])
    deduplicated_notes = detect_duplicates(db, customer_id, candidate_notes)
    
    return {
        "overview": result.get("overview", {}),
        "notes": deduplicated_notes
    }

from pydantic import BaseModel
class ImportNotesConfirmRequest(BaseModel):
    notes: list[str]

@router.post(
    "/customers/{customer_id}/notes/import-confirm",
    response_model=dict
)
def import_notes_confirm_endpoint(
    customer_id: int,
    req: ImportNotesConfirmRequest,
    db: Session = Depends(get_db)
):
    inserted_count = 0
    for content in req.notes:
        content_str = content.strip()
        if content_str:
            db_note = Note(
                customer_id=customer_id,
                content=content_str
            )
            db.add(db_note)
            inserted_count += 1
            
    if inserted_count > 0:
        db.commit()
        mark_summary_outdated(db, customer_id)
        
    return {
        "imported": inserted_count
    }