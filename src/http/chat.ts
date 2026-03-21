import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import api, { BASE_URL } from './api';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  participantFirstName: string;
  participantLastName: string;
  participantAvatar?: string;
}

export interface User {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  fullName: string;
}

interface SocketMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

interface SocketStatusResponse {
  success: boolean;
  error?: string;
}

class ChatService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private messageListeners: ((message: Message) => void)[] = [];
  private readListeners: ((data: { senderId: string; receiverId: string }) => void)[] = [];

  private readonly handleNewMessage = (message: Message) => {
    this.messageListeners.forEach((listener) => listener(message));
  };

  private readonly handleMessagesRead = (data: { senderId: string; receiverId: string }) => {
    this.readListeners.forEach((listener) => listener(data));
  };

  private cleanupSocket() {
    if (!this.socket) {
      return;
    }

    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('connect_error');
    this.socket.off('newMessage', this.handleNewMessage);
    this.socket.off('messagesRead', this.handleMessagesRead);
    this.socket.disconnect();
    this.socket = null;
  }

  async connect(userId: string) {
    if (this.currentUserId === userId && this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }

      return;
    }

    this.cleanupSocket();
    this.currentUserId = userId;

    this.socket = io(BASE_URL, {
      query: { userId },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error);
    });

    this.socket.on('newMessage', this.handleNewMessage);
    this.socket.on('messagesRead', this.handleMessagesRead);
  }

  disconnect() {
    this.cleanupSocket();
    this.currentUserId = null;
    this.messageListeners = [];
    this.readListeners = [];
  }

  onNewMessage(callback: (message: Message) => void) {
    this.messageListeners.push(callback);

    return () => {
      this.messageListeners = this.messageListeners.filter((listener) => listener !== callback);
    };
  }

  onMessagesRead(callback: (data: { senderId: string; receiverId: string }) => void) {
    this.readListeners.push(callback);

    return () => {
      this.readListeners = this.readListeners.filter((listener) => listener !== callback);
    };
  }

  async sendMessage(receiverId: string, content: string): Promise<Message> {
    if (!this.socket || !this.currentUserId) {
      throw new Error('Not connected to chat server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        'sendMessage',
        { receiverId, content, senderId: this.currentUserId },
        (response: SocketMessageResponse) => {
          if (response.success && response.message) {
            resolve(response.message);
          } else {
            reject(new Error(response.error || 'Failed to send message'));
          }
        },
      );
    });
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const response = await api.get(`/chat/conversations/${userId}`);

    return response.data.data ?? [];
  }

  joinConversation(userId1: string, userId2: string) {
    if (!this.socket) {
      return;
    }

    this.socket.emit('joinConversation', { userId1, userId2 });
  }

  leaveConversation(userId1: string, userId2: string) {
    if (!this.socket) {
      return;
    }

    this.socket.emit('leaveConversation', { userId1, userId2 });
  }

  markAsRead(senderId: string, receiverId: string): Promise<SocketStatusResponse> {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        'markAsRead',
        { senderId, receiverId },
        (response: SocketStatusResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Failed to mark as read'));
          }
        },
      );
    });
  }

  async getConversationMessages(userId1: string, userId2: string, limit = 50, offset = 0): Promise<Message[]> {
    const response = await api.get(`/chat/messages/${userId1}/${userId2}`, {
      params: { limit, offset },
    });

    return response.data.data;
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    if (this.socket) {
      await this.markAsRead(senderId, receiverId);

      return;
    }

    await api.post(`/chat/mark-read/${senderId}/${receiverId}`);
  }

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/chat/unread-count');

    return response.data.data.count;
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get('/users/search', {
      params: { q: query },
    });

    return response.data.data;
  }

  async getUserProfile(userId: string): Promise<User> {
    try {
      const response = await api.get(`/users/profile/${userId}`);
      const profile = response.data.data ?? response.data;

      return {
        id: profile.id,
        clientId: profile.clientId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        middleName: profile.middleName,
        email: profile.email,
        fullName: profile.fullName,
      };
    } catch {
      const response = await api.get(`/profile/client/${userId}/full`);
      const profile = response.data.data ?? response.data;

      return {
        id: profile.auditoryId ?? profile.id,
        clientId: profile.clientId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        middleName: profile.middleName,
        email: profile.email,
        fullName:
          profile.fullName ?? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim(),
      };
    }
  }

  async getMultipleProfiles(userIds: string[]): Promise<Record<string, { firstName: string; lastName: string; fullName: string }>> {
    const response = await api.get('/users/profiles', {
      params: { ids: userIds.join(',') },
    });

    return response.data.data;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export default new ChatService();
