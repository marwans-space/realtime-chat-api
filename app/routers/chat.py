from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, asc
from models.user import User
from database.session import get_db
from models.messages import Message
from models.conversations import Conversation
from schemas.chat import MessageModel, MessageResponse, ConversationResponse
from dependencies.auth import get_current_user
from services.conversation import get_or_create_conversation
from services.connection_manager import manager

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/messages",status_code=201, response_model=MessageResponse)
async def message(body: MessageModel,current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    try:
        query = select(User).where(User.id == body.recipient_id)
        result = await session.execute(query)
        recipient = result.scalar_one_or_none()
        if recipient is None:
            raise HTTPException(status_code=404,detail="Recipient not found")
        conversation = await get_or_create_conversation(user1_id=current_user.id,user2_id=recipient.id, session=session)
    
        message = Message(conversation_id=conversation.id,sender_id=current_user.id, content=body.content)
        session.add(message)
        await session.commit()
        await session.refresh(message)
    except Exception:
        await session.rollback()
        raise

    message_response = MessageResponse.model_validate(message)
    await manager.send_personal_message(
        message=message_response.model_dump(mode="json"),
        user_id=recipient.id,
    )
    return message_response

@router.get("/conversation",response_model=list[ConversationResponse])
async def get_convo(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    query = select(Conversation).where(or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)).order_by(Conversation.created_at.desc())
    result = await session.execute(query)
    conversations = result.scalars().all()
    return conversations

@router.get("/conversation/{conversation_id}/messages",response_model=list[MessageResponse])
async def get_messages(conversation_id: int,current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)):
    query = select(Conversation).where(Conversation.id == conversation_id)
    result = await session.execute(query)
    conversation = result.scalar_one_or_none()
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    user_is_participant = conversation.user2_id == current_user.id or conversation.user1_id == current_user.id
    if not user_is_participant:
        raise HTTPException(status_code=403,detail="You are not participant in this conversation!")
    query = select(Message).where(Message.conversation_id == conversation.id).order_by(asc(Message.created_at),asc(Message.id))
    result = await session.execute(query)
    messages = result.scalars().all()
    return messages