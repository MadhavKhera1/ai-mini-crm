from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AISummaryResponse(BaseModel):
    id: int
    customer_id: int
    summary: str
    insights: list[str]
    action_items: list[str]
    is_outdated: bool
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)
