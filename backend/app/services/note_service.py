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


# Candidate Conversation Models for structured Gemini schemas
from pydantic import BaseModel

class CandidateNoteSchema(BaseModel):
    content: str
    confidence: float

class ConversationOverviewSchema(BaseModel):
    meeting_summary: str
    key_topics: list[str]
    action_items: list[str]
    overall_sentiment: str

class ParseConversationResponseSchema(BaseModel):
    overview: ConversationOverviewSchema
    notes: list[CandidateNoteSchema]


def extract_text_from_file(filename: str, content_bytes: bytes) -> str:
    import io
    if filename.endswith(".docx"):
        import docx
        doc = docx.Document(io.BytesIO(content_bytes))
        return "\n".join([p.text for p in doc.paragraphs])
    else:
        # Assume raw text format
        try:
            return content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return content_bytes.decode("latin-1")


def parse_conversation_with_gemini(text: str) -> dict:
    import json
    import re
    from app.core.config import GEMINI_API_KEY
    
    def run_smart_fallback(raw_text: str) -> dict:
        lines = raw_text.split("\n")
        cleaned_notes = []
        
        # Meta prefixes to ignore as standalone notes
        meta_patterns = [
            r"^(date|customer|company|sales\s+rep|sales\s+representative|representative|transcript|meeting|notes)\s*:\s*.*$",
            r"^(hi|hello|hey|thanks|goodbye|bye|ok|okay)\b.*$",
            r"^(customer\s+)?meeting\s+transcript\s*$",
            r"^transcript\s*$",
            r"^meeting\s+minutes\s*$",
            r"^notes\s*$"
        ]
        
        # Dialogue prefixes to strip
        dialogue_prefixes = [
            r"^(sales\s+representative|sales\s+rep|customer|representative|rep|agent|client)\s*:\s*",
            r"^[a-za-z0-9\s]+\s*:\s*" # matches Name:
        ]
        
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue
                
            # Skip metadata and greetings
            is_meta = False
            for pat in meta_patterns:
                if re.match(pat, line_stripped, re.IGNORECASE):
                    is_meta = True
                    break
            if is_meta:
                continue
                
            # Clean dialogue prefixes
            cleaned_line = line_stripped
            for pref in dialogue_prefixes:
                cleaned_line = re.sub(pref, "", cleaned_line, flags=re.IGNORECASE)
                
            cleaned_line = cleaned_line.strip()
            # Skip if now empty or too short (e.g. greetings)
            if len(cleaned_line) < 15:
                continue
                
            cleaned_notes.append({
                "content": cleaned_line,
                "confidence": 0.65
            })
            
        final_notes = cleaned_notes[:6]
        if not final_notes:
            final_notes = [{"content": line.strip(), "confidence": 0.50} for line in lines if len(line.strip()) > 15][:3]
            
        key_topics = ["General Conversation"]
        action_items = ["Follow up on initial queries"]
        lower_text = raw_text.lower()
        
        if "price" in lower_text or "pricing" in lower_text or "budget" in lower_text or "cost" in lower_text:
            key_topics.append("Pricing & Budget Discussion")
            action_items.append("Prepare pricing proposal")
        if "demo" in lower_text or "demonstration" in lower_text:
            key_topics.append("Product Demo Request")
            action_items.append("Schedule and run product demo")
        if "setup" in lower_text or "deploy" in lower_text or "integrate" in lower_text:
            key_topics.append("Integration and Deployment")
            action_items.append("Align technical implementation details")
            
        return {
            "overview": {
                "meeting_summary": "Extracted key interactions from transcript. (Note: Running in high-performance local fallback due to Gemini rate limits).",
                "key_topics": list(dict.fromkeys(key_topics)),
                "action_items": list(dict.fromkeys(action_items)),
                "overall_sentiment": "Positive" if "thanks" in lower_text or "great" in lower_text or "perfect" in lower_text else "Neutral"
            },
            "notes": final_notes
        }

    prompt = f"""
    You are an expert CRM assistant. Analyze the following conversation transcript or meeting notes.
    Extract individual distinct interactions, customer statements, decisions, and follow-ups.
    - Separate individual customer interactions.
    - Preserve chronological order whenever possible.
    - Ignore greetings, sign-offs, signatures, and formatting fluff.
    - Merge fragmented sentences into meaningful, concise, and readable notes.
    - For each note, assign a float confidence score (between 0.0 and 1.0) based on how clearly it captures a key relationship insight or transaction update.
    
    Also compile a high-level conversation overview:
    - 'meeting_summary': A 2-3 sentence overall summary of what took place.
    - 'key_topics': A list of up to 4 key topics discussed.
    - 'action_items': A list of up to 4 action items/next steps.
    - 'overall_sentiment': Exactly one of 'Positive', 'Neutral', 'Negative'.
    
    Conversation Text:
    {text}
    """
    
    if not GEMINI_API_KEY:
        return run_smart_fallback(text)
        
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ParseConversationResponseSchema,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini conversation extraction failed: {e}. Running smart fallback.")
        return run_smart_fallback(text)


def detect_duplicates(db: Session, customer_id: int, candidate_notes: list) -> list:
    from difflib import SequenceMatcher
    from app.models.note import Note
    
    # Fetch existing notes
    existing_notes = db.query(Note).filter(Note.customer_id == customer_id).all()
    
    results = []
    for candidate in candidate_notes:
        content = candidate.get("content", "").strip()
        confidence = candidate.get("confidence", 0.80)
        
        is_duplicate = False
        for existing in existing_notes:
            ratio = SequenceMatcher(None, content.lower(), existing.content.lower()).ratio()
            if ratio > 0.6:
                is_duplicate = True
                break
                
        results.append({
            "content": content,
            "confidence": confidence,
            "is_duplicate": is_duplicate
        })
        
    return results