import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

import app.db.base
from app.db.database import SessionLocal
from app.services.ai_service import generate_customer_summary
from app.models.customer import Customer

db = SessionLocal()
try:
    from app.models.note import Note
    # Find a customer with notes
    customer = None
    for c in db.query(Customer).all():
        notes_count = db.query(Note).filter(Note.customer_id == c.id).count()
        print(f"Customer: {c.name} has {notes_count} notes.")
        if notes_count > 0:
            customer = c
            
    if not customer:
        # Create a temporary note for the first customer to test
        customer = db.query(Customer).first()
        if not customer:
            print("No customers found in database to test.")
            sys.exit(0)
        print(f"Creating a temporary test note for {customer.name}...")
        test_note = Note(customer_id=customer.id, content="Spoke with Manoj today. He wants to purchase 25 corporate licenses by next Thursday. His budget is max $5,000. He is worried about integration complexity.")
        db.add(test_note)
        db.commit()
        print("Test note created.")
    
    print(f"Generating summary for Customer: {customer.name} (ID: {customer.id})...")
    result = generate_customer_summary(db, customer.id)
    print("\nResult received successfully from Gemini:")
    print(f"Summary: {result.get('summary')}")
    print(f"Insights: {result.get('insights')}")
    print(f"Action Items: {result.get('action_items')}")
    
    # Clean up test note if we created one
    db.query(Note).filter(Note.content.like("%purchase 25 corporate licenses%")).delete()
    db.commit()
finally:
    db.close()
