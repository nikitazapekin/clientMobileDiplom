import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';

import { FriendsService, type FriendRequestResponse } from '../http/friends';
import { ProfileService } from '../http/profile';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import type { FullClientInfo } from '../http/types/profile';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type FriendsProfileRouteProp = RouteProp<RootStackParamList, 'FriendsProfile'>;

const FriendsProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FriendsProfileRouteProp>();
  const { auditoryId } = route.params;

  const [profile, setProfile] = useState<FullClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestReceived, setRequestReceived] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const myAuditoryId = await AsyncStorage.getItem('userId');
      setCurrentUserId(myAuditoryId);

      if (!myAuditoryId || !auditoryId) {
        setError('User not authenticated');
        return;
      }

      // Load profile
      const profileData = await FriendsService.getProfileByAuditoryId(auditoryId);

      // Process avatar
      if (profileData.avatar) {
        if (profileData.avatar.imageUrl && !profileData.avatar.imageUrl.startsWith('data:')) {
          profileData.avatar.imageUrl = `data:${profileData.avatar.mimeType};base64,${profileData.avatar.imageUrl}`;
        }
      }

      setProfile(profileData);

      // Check friendship status
      const [friendshipStatus, pendingRequests] = await Promise.all([
        FriendsService.checkFriendship(myAuditoryId, auditoryId).catch(() => ({ isFriend: false })),
        FriendsService.getPendingFriendRequests(myAuditoryId).catch(() => []),
      ]);

      setIsFriend(friendshipStatus.isFriend);

      // Check if there's a pending request from this user
      const requestFromUser = pendingRequests.find(req => req.senderId === profileData.clientId);
      if (requestFromUser) {
        setRequestReceived(true);
        setPendingRequestId(requestFromUser.id);
      }

      // Check if we've sent a request to this user
      const sentRequests = await FriendsService.getSentFriendRequests(myAuditoryId).catch(() => []);
      const requestToUser = sentRequests.find(req => req.receiverId === profileData.clientId);
      if (requestToUser) {
        setRequestSent(true);
        setPendingRequestId(requestToUser.id);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [auditoryId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSendFriendRequest = async () => {
    if (!currentUserId || !auditoryId) return;

    try {
      await FriendsService.sendFriendRequest(currentUserId, auditoryId);
      setRequestSent(true);
      Alert.alert('Success', 'Friend request sent!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async () => {
    if (!pendingRequestId) return;

    try {
      await FriendsService.acceptFriendRequest(pendingRequestId);
      setIsFriend(true);
      setRequestReceived(false);
      setPendingRequestId(null);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async () => {
    if (!pendingRequestId) return;

    try {
      await FriendsService.rejectFriendRequest(pendingRequestId);
      setRequestReceived(false);
      setPendingRequestId(null);
      Alert.alert('Success', 'Friend request rejected');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject friend request');
    }
  };

  const handleCancelRequest = async () => {
    if (!currentUserId || !auditoryId) return;

    try {
      await FriendsService.cancelFriendRequest(currentUserId, auditoryId);
      setRequestSent(false);
      setPendingRequestId(null);
      Alert.alert('Success', 'Friend request cancelled');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel friend request');
    }
  };

  const handleSendMessage = () => {
    Alert.alert('Message', 'Chat feature coming soon!');
    // TODO: Navigate to chat screen with this user
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!currentUserId || !auditoryId) return;

            try {
              await FriendsService.removeFriend(currentUserId, auditoryId);
              setIsFriend(false);
              Alert.alert('Success', 'Friend removed');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderActionButton = () => {
    // Already friends
    if (isFriend) {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton]}
            onPress={handleSendMessage}
          >
            <Text style={styles.actionButtonText}>💬 Написать</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={handleRemoveFriend}
          >
            <Text style={styles.actionButtonText}>❌ Удалить из друзей</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Request received (user sent us a request)
    if (requestReceived) {
      return (
        <View style={styles.buttonContainer}>
          <View style={styles.requestStatusContainer}>
            <Text style={styles.requestStatusText}>📨 Заявка в друзья</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAcceptRequest}
          >
            <Text style={styles.actionButtonText}>✓ Принять</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleRejectRequest}
          >
            <Text style={styles.actionButtonText}>✕ Отклонить</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Request sent (we sent a request)
    if (requestSent) {
      return (
        <View style={styles.buttonContainer}>
          <View style={[styles.requestStatusContainer, styles.sentStatusContainer]}>
            <Text style={styles.requestStatusText}>📤 Заявка отправлена</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelRequest}
          >
            <Text style={styles.actionButtonText}>↩️ Отозвать</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Not friends, no pending requests
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={handleSendFriendRequest}
        >
          <Text style={styles.actionButtonText}>➕ Добавить в друзья</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleSendMessage}
        >
          <Text style={styles.actionButtonText}>💬 Написать</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.avatar ? (
            <Image
              source={{ uri: profile.avatar.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {profile.firstName?.[0] || '?'}{profile.lastName?.[0] || ''}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>
          {profile.firstName} {profile.lastName}
          {profile.middleName ? ` ${profile.middleName}` : ''}
        </Text>

        <View style={styles.emailContainer}>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        {/* Action Buttons */}
        {renderActionButton()}
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Друзей</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Задач</Text>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Личная информация</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Телефон</Text>
            <Text style={styles.infoItemValue}>{profile.phone || 'Не указан'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Страна</Text>
            <Text style={styles.infoItemValue}>{profile.country || 'Не указана'}</Text>
          </View>

          {profile.description ? (
            <View style={[styles.infoItem, styles.infoItemFull]}>
              <Text style={styles.infoItemLabel}>Описание</Text>
              <Text style={styles.infoItemValue}>{profile.description}</Text>
            </View>
          ) : null}

          <View style={styles.infoItem}>
            <Text style={styles.infoItemLabel}>Зарегистрирован</Text>
            <Text style={styles.infoItemValue}>
              {new Date(profile.registeredAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {profile.lastLoginAt && (
            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Последний вход</Text>
              <Text style={styles.infoItemValue}>
                {new Date(profile.lastLoginAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, profile.isActive ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>
            {profile.isActive ? 'В сети' : 'Не в сети'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholder: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emailContainer: {
    marginBottom: 20,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#28a745',
  },
  messageButton: {
    backgroundColor: '#007AFF',
  },
  removeButton: {
    backgroundColor: '#dc3545',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  requestStatusContainer: {
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  sentStatusContainer: {
    backgroundColor: '#17a2b8',
  },
  requestStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statsContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItemFull: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  infoItemLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoItemValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#d4edda',
  },
  statusInactive: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FriendsProfileScreen;
