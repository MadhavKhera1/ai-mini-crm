import json
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.models.customer import Customer
from app.models.note import Note
from app.models.ai_summary import AISummary
from app.core.config import GEMINI_API_KEY

# Define the expected JSON output schema for Gemini
class AISummarySchema(BaseModel):
    summary: str
    insights: list[str]
    action_items: list[str]

def get_stored_summary(db: Session, customer_id: int) -> AISummary:
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found."
        )

    summary = db.query(AISummary).filter(AISummary.customer_id == customer_id).first()
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI summary not found for this customer."
        )
    return summary

def generate_and_store_summary(db: Session, customer_id: int) -> AISummary:
    # Fetch customer
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found."
        )
    
    # Fetch notes
    notes = db.query(Note).filter(Note.customer_id == customer_id).order_by(Note.created_at.desc()).all()
    
    # If there are no notes, return empty state AI summary
    if not notes:
        result = {
            "summary": f"{customer.name} from {customer.company} is registered as a '{customer.status}'. Start adding conversation logs or notes to enable AI-powered summaries.",
            "insights": ["No interaction logs found."],
            "action_items": ["Make initial contact to establish relationship.", "Collect contact preferences and role details."]
        }
    else:
        # Format the prompt
        from datetime import timedelta
        notes_text = "\n".join([
            f"- [{(note.created_at + timedelta(hours=5, minutes=30)).strftime('%Y-%m-%d %H:%M')} IST] {note.content}"
            for note in notes
        ])
        prompt = f"""
        You are an AI sales assistant. Analyze the following profile and interaction history.
        
        Customer Name: {customer.name}
        Company: {customer.company}
        Status: {customer.status}
        
        Interaction Notes:
        {notes_text}
        
        Provide a professional, actionable sales summary. Respond with a JSON object containing:
        1. 'summary': A concise 2-3 sentence overview of the relationship status, budget constraints (if mentioned), key product interest, and sentiment.
        2. 'insights': A list of up to 4 key insights or customer problems discovered during conversations.
        3. 'action_items': A list of up to 4 concrete next steps to close the deal or maintain positive follow-up.
        """

        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.info(f"Generating AI Summary for customer ID {customer_id} (Interaction logs count: {len(notes)})")

        # Check if Gemini API key exists
        if not GEMINI_API_KEY:
            logger.info("GEMINI_API_KEY not found. Running heuristic fallback summary generator.")
            result = generate_heuristic_summary(customer, notes)
        else:
            try:
                from google import genai
                from google.genai import types

                # Initialize the GenAI Client
                client = genai.Client(api_key=GEMINI_API_KEY)
                
                response = client.models.generate_content(
                    model='gemini-3.6-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AISummarySchema,
                    ),
                )

                result = json.loads(response.text)
                logger.info(f"Successfully generated AI Summary using Gemini 3.6 Flash for customer ID {customer_id}")
            except Exception as e:
                logger.error(f"Gemini API summary invocation failed for customer ID {customer_id}: {e}. Falling back to rule-based engine.")
                result = generate_heuristic_summary(customer, notes)

    # Save to database
    summary_record = db.query(AISummary).filter(AISummary.customer_id == customer_id).first()
    if summary_record:
        summary_record.summary = result.get("summary", "")
        summary_record.insights = result.get("insights", [])
        summary_record.action_items = result.get("action_items", [])
        summary_record.is_outdated = False
        summary_record.last_updated = datetime.utcnow()
    else:
        summary_record = AISummary(
            customer_id=customer_id,
            summary=result.get("summary", ""),
            insights=result.get("insights", []),
            action_items=result.get("action_items", []),
            is_outdated=False,
            last_updated=datetime.utcnow()
        )
        db.add(summary_record)

    db.commit()
    db.refresh(summary_record)
    return summary_record

def mark_summary_outdated(db: Session, customer_id: int):
    summary_record = db.query(AISummary).filter(AISummary.customer_id == customer_id).first()
    if summary_record:
        summary_record.is_outdated = True
        db.commit()

def generate_heuristic_summary(customer: Customer, notes: list[Note]):
    # Custom rule-based NLP extraction
    combined_notes = " ".join([note.content.lower() for note in notes])
    
    insights = []
    action_items = []
    
    if "budget" in combined_notes or "price" in combined_notes or "cost" in combined_notes:
      insights.append("Budget constraint identified: customer is sensitive to pricing details.")
      action_items.append("Offer tiered pricing plan or promotional discount package.")

    if "competitor" in combined_notes or "evaluating" in combined_notes or "alternative" in combined_notes:
      insights.append("Competitor evaluation in progress. Looking for custom workflows.")
      action_items.append("Send feature matrix comparing our system with key market competitors.")

    if "demo" in combined_notes or "showcase" in combined_notes:
      insights.append("Completed product showcase. Positive sentiment regarding automation features.")
      action_items.append("Follow up to answer specific technical questions raised during demo.")

    if "decision maker" in combined_notes or "manager" in combined_notes or "ceo" in combined_notes:
      insights.append("Involves senior decision-makers. Buying team requires structured review.")
      action_items.append("Schedule a team presentation for the department head.")

    # Defaults
    if not insights:
      insights.append("Stable interaction profile. Customer is responsive and warm.")
      insights.append("Reviewing general product functionalities for internal team deployment.")
    
    if not action_items:
      action_items.append("Proactively check in next week regarding product evaluation progress.")
      action_items.append("Verify customer timeline and target go-live date.")

    summary = f"{customer.name} ({customer.company}) is currently a '{customer.status}'. Based on {len(notes)} log(s) of conversation history, the account shows steady momentum. {insights[0]}"
    
    return {
        "summary": summary,
        "insights": insights,
        "action_items": action_items
    }
