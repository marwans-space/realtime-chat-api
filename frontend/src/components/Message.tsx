import Avatar from "./Avatar";
import Icon from "./Icon";
import type { MessageResponse } from "../schemas/chat";

type MessageProps = {
  message: MessageResponse;
  currentUserId: number | null;
  peerId: number;
  peerLabel: string;
  showSender: boolean;
};

function displayTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Message({
  message,
  currentUserId,
  peerId,
  peerLabel,
  showSender,
}: MessageProps) {
  const own = message.sender_id === currentUserId;

  return (
    <div className={`message-row${own ? " message-own" : ""}${showSender ? " message-first" : ""}`}>
      {!own && (
        <span className="message-avatar-slot">
          {showSender && <Avatar label={peerLabel} seed={peerId} />}
        </span>
      )}
      <div className="message-content">
        {showSender && (
          <span className="message-sender">{own ? "You" : peerLabel}</span>
        )}
        <p className="message-bubble">{message.content}</p>
        <span className="message-time">
          {displayTime(message.created_at)}
          {own && <Icon name="check-double" />}
        </span>
      </div>
    </div>
  );
}