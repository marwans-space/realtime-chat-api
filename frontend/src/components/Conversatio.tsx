import Avatar from "./Avatar";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import type { MessageResponse } from "../schemas/chat";
import type { ConnectionStatus } from "../hooks/useChat";

export type ConversationItem = {
  id: number | null;
  peerId: number;
  username?: string;
};

type ConversationListProps = {
  conversations: ConversationItem[];
  selected: ConversationItem | null;
  search: string;
  status: ConnectionStatus;
  loading: boolean;
  loadError: string;
  latestMessage?: MessageResponse;
  onSearchChange: (value: string) => void;
  onStartConversation: () => void;
  onSelectConversation: (conversation: ConversationItem) => void;
  onRetry: () => void;
};

export default function ConversationList({
  conversations,
  selected,
  search,
  status,
  loading,
  loadError,
  latestMessage,
  onSearchChange,
  onStartConversation,
  onSelectConversation,
  onRetry,
}: ConversationListProps) {
  const visibleConversations = conversations.filter((conversation) =>
    `user ${conversation.peerId}`.includes(search.trim().toLowerCase()),
  );

  return (
    <section className={`conversation-panel${selected ? " mobile-hidden" : ""}`}>
      <header className="conversation-heading">
        <div className="panel-title-row">
          <div>
            <span className="section-eyebrow">YOUR SPACE</span>
            <h1>Messages<span className="title-dot">.</span></h1>
          </div>
          <div className="heading-actions">
            <span className="mobile-theme-toggle"><ThemeToggle /></span>
            <button
              className="new-chat-button"
              type="button"
              onClick={onStartConversation}
              aria-label="Start a new conversation"
              title="Start a new conversation"
            >
              <Icon name="plus" />
            </button>
          </div>
        </div>
        <p>Good conversations start with hello.</p>
      </header>

      <label className="search-field">
        <Icon name="search" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search conversations"
          aria-label="Search conversations by user ID"
        />
        {search && (
          <button
            type="button"
            className="search-clear"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            <Icon name="close" />
          </button>
        )}
      </label>

      <div className="list-section-label">
        <span>RECENT</span>
        {conversations.length > 0 && (
          <span className="conversation-count">{conversations.length}</span>
        )}
      </div>
      <div className="conversation-list">
        {loading && <div className="list-message">Finding your conversations...</div>}
        {!loading && loadError && (
          <div className="list-error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={onRetry}>Try again</button>
          </div>
        )}
        {!loading && !loadError && visibleConversations.map((conversation) => {
          const label = conversation.username ?? `User #${conversation.peerId}`;
          const isSelected = selected?.peerId === conversation.peerId;
          const preview = isSelected && latestMessage
            ? latestMessage.content
            : conversation.id === null
              ? "Start with a hello"
              : "Your conversation is ready";
          return (
            <button
              className={`conversation-item${isSelected ? " is-selected" : ""}`}
              key={`${conversation.id ?? "new"}-${conversation.peerId}`}
              type="button"
              onClick={() => onSelectConversation(conversation)}
            >
              <span className="conversation-avatar-wrap">
                <Avatar label={label} seed={conversation.peerId} size="large" />
                <span className="online-indicator" />
              </span>
              <span className="conversation-copy">
                <span className="conversation-name">{label}</span>
                <span className="conversation-preview">{preview}</span>
              </span>
              {isSelected && <span className="selected-indicator" />}
            </button>
          );
        })}
        {!loading && !loadError && visibleConversations.length === 0 && (
          <div className="empty-list">
            <span className="empty-list-icon">
              <Icon name={search ? "search" : "message"} />
            </span>
            <strong>{search ? "No matches just yet" : "Your space is all yours"}</strong>
            <p>
              {search
                ? "Try a different user ID."
                : "Start a conversation and bring someone in."}
            </p>
            {!search && (
              <button
                type="button"
                className="text-button"
                onClick={onStartConversation}
              >
                Start a conversation <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        )}
      </div>
      <footer className="panel-footer">
        <span className={`connection-dot ${status}`} />
        <span>
          {status === "connected"
            ? "Connected and ready"
            : status === "connecting"
              ? "Connecting..."
              : "Reconnecting soon"}
        </span>
      </footer>
    </section>
  );
}