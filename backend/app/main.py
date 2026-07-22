from fastapi import FastAPI

app = FastAPI(
    title="AI Mini CRM",
    version="1.0.0",
    description="AI Powered CRM for Sales Executives",
)


@app.get("/")
def root():
    return {
        "message": "Welcome to AI Mini CRM 🚀"
    }