from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status,
    WebSocketException,
)
from pydantic import ValidationError
from services.connection_manager import manager
from schemas.chat import MessageModel, MessageResponse
from core.security import decode_access_token
import jwt
from sqlalchemy import select
from database.session import SessionLocal
from models.user import User
from models.messages import Message
from services.conversation import get_or_create_conversation

router = APIRouter(prefix="/ws", tags=["Socket"])

@router.websocket("/")
async def websocket_endpoint(socket: WebSocket, token: str = Query()):
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Invalid authentication token"
        )
    async with SessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user is None:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION, reason="User not found"
            )

    await manager.connect(user_id, socket)

    try:
        while True:
            data = await socket.receive_json()
            try:
                message_data = MessageModel.model_validate(data)
            except ValidationError:
                await socket.send_json({"error": "Invalid message format"})
                continue
            receiver_id = message_data.recipient_id
            if receiver_id == user_id:
                await socket.send_json({"error": "You cannot message yourself"})
                continue
            async with SessionLocal() as session:
                try:
                    result = await session.execute(
                        select(User).where(User.id == receiver_id)
                    )
                    recipient = result.scalar_one_or_none()
                    if recipient is None:
                        await socket.send_json({"error": "Recipient not found"})
                        continue

                    conversation = await get_or_create_conversation(
                        session, user_id, recipient.id
                    )
                    message = Message(
                        conversation_id=conversation.id,
                        sender_id=user_id,
                        content=message_data.content,
                    )
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
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user_id, socket)
