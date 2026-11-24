from sqlalchemy.ext.asyncio import AsyncSession
from models.conversations import Conversation
from sqlalchemy import select, and_

async def get_or_create_conversation(session: AsyncSession, user1_id: int, user2_id: int)-> Conversation:
    if user1_id == user2_id:
        raise ValueError("You can't talk to yourself!")
    first_id = min(user1_id,user2_id)
    second_id = max(user2_id,user1_id)
    
    query = select(Conversation).where(and_(Conversation.user1_id == first_id, Conversation.user2_id == second_id))
    result = await session.execute(query)
    conversation = result.scalar_one_or_none()
    if conversation:
        return conversation
    conversation = Conversation(user2_id=second_id,user1_id=first_id)
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    
    return conversation