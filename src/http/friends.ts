import AsyncStorage from '@react-native-async-storage/async-storage';
import $api from './api';

export interface FriendResponse {
  id: string;
  clientId: string;
  friendId: string;
  friendFirstName?: string;
  friendLastName?: string;
  friendMiddleName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequestResponse {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  senderFirstName?: string;
  senderLastName?: string;
  senderMiddleName?: string;
  receiverFirstName?: string;
  receiverLastName?: string;
  receiverMiddleName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFriendRequest {
  senderAuditoryId: string;
  receiverAuditoryId: string;
}

export interface SearchFriendsRequest {
  clientAuditoryId: string;
  query: string;
}

export class FriendsService {
  private static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private static getHeaders(token: string | null) {
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    };
  }

   
  static async getFriendsByAuditoryId(clientAuditoryId: string): Promise<FriendResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/friends/auditory/${clientAuditoryId}`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get friends error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch friends');
    }
  }
 
  static async searchFriends(clientAuditoryId: string, query: string): Promise<FriendResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/friends/search`,
        {
          params: { clientAuditoryId, query },
          ...this.getHeaders(token),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Search friends error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to search friends');
    }
  }
 
  static async searchUsers(query: string): Promise<FriendResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/friends/search-users`,
        {
          params: { query: query || '' },
          ...this.getHeaders(token),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Search users error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  }
 
  static async addFriend(clientAuditoryId: string, friendAuditoryId: string): Promise<FriendResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(
        '/friends',
        { clientAuditoryId, friendAuditoryId },
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Add friend error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to add friend');
    }
  }
 
  static async removeFriend(clientAuditoryId: string, friendAuditoryId: string): Promise<void> {
    try {
      const token = await this.getToken();
      await $api.delete(
        '/friends',
        {
          params: { clientAuditoryId, friendAuditoryId },
          ...this.getHeaders(token),
        }
      );
    } catch (error: any) {
      console.error('Remove friend error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to remove friend');
    }
  }
 
  static async checkFriendship(clientAuditoryId: string, friendAuditoryId: string): Promise<{ isFriend: boolean }> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        '/friends/check',
        {
          params: { clientAuditoryId, friendAuditoryId },
          ...this.getHeaders(token),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Check friendship error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check friendship');
    }
  }
 
  static async sendFriendRequest(senderAuditoryId: string, receiverAuditoryId: string): Promise<FriendRequestResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.post(
        '/friend-requests',
        { senderAuditoryId, receiverAuditoryId },
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Send friend request error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to send friend request');
    }
  }
 
  static async acceptFriendRequest(requestId: string): Promise<FriendResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.patch(
        `/friend-requests/${requestId}/accept`,
        null,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Accept friend request error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to accept friend request');
    }
  }
 
  static async rejectFriendRequest(requestId: string): Promise<FriendRequestResponse> {
    try {
      const token = await this.getToken();
      const response = await $api.patch(
        `/friend-requests/${requestId}/reject`,
        null,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Reject friend request error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to reject friend request');
    }
  }
 
  static async getPendingFriendRequests(userAuditoryId: string): Promise<FriendRequestResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/friend-requests/pending/received/${userAuditoryId}`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get pending friend requests error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending friend requests');
    }
  }
 
  static async getSentFriendRequests(userAuditoryId: string): Promise<FriendRequestResponse[]> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/friend-requests/pending/sent/${userAuditoryId}`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get sent friend requests error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch sent friend requests');
    }
  }
 
  static async cancelFriendRequest(senderAuditoryId: string, receiverAuditoryId: string): Promise<void> {
    try {
      const token = await this.getToken();
      await $api.delete(
        '/friend-requests/cancel',
        {
          params: { senderAuditoryId, receiverAuditoryId },
          ...this.getHeaders(token),
        }
      );
    } catch (error: any) {
      console.error('Cancel friend request error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to cancel friend request');
    }
  }
 
  static async checkPendingRequest(senderAuditoryId: string, receiverAuditoryId: string): Promise<{ hasRequest: boolean }> {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        '/friend-requests/check',
        {
          params: { senderAuditoryId, receiverAuditoryId },
          ...this.getHeaders(token),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Check pending request error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check pending request');
    }
  }
 
  static async getProfileByAuditoryId(auditoryId: string) {
    try {
      const token = await this.getToken();
      const response = await $api.get(
        `/profile/client/auditory/${auditoryId}/full`,
        this.getHeaders(token)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
}
