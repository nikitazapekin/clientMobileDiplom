import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { FriendsService, type FriendResponse, type FriendRequestResponse } from '../http/friends';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const FriendsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userAuditoryId, setUserAuditoryId] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      const auditoryId = await AsyncStorage.getItem('userId');
      if (!auditoryId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      setUserAuditoryId(auditoryId);

      const [friendsData, requestsData] = await Promise.all([
        FriendsService.getFriendsByAuditoryId(auditoryId),
        FriendsService.getPendingFriendRequests(auditoryId),
      ]);

      setFriends(friendsData);
      setPendingRequests(requestsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load friends');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };

  const handleSearch = useCallback(async () => {
    if (!userAuditoryId) return;

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await FriendsService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      console.error('Search error:', err);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, userAuditoryId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await FriendsService.acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      loadFriends();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendsService.rejectFriendRequest(requestId);
      Alert.alert('Success', 'Friend request rejected');
      loadFriends();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendAuditoryId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!userAuditoryId) return;

            try {
              await FriendsService.removeFriend(userAuditoryId, friendAuditoryId);
              Alert.alert('Success', 'Friend removed');
              loadFriends();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleFriendPress = (friendAuditoryId: string) => {
    navigation.navigate(ROUTES.STACK.FRIENDS_PROFILE as any, { auditoryId: friendAuditoryId });
  };

  const handleAddFriend = async (friendAuditoryId: string) => {
    if (!userAuditoryId) return;

    try {
      await FriendsService.sendFriendRequest(userAuditoryId, friendAuditoryId);
      Alert.alert('Success', 'Friend request sent!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send friend request');
    }
  };

  const renderFriendCard = ({ item }: { item: FriendResponse }) => {
    const fullName = `${item.friendFirstName || ''} ${item.friendMiddleName || ''} ${item.friendLastName || ''}`.trim();

    return (
      <TouchableOpacity
        style={styles.friendCard}
        onPress={() => handleFriendPress(item.friendId)}
        onLongPress={() => handleRemoveFriend(item.friendId)}
      >
        <View style={styles.avatarContainer}>
          {item.friendFirstName?.[0] ? (
            <Text style={styles.avatarText}>{item.friendFirstName[0].toUpperCase()}</Text>
          ) : (
            <Text style={styles.avatarText}>?</Text>
          )}
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{fullName || 'Unknown'}</Text>
          <Text style={styles.friendSince}>
            Friends since {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRequestCard = ({ item }: { item: FriendRequestResponse }) => {
    const fullName = `${item.senderFirstName || ''} ${item.senderMiddleName || ''} ${item.senderLastName || ''}`.trim();

    return (
      <View style={styles.requestCard}>
        <View style={styles.avatarContainer}>
          {item.senderFirstName?.[0] ? (
            <Text style={styles.avatarText}>{item.senderFirstName[0].toUpperCase()}</Text>
          ) : (
            <Text style={styles.avatarText}>?</Text>
          )}
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{fullName || 'Unknown'}</Text>
          <Text style={styles.requestDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={styles.acceptButtonText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(item.id)}
          >
            <Text style={styles.rejectButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSearchResultCard = ({ item }: { item: FriendResponse }) => {
    const fullName = `${item.friendFirstName || ''} ${item.friendMiddleName || ''} ${item.friendLastName || ''}`.trim();

    return (
      <View style={styles.searchResultCard}>
        <TouchableOpacity
          style={styles.searchResultInfo}
          onPress={() => handleFriendPress(item.friendId)}
        >
          <View style={styles.avatarContainer}>
            {item.friendFirstName?.[0] ? (
              <Text style={styles.avatarText}>{item.friendFirstName[0].toUpperCase()}</Text>
            ) : (
              <Text style={styles.avatarText}>?</Text>
            )}
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{fullName || 'Unknown'}</Text>
            <Text style={styles.friendEmail}>{item.friendId}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addFriendButton}
          onPress={() => handleAddFriend(item.friendId)}
        >
          <Text style={styles.addFriendButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  if (error && friends.length === 0 && pendingRequests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFriends}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={searchResults.length > 0 ? searchResults : friends}
        keyExtractor={(item) => item.id}
        renderItem={searchResults.length > 0 ? renderSearchResultCard : renderFriendCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          searchResults.length === 0 && pendingRequests.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
              <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.id}
                renderItem={renderRequestCard}
                scrollEnabled={false}
                contentContainerStyle={styles.requestsList}
              />
            </>
          ) : null
        }
        ListEmptyComponent={
          searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>
                {pendingRequests.length === 0 ? 'No friends yet' : 'No friends found'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  requestsList: {
    marginBottom: 16,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendSince: {
    fontSize: 13,
    color: '#666',
  },
  friendEmail: {
    fontSize: 13,
    color: '#999',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchResultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addFriendButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  addFriendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 13,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default FriendsScreen;
