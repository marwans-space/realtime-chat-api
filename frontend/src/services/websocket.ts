import { messageResponseSchema } from "../schemas/chat";
import type { MessageInput, MessageResponse } from "../schemas/chat";

const API_URL = import.meta.env.VITE_API_URL;

const WS_URL = API_URL.replace(/^http/, "ws");

export class ChatSocket {
  private socket: WebSocket | null = null;

  connect(
    token: string,
    onMessage: (message: MessageResponse) => void,
    onError?: (error: Event) => void,
    onClose?: () => void,
    onOpen?: () => void,
  ) {
    this.socket = new WebSocket(
      `${WS_URL}/ws/?token=${encodeURIComponent(token)}`,
    );
    this.socket.onmessage = (event) => {
      try {
        const data: unknown = JSON.parse(event.data);
        const message = messageResponseSchema.parse(data);
        onMessage(message);
      } catch (err) {
        console.error("Invalid WebSocket Message:", err);
      }
    };
    this.socket.onerror = (error) => {
      onError?.(error);
    };
    this.socket.onclose = () => {
      onClose?.();
    };
    this.socket.onopen = () => {
      onOpen?.();
    };
  }
  sendMessage(message: MessageInput) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    this.socket.send(JSON.stringify(message));
  }
  disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}
