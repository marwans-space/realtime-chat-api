import logging

from fastapi import WebSocket, WebSocketDisconnect

from models.messages import Message

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connection: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, socket: WebSocket):
        await socket.accept()
        self.active_connection[user_id] = socket

    def disconnect(self, user_id: int, socket: WebSocket | None = None):
        if socket is not None and self.active_connection.get(user_id) is not socket:
            return
        self.active_connection.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: int):
        socket = self.active_connection.get(user_id)

        if socket:
            try:
                await socket.send_json(message)
            except (OSError, RuntimeError, WebSocketDisconnect):
                logger.warning(
                    "WebSocket delivery failed for user %s; the message remains saved",
                    user_id,
                )
                self.disconnect(user_id, socket)


manager = ConnectionManager()
