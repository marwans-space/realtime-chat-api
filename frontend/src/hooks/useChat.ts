import { useEffect, useRef, useState } from "react";
import { ChatSocket } from "../services/websocket";
import type { MessageInput, MessageResponse } from "../schemas/chat";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useChat(token: string | null) {
  const socketRef = useRef<ChatSocket | null>(null);

  const [status, setStatus] = useState<ConnectionStatus>(
    token ? "connecting" : "disconnected",
  );

  const [messages, setMessages] = useState<MessageResponse[]>([]);

  useEffect(() => {
    if (!token) return;

    const socket = new ChatSocket();
    socketRef.current = socket;

    socket.connect(
      token,
      (message) => {
        setMessages((previous) =>
          previous.some((existing) => existing.id === message.id)
            ? previous
            : [...previous, message],
        );
      },
      () => {
        console.error("WebSocket connection error");
      },
      () => {
        setStatus("disconnected");
      },
      () => {
        setStatus("connected");
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);
  function sendMessage(message: MessageInput) {
    if (!socketRef.current) {
      throw new Error("WebSocket is not initialized");
    }
    socketRef.current?.sendMessage(message);
  }
  return {
    status,
    messages,
    sendMessage,
  };
}
