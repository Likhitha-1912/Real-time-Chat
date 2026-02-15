import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Users, Plus, LogOut, Circle } from 'lucide-react';

export default function Sidebar({
  currentUser,
  conversations,
  users,
  selectedConversation,
  onSelectConversation,
  onStartPrivateChat,
  onCreateGroup,
  onLogout,
  isConnected,
}) {
  const getConversationName = (conv) => {
    if (conv.type === 'GROUP') {
      return conv.groupName || 'Group Chat';
    }
    if (conv.otherUser) {
      return conv.otherUser.displayName || conv.otherUser.username;
    }
    // For private chats without enriched data, use groupName which is set by backend
    return conv.groupName || 'Chat';
  };

  const getConversationAvatar = (conv) => {
    if (conv.type === 'GROUP') {
      return <Users size={20} />;
    }
    const name = getConversationName(conv);
    return name.charAt(0).toUpperCase();
  };

  const getUnreadCount = (conv) => {
    return conv.unreadCount?.[currentUser.id] || 0;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <div className="avatar">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="username">
              {currentUser.displayName || currentUser.username}
            </span>
            <span className={`status ${isConnected ? 'online' : ''}`}>
              <Circle size={8} fill="currentColor" />
              {isConnected ? 'Online' : 'Connecting...'}
            </span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <MessageSquare size={14} />
          <span>Conversations</span>
          <button
            className="add-btn"
            onClick={onCreateGroup}
            title="Create Group"
          >
            <Plus size={14} />
          </button>
        </div>

        <ul className="conversation-list">
          {conversations.length === 0 ? (
            <li style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No conversations yet. Start chatting with a user below!
            </li>
          ) : (
            conversations.map((conv) => {
              const unread = getUnreadCount(conv);
              return (
                <li
                  key={conv.id}
                  className={`conversation-item ${
                    selectedConversation?.id === conv.id ? 'active' : ''
                  }`}
                  onClick={() => onSelectConversation(conv)}
                >
                  <div className={`conv-avatar ${conv.type === 'GROUP' ? 'group' : ''}`}>
                    {getConversationAvatar(conv)}
                  </div>
                  <div className="conv-info">
                    <span className="conv-name">{getConversationName(conv)}</span>
                    {conv.lastMessage && (
                      <span className="last-message">
                        {conv.lastMessage.content}
                      </span>
                    )}
                  </div>
                  <div className="conv-meta">
                    {conv.lastMessage?.timestamp && (
                      <span className="timestamp">
                        {formatDistanceToNow(new Date(conv.lastMessage.timestamp), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                    {unread > 0 && (
                      <span className="unread-badge">{unread}</span>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="sidebar-section sidebar-users">
        <div className="section-header">
          <Users size={14} />
          <span>Users</span>
        </div>

        <ul className="user-list">
          {users.length === 0 ? (
            <li style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No other users found
            </li>
          ) : (
            users.map((user) => (
              <li
                key={user.id}
                className="user-item"
                onClick={() => onStartPrivateChat(user)}
              >
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">
                  {user.displayName || user.username}
                </span>
                <span className={`user-status ${user.status || 'offline'}`}>
                  <Circle size={8} fill="currentColor" />
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}
