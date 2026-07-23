import json
import os
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.models.customer import Customer
from app.models.note import Note
from app.core.config import GEMINI_API_KEY

# Define the expected JSON output schema
class AISummaryResponse(BaseModel):
    summary: str
    insights: list[str]
    action_items: list[str]

def generate_customer_summary(db: Session, customer_id: int):
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
        return {
            "summary": f"{customer.name} from {customer.company} is registered as a '{customer.status}'. Start adding conversation logs or notes to enable AI-powered summaries.",
            "insights": ["No interaction logs found."],
            "action_items": ["Make initial contact to establish relationship.", "Collect contact preferences and role details."],
            "last_updated": None
        }

    from datetime import timedelta
    # Format the prompt (convert UTC to IST for Gemini contextual analysis)
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

    # Check if Gemini API key exists
    if not GEMINI_API_KEY:
        # Fallback to local heuristic rule parser
        return generate_heuristic_summary(customer, notes)

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
                response_schema=AISummaryResponse,
            ),
        )

        result = json.loads(response.text)
        return {
            "summary": result.get("summary", ""),
            "insights": result.get("insights", []),
            "action_items": result.get("action_items", []),
            "last_updated": None
        }
    except Exception as e:
        print(f"Gemini API invocation failed: {e}. Falling back to rule-based engine.")
        return generate_heuristic_summary(customer, notes)

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
        "action_items": action_items,
        "last_updated": None
    }
