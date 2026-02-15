import { useState, useEffect, useRef, useCallback } from 'react';
import { wsService } from '../services/websocket';
import { messageApi } from '../services/api';
import { format } from 'date-fns';
import { Send, Users, MessageCircle } from 'lucide-react';

export default function ChatWindow({ currentUser, conversation, isConnected, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversation?.id) return;
    
    setLoading(true);
    try {
      const res = await messageApi.getMessages(conversation.id);
      // Messages come in descending order, reverse for display
      setMessages((res.data || []).reverse());
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation?.id || !isConnected) return;

    // Load messages
    loadMessages();

    // Subscribe to conversation
    const messageSubscription = wsService.subscribeToConversation(
      conversation.id,
      (msg) => {
        console.log('Received message:', msg);
        setMessages((prev) => [...prev, msg]);
        onNewMessage?.(conversation.id);
      }
    );

    // Subscribe to typing indicators
    const typingSubscription = wsService.subscribeToTyping(
      conversation.id,
      (typingInfo) => {
        if (typingInfo.senderId === currentUser.id) return;

        if (typingInfo.type === 'TYPING') {
          setTypingUsers((prev) => {
            if (!prev.find((u) => u.id === typingInfo.senderId)) {
              return [...prev, { id: typingInfo.senderId, name: typingInfo.senderName }];
            }
            return prev;
          });

          // Auto-remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((u) => u.id !== typingInfo.senderId)
            );
          }, 3000);
        } else {
          setTypingUsers((prev) =>
            prev.filter((u) => u.id !== typingInfo.senderId)
          );
        }
      }
    );

    // Focus input
    inputRef.current?.focus();

    return () => {
      wsService.unsubscribeFromConversation(conversation.id);
      setMessages([]);
      setTypingUsers([]);
    };
  }, [conversation?.id, isConnected, currentUser.id, loadMessages, onNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleTyping = useCallback(() => {
    if (!conversation?.id || !isConnected) return;

    wsService.sendTyping(
      conversation.id,
      currentUser.id,
      currentUser.displayName || currentUser.username
    );

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      wsService.sendStopTyping(
        conversation.id,
        currentUser.id,
        currentUser.displayName || currentUser.username
      );
    }, 2000);
  }, [conversation?.id, currentUser, isConnected]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected || !conversation?.id) return;

    const sent = wsService.sendMessage(
      conversation.id,
      currentUser.id,
      currentUser.displayName || currentUser.username,
      newMessage.trim()
    );

    if (sent) {
      // Stop typing indicator
      wsService.sendStopTyping(
        conversation.id,
        currentUser.id,
        currentUser.displayName || currentUser.username
      );
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!conversation) {
    return (
      <main className="chat-window empty">
        <div className="empty-state">
          <MessageCircle />
          <h2>Welcome to ChatApp</h2>
          <p>Select a conversation or start chatting with a user</p>
        </div>
      </main>
    );
  }

  const conversationName =
    conversation.type === 'GROUP'
      ? conversation.groupName
      : conversation.otherUser?.displayName ||
        conversation.otherUser?.username ||
        conversation.groupName ||
        'Chat';

  return (
    <main className="chat-window">
      <header className="chat-header">
        <div className={`chat-header-avatar ${conversation.type === 'GROUP' ? 'group' : ''}`}>
          {conversation.type === 'GROUP' ? (
            <Users size={20} />
          ) : (
            conversationName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="chat-title">
          <h2>{conversationName}</h2>
          {conversation.type === 'GROUP' && (
            <span className="member-count">
              {conversation.participants?.length || 0} members
            </span>
          )}
        </div>
      </header>

      <div className="messages-container">
        {loading ? (
          <div className="empty-state">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`message ${
                msg.senderId === currentUser.id ? 'sent' : 'received'
              }`}
            >
              {msg.senderId !== currentUser.id && conversation.type === 'GROUP' && (
                <span className="sender-name">{msg.senderName}</span>
              )}
              <div className="message-content">{msg.content}</div>
              <span className="message-time">
                {msg.timestamp
                  ? format(new Date(msg.timestamp), 'HH:mm')
                  : ''}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          <span className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
          {typingUsers.map((u) => u.name).join(', ')}{' '}
          {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <form className="message-input" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (e.target.value) handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected}
          title="Send message"
        >
          <Send size={20} />
        </button>
      </form>
    </main>
  );
}
