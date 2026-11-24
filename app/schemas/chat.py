from pydantic import Field, BaseModel, ConfigDict
from datetime import datetime
class MessageModel(BaseModel):
    recipient_id: int = Field(ge=1)
    content: str = Field(min_length=1,max_length=5000)

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationResponse(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)