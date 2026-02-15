import { useState, useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket';
import { conversationApi, userApi } from '../services/api';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import CreateGroupModal from './CreateGroupModal';

export default function ChatLayout({ currentUser, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await conversationApi.getUserConversations(currentUser.id);
      setConversations(res.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [currentUser.id]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await userApi.getAll();
      setUsers((res.data || []).filter((u) => u.id !== currentUser.id));
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [currentUser.id]);

  useEffect(() => {
    // Connect WebSocket
    wsService.connect(
      currentUser.id,
      () => {
        setIsConnected(true);
        console.log('WebSocket connected successfully');
      },
      (err) => {
        console.error('WebSocket Error:', err);
        setIsConnected(false);
      }
    );

    // Load initial data
    loadConversations();
    loadUsers();

    // Update user status to online
    userApi.updateStatus(currentUser.id, 'online').catch(console.error);

    // Cleanup on unmount
    return () => {
      userApi.updateStatus(currentUser.id, 'offline').catch(console.error);
      wsService.disconnect();
    };
  }, [currentUser.id, loadConversations, loadUsers]);

  const startPrivateChat = async (otherUser) => {
    try {
      const res = await conversationApi.createPrivate(currentUser.id, otherUser.id);
      const conversation = {
        ...res.data,
        otherUser,
      };

      // Add to conversations if not already there
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversation.id);
        if (exists) {
          return prev;
        }
        return [conversation, ...prev];
      });

      setSelectedConversation(conversation);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  const handleSelectConversation = (conv) => {
    // Enrich with other user data for private chats
    if (conv.type === 'PRIVATE') {
      const otherUserId = conv.participants.find((p) => p !== currentUser.id);
      const otherUser = users.find((u) => u.id === otherUserId);
      if (otherUser) {
        conv = { ...conv, otherUser };
      }
    }
    setSelectedConversation(conv);
    
    // Mark as read
    if (conv.unreadCount?.[currentUser.id] > 0) {
      conversationApi.markAsRead(conv.id, currentUser.id).catch(console.error);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id
            ? { ...c, unreadCount: { ...c.unreadCount, [currentUser.id]: 0 } }
            : c
        )
      );
    }
  };

  const handleGroupCreated = (group) => {
    loadConversations();
    setShowCreateGroup(false);
  };

  const handleNewMessage = useCallback((conversationId) => {
    // Refresh conversations to update last message
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="chat-layout">
      <Sidebar
        currentUser={currentUser}
        conversations={conversations}
        users={users}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        onStartPrivateChat={startPrivateChat}
        onCreateGroup={() => setShowCreateGroup(true)}
        onLogout={onLogout}
        isConnected={isConnected}
      />

      <ChatWindow
        currentUser={currentUser}
        conversation={selectedConversation}
        isConnected={isConnected}
        onNewMessage={handleNewMessage}
      />

      {showCreateGroup && (
        <CreateGroupModal
          currentUser={currentUser}
          users={users}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
}
