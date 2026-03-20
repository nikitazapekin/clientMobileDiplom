import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

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

import api from './api';

class ChatService {
  private currentUserId: string | null = null;
  private messageListeners: ((message: Message) => void)[] = [];
  private readListeners: ((data: { senderId: string; receiverId: string }) => void)[] = [];

  async connect(userId: string) {
    this.currentUserId = userId;
    console.log('Chat service initialized for user:', userId);
    
    return Promise.resolve();
  }

  disconnect() {
    this.currentUserId = null;
    this.messageListeners = [];
    this.readListeners = [];
    this.connectionPromise = null;
  }

  onNewMessage(callback: (message: Message) => void) {
    this.messageListeners.push(callback);
    
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
    };
  }

  onMessagesRead(callback: (data: { senderId: string; receiverId: string }) => void) {
    this.readListeners.push(callback);
    
    return () => {
      this.readListeners = this.readListeners.filter((l) => l !== callback);
    };
  }

  async sendMessage(receiverId: string, content: string): Promise<any> {
    try {
      const response = await api.post('/chat/messages', {
        receiverId,
        content,
      });
      
      const message = response.data.data;
      
      this.messageListeners.forEach((listener) => listener(message));
      
      return response.data;
    } catch (error) {
      console.error('Failed to send message via HTTP:', error);
      throw error;
    }
  }

  joinConversation(userId1: string, userId2: string) {
    
  }

  leaveConversation(userId1: string, userId2: string) {
    
  }

  markAsRead(senderId: string, receiverId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.markMessagesAsRead(senderId, receiverId)
        .then(() => resolve({ success: true }))
        .catch(reject);
    });
  }

  async getConversationMessages(userId1: string, userId2: string, limit = 50, offset = 0): Promise<Message[]> {
    const response = await api.get(`/chat/messages/${userId1}/${userId2}`, {
      params: { limit, offset },
    });
    
    return response.data.data;
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
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
    const response = await api.get(`/profile/client/${userId}/full`);
    
    const profile = response.data;
    return {
      id: profile.id,
      clientId: profile.clientId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName,
      email: profile.email,
      fullName: profile.fullName,
    };
  }

  async getMultipleProfiles(userIds: string[]): Promise<Record<string, { firstName: string; lastName: string; fullName: string }>> {
    const response = await api.get('/users/profiles', {
      params: { ids: userIds.join(',') },
    });
    
    return response.data.data;
  }

  isConnected(): boolean {
    return true;
  }
}

export default new ChatService();
