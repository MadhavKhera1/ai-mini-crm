from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    company: str
    phone: str
    status: str = "Lead"


class CustomerUpdate(BaseModel):
    name: str
    email: EmailStr
    company: str
    phone: str
    status: str


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    company: str
    phone: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)