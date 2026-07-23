from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

from app.models.customer import Customer
from app.models.note import Note
from app.models.ai_summary import AISummary