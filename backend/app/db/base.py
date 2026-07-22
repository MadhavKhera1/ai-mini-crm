from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

from app.models.customer import Customer