import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.connectionPromise = null;
  }

  connect(userId, onConnected, onError) {
    if (this.client?.connected) {
      onConnected?.();
      return Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          console.log('STOMP: ' + str);
        },
        onConnect: () => {
          console.log('WebSocket Connected for user:', userId);
          onConnected?.();
          resolve();
        },
        onStompError: (frame) => {
          console.error('STOMP Error:', frame.headers['message']);
          console.error('Details:', frame.body);
          onError?.(frame);
          reject(frame);
        },
        onWebSocketError: (event) => {
          console.error('WebSocket Error:', event);
          onError?.(event);
        },
        onDisconnect: () => {
          console.log('WebSocket Disconnected');
        },
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  async waitForConnection() {
    if (this.client?.connected) {
      return;
    }
    if (this.connectionPromise) {
      await this.connectionPromise;
    }
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
      });
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connectionPromise = null;
    }
  }

  subscribeToConversation(conversationId, onMessage) {
    if (!this.client?.connected) {
      console.warn('WebSocket not connected, cannot subscribe to conversation');
      return null;
    }

    const subscriptionKey = `conv-${conversationId}`;
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe();
    }

    const subscription = this.client.subscribe(
      `/topic/conversation.${conversationId}`,
      (message) => {
        try {
          const chatMessage = JSON.parse(message.body);
          onMessage(chatMessage);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    );

    this.subscriptions.set(subscriptionKey, subscription);
    console.log('Subscribed to conversation:', conversationId);
    return subscription;
  }

  subscribeToTyping(conversationId, onTyping) {
    if (!this.client?.connected) {
      console.warn('WebSocket not connected, cannot subscribe to typing');
      return null;
    }

    const subscriptionKey = `typing-${conversationId}`;
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe();
    }

    const subscription = this.client.subscribe(
      `/topic/conversation.${conversationId}.typing`,
      (message) => {
        try {
          const typingInfo = JSON.parse(message.body);
          onTyping(typingInfo);
        } catch (e) {
          console.error('Error parsing typing info:', e);
        }
      }
    );

    this.subscriptions.set(subscriptionKey, subscription);
    console.log('Subscribed to typing for conversation:', conversationId);
    return subscription;
  }

  sendMessage(conversationId, senderId, senderName, content) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected, cannot send message');
      return false;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        conversationId,
        senderId,
        senderName,
        content,
        type: 'CHAT',
      }),
    });
    
    console.log('Message sent:', { conversationId, senderId, content });
    return true;
  }

  sendTyping(conversationId, senderId, senderName) {
    if (!this.client?.connected) return;

    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({
        conversationId,
        senderId,
        senderName,
        type: 'TYPING',
      }),
    });
  }

  sendStopTyping(conversationId, senderId, senderName) {
    if (!this.client?.connected) return;

    this.client.publish({
      destination: '/app/chat.stopTyping',
      body: JSON.stringify({
        conversationId,
        senderId,
        senderName,
        type: 'STOP_TYPING',
      }),
    });
  }

  unsubscribe(key) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      try {
        subscription.unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing:', e);
      }
      this.subscriptions.delete(key);
      console.log('Unsubscribed from:', key);
    }
  }

  unsubscribeFromConversation(conversationId) {
    this.unsubscribe(`conv-${conversationId}`);
    this.unsubscribe(`typing-${conversationId}`);
  }

  isConnected() {
    return this.client?.connected ?? false;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
