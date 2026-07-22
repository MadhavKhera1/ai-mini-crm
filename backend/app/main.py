from fastapi import FastAPI

from app.db.base import Base
from app.db.database import engine

from app.routers import customer

# Creating all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Mini CRM",
    version="1.0.0",
    description="AI Powered CRM for Sales Executives",
)

# Registering routers
app.include_router(customer.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to AI Mini CRM "
    }