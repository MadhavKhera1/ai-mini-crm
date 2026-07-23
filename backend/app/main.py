from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.base import Base
from app.db.database import engine

from app.routers import customer, note

# Creating all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Mini CRM",
    version="1.0.0",
    description="AI Powered CRM for Sales Executives",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering routers
app.include_router(customer.router)
app.include_router(note.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to AI Mini CRM "
    }