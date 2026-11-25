import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import Avatar from "../components/Avatar";
import ConversationList from "../components/Conversatio";
import Icon from "../components/Icon";
import Message from "../components/Message";
import ThemeToggle from "../components/ThemeToggle";
import type { ConversationItem } from "../components/Conversatio";
import { useChat } from "../hooks/useChat";
import { apiRequest, searchUsers } from "../services/api";
import {
  conversationResponseSchema,
  messageResponseSchema,
  messageSchema,
} from "../schemas/chat";
import type { MessageResponse } from "../schemas/chat";
import type { UserSearchResult } from "../schemas/users";
import { z } from "zod";

const profileSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.email(),
});

type Profile = z.infer<typeof profileSchema>;

function otherUserId(
  conversation: z.infer<typeof conversationResponseSchema>,
  currentUserId: number,
) {
  return conversation.user1_id === currentUserId
    ? conversation.user2_id
    : conversation.user1_id;
}

export default function Chat() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("access_token");
  const { status, messages: incomingMessages } = useChat(token);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  const [history, setHistory] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [composerError, setComposerError] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [matchedUsers, setMatchedUsers] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState("");
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadChat() {
      try {
        const [profileData, conversationData] = await Promise.all([
          apiRequest<unknown>("/auth/me"),
          apiRequest<unknown>("/chat/conversation"),
        ]);
        const currentProfile = profileSchema.parse(profileData);
        const records = z.array(conversationResponseSchema).parse(conversationData);
        if (!active) return;
        const items = records.map((conversation) => ({
          id: conversation.id,
          peerId: otherUserId(conversation, currentProfile.id),
          username: conversation.peer_username,
        }));
        setProfile(currentProfile);
        setConversations(items);
        setLoadingHistory(Boolean(items[0]?.id));
        setSelected(items[0] ?? null);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "Couldn't load your conversations.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadChat();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected?.id) return;
    let active = true;
    apiRequest<unknown>(`/chat/conversation/${selected.id}/messages`)
      .then((result) => {
        const messages = z.array(messageResponseSchema).parse(result);
        if (active) setHistory(messages);
      })
      .catch((error: unknown) => {
        if (active) {
          setComposerError(
            error instanceof Error ? error.message : "Couldn't load this conversation.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [selected?.id]);

  useEffect(() => {
    const query = userSearch.trim();
    if (!showNewChat || !query) return;

    let active = true;
    const timeout = window.setTimeout(() => {
      setSearchingUsers(true);
      setUserSearchError("");
      void searchUsers(query)
        .then((users) => {
          if (active) setMatchedUsers(users);
        })
        .catch((error: unknown) => {
          if (active) {
            setUserSearchError(
              error instanceof Error ? error.message : "Couldn't search users.",
            );
          }
        })
        .finally(() => {
          if (active) setSearchingUsers(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [showNewChat, userSearch]);

  const conversationsWithIncoming = [...conversations];
  for (const message of incomingMessages) {
    const existingIndex = conversationsWithIncoming.findIndex(
      (item) =>
        item.id === message.conversation_id ||
        item.peerId === message.sender_id,
    );
    if (existingIndex >= 0) {
      const conversation = conversationsWithIncoming[existingIndex];
      conversationsWithIncoming[existingIndex] = {
        ...conversation,
        id: conversation.id ?? message.conversation_id,
        username: conversation.username ?? message.sender_username ?? undefined,
      };
    } else {
      conversationsWithIncoming.unshift({
        id: message.conversation_id,
        peerId: message.sender_id,
        username: message.sender_username ?? undefined,
      });
    }
  }
  const combinedMessages = selected?.id
    ? [
        ...history.filter((message) => message.conversation_id === selected.id),
        ...incomingMessages.filter(
          (message) => message.conversation_id === selected.id,
        ),
      ]
    : [];
  const seenMessageIds = new Set<number>();
  const activeMessages = combinedMessages
    .filter((message) => {
      if (seenMessageIds.has(message.id)) return false;
      seenMessageIds.add(message.id);
      return true;
    })
    .sort((left, right) => {
      const timeDifference =
        Date.parse(left.created_at) - Date.parse(right.created_at);
      return timeDifference || left.id - right.id;
    });

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, selected?.id]);

  function openNewChat() {
    setUserSearch("");
    setMatchedUsers([]);
    setSearchingUsers(false);
    setUserSearchError("");
    setShowNewChat(true);
  }

  function closeNewChat() {
    setShowNewChat(false);
    setUserSearch("");
    setMatchedUsers([]);
    setSearchingUsers(false);
    setUserSearchError("");
  }

  function startConversation(user: UserSearchResult) {
    const existing = conversations.find((conversation) => conversation.peerId === user.id);
    const conversation: ConversationItem = existing
      ? { ...existing, username: user.username }
      : { id: null, peerId: user.id, username: user.username };
    setConversations((current) => [
      conversation,
      ...current.filter((item) => item.peerId !== user.id),
    ]);
    setSelected(conversation);
    setLoadingHistory(Boolean(conversation.id));
    setSearch("");
    closeNewChat();
    setComposerError("");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!selected || !content || sending) return;

    const payload = messageSchema.safeParse({
      recipient_id: selected.peerId,
      content,
    });
    if (!payload.success) {
      setComposerError(payload.error.issues[0]?.message ?? "Enter a valid message.");
      return;
    }

    setSending(true);
    setComposerError("");
    try {
      const response = await apiRequest<unknown>("/chat/messages", {
        method: "POST",
        body: JSON.stringify(payload.data),
      });
      const savedMessage = messageResponseSchema.parse(response);
      setHistory((current) => [...current, savedMessage]);
      setSelected((current) =>
        current?.peerId === selected.peerId
          ? { ...current, id: savedMessage.conversation_id }
          : current,
      );
      setConversations((current) => {
        const rest = current.filter((item) => item.peerId !== selected.peerId);
        return [
          {
            id: savedMessage.conversation_id,
            peerId: selected.peerId,
            username: selected.username,
          },
          ...rest,
        ];
      });
      setDraft("");
    } catch (error) {
      setComposerError(
        error instanceof Error ? error.message : "Your message couldn't be sent.",
      );
    } finally {
      setSending(false);
    }
  }

  function signOut() {
    setShowProfileOptions(false);
    sessionStorage.removeItem("access_token");
    navigate("/login", { replace: true });
  }

  const selectedConversation = selected
    ? conversationsWithIncoming.find(
        (conversation) => conversation.peerId === selected.peerId,
      )
    : undefined;
  const selectedLabel = selected
    ? selected.username ??
      selectedConversation?.username ??
      `User #${selected.peerId}`
    : "";
  const latestMessage = selected
    ? activeMessages[activeMessages.length - 1]
    : undefined;

  return (
    <main className={`chat-app min-h-screen${selected ? " has-selection" : ""}`}>
      <aside className="nav-rail" aria-label="Main navigation">
        <a className="rail-brand brand-mark" href="/chat" aria-label="Loop home">
          <Icon name="message" />
        </a>
        <button className="rail-button is-active" type="button" aria-label="Messages">
          <Icon name="message" />
          <span className="rail-active-dot" />
        </button>
        <div className="rail-spacer" />
        <ThemeToggle />
        {profile && (
          <button
            className="rail-profile"
            type="button"
            onClick={() => setShowProfileOptions(true)}
            aria-label={`Profile options for ${profile.username}`}
            aria-haspopup="dialog"
            title={profile.username}
          >
            <Avatar label={profile.username} seed={profile.id} />
          </button>
        )}
      </aside>

      <ConversationList
        conversations={conversationsWithIncoming}
        selected={selected}
        search={search}
        status={status}
        loading={loading}
        loadError={loadError}
        latestMessage={latestMessage}
        onSearchChange={setSearch}
        onStartConversation={openNewChat}
        onSelectConversation={(conversation) => {
          setSelected(conversation);
          setLoadingHistory(Boolean(conversation.id));
          setComposerError("");
        }}
        onRetry={() => window.location.reload()}
      />

      <section className={`chat-panel${selected ? " mobile-visible" : " mobile-hidden"}`} aria-label="Conversation">
        {selected ? (
          <>
            <header className="chat-header">
              <button
                className="back-button"
                type="button"
                onClick={() => {
                  setSelected(null);
                  setLoadingHistory(false);
                }}
                aria-label="Back to conversations"
              >
                <Icon name="arrow-left" />
              </button>
              <Avatar label={selectedLabel} seed={selected.peerId} size="large" />
              <div className="chat-person">
                <h2>{selectedLabel}</h2>
                <span><i className={`status-pip ${status}`} />{status === "connected" ? "Here for a chat" : "Connecting..."}</span>
              </div>
              <div className="chat-header-note">
                <span className="header-note-star">✳</span>
                <span>A little hello goes a long way</span>
              </div>
            </header>
            <div className="message-area">
              <div className="conversation-intro">
                <Avatar label={selectedLabel} seed={selected.peerId} size="large" />
                <h3>{selectedLabel}</h3>
                <p>This is the beginning of something good.</p>
                <span className="today-pill">TODAY</span>
              </div>
              {loadingHistory && <p className="message-loading">Opening your conversation...</p>}
              {!loadingHistory && activeMessages.length === 0 && (
                <div className="first-message-hint">
                  <span aria-hidden="true">✦</span>
                  <p>Every great conversation starts somewhere.<br />Say hello when you’re ready.</p>
                </div>
              )}
              {activeMessages.map((message, index) => {
                const previous = activeMessages[index - 1];
                const showSender = !previous || previous.sender_id !== message.sender_id;
                return (
                  <Message
                    key={message.id}
                    message={message}
                    currentUserId={profile?.id ?? null}
                    peerId={selected.peerId}
                    peerLabel={selectedLabel}
                    showSender={showSender}
                  />
                );
              })}
              <div ref={feedEndRef} />
            </div>
            <div className="composer-wrap">
              {composerError && <p className="composer-error" role="alert">{composerError}</p>}
              <form className="message-composer" onSubmit={sendMessage}>
                <div className="composer-input-wrap">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a message..."
                    aria-label="Write a message"
                    maxLength={5000}
                  />
                  <span className="composer-hint">Press Enter to send</span>
                </div>
                <button className="send-button" type="submit" disabled={!draft.trim() || sending} aria-label="Send message">
                  {sending ? <span className="send-spinner" /> : <Icon name="send" />}
                </button>
              </form>
              <p className="composer-caption">A little kindness looks good on everyone <span aria-hidden="true">✦</span></p>
            </div>
          </>
        ) : (
          <div className="welcome-panel">
            <span className="welcome-art" aria-hidden="true">
              <span className="welcome-orbit" />
              <span className="welcome-bubble bubble-one"><Icon name="message" /></span>
              <span className="welcome-bubble bubble-two">✦</span>
              <span className="welcome-sparkle">✳</span>
            </span>
            <span className="section-eyebrow">A LITTLE SPACE FOR YOUR PEOPLE</span>
            <h2>Make room for<br />a good conversation.</h2>
            <p>Pick up where you left off, or start a new conversation with someone you know.</p>
            <button className="primary-button welcome-button" type="button" onClick={openNewChat}>
              Start a conversation <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </section>

      {showNewChat && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeNewChat();
          }}
        >
          <section className="new-chat-dialog" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
            <button className="dialog-close" type="button" onClick={closeNewChat} aria-label="Close dialog">
              <Icon name="close" />
            </button>
            <span className="dialog-icon"><Icon name="message" /></span>
            <span className="form-kicker">A NEW HELLO</span>
            <h2 id="new-chat-title">Who’s on your mind?</h2>
            <p>Search for someone by their username to start a conversation.</p>
            <label className="field-label" htmlFor="user-search">Username</label>
            <div className="input-wrap">
                <Icon name="user" />
                <input
                  autoFocus
                  id="user-search"
                  placeholder="Search usernames"
                  value={userSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    setUserSearch(value);
                    setMatchedUsers([]);
                    setUserSearchError("");
                    setSearchingUsers(Boolean(value.trim()));
                  }}
                  aria-describedby="user-search-status"
                />
            </div>
            <div className="user-search-results" id="user-search-status" aria-live="polite">
              {searchingUsers && <span className="user-search-message">Looking for people...</span>}
              {!searchingUsers && userSearchError && (
                <span className="user-search-error" role="alert">{userSearchError}</span>
              )}
              {!searchingUsers && !userSearchError && userSearch.trim() && matchedUsers.length === 0 && (
                <span className="user-search-message">No users found. Try another username.</span>
              )}
              {!searchingUsers && !userSearchError && matchedUsers.map((user) => (
                <button
                  className="user-search-result"
                  key={user.id}
                  type="button"
                  onClick={() => startConversation(user)}
                  aria-label={`Start a conversation with ${user.username}`}
                >
                  <Avatar label={user.username} seed={user.id} />
                  <span className="user-result-copy">
                    <strong>{user.username}</strong>
                    <small>User ID {user.id}</small>
                  </span>
                  <span className="user-result-arrow" aria-hidden="true">→</span>
                </button>
              ))}
              {!userSearch.trim() && (
                <span className="user-search-message">Type a username to see matching people.</span>
              )}
            </div>
          </section>
        </div>
      )}
      {showProfileOptions && profile && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowProfileOptions(false);
            }
          }}
        >
          <section
            className="new-chat-dialog profile-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-options-title"
          >
            <button
              className="dialog-close"
              type="button"
              onClick={() => setShowProfileOptions(false)}
              aria-label="Close profile options"
            >
              <Icon name="close" />
            </button>
            <div className="profile-summary">
              <Avatar label={profile.username} seed={profile.id} size="large" />
              <div>
                <span className="form-kicker">YOUR ACCOUNT</span>
                <h2 id="profile-options-title">{profile.username}</h2>
                <p>{profile.email}</p>
              </div>
            </div>
            <div className="profile-actions">
              <button className="profile-action" type="button" disabled>
                <span>
                  <strong>Edit Profile</strong>
                  <small>Update your account details</small>
                </span>
                <span className="profile-coming-soon">Coming soon</span>
              </button>
              <button
                className="profile-action profile-sign-out"
                type="button"
                onClick={signOut}
              >
                <strong>Sign out</strong>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
