from fastapi import WebSocket

from app.models.messages import Message


class ConnectionManager:
    def __init__(self):
        self.active_connection: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, socket: WebSocket):
        await socket.accept()
        self.active_connection[user_id] = socket

    def disconnect(self, user_id: int):
        self.active_connection.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: int):
        socket = self.active_connection.get(user_id)

        if socket:
            await socket.send_json(message)
