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

type TabType = 'my-friends' | 'find-friends' | 'requests';

const FriendsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [activeTab, setActiveTab] = useState<TabType>('my-friends');
  
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestResponse[]>([]);
   
  const [allUsers, setAllUsers] = useState<FriendResponse[]>([]);
   
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

  const loadAllUsers = useCallback(async () => {
    try {
      const auditoryId = await AsyncStorage.getItem('userId');
      if (!auditoryId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      setUserAuditoryId(auditoryId);

    
      const usersData = await FriendsService.searchUsers('');
      setAllUsers(usersData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (activeTab === 'my-friends') {
      await loadFriends();
    } else if (activeTab === 'find-friends') {
      await loadAllUsers();
    } else {
    
      await loadFriends();
    }
  }, [activeTab, loadFriends, loadAllUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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
      if (activeTab === 'my-friends') {
    
        const results = await FriendsService.searchFriends(userAuditoryId, searchQuery);
        setSearchResults(results);
      } else if (activeTab === 'find-friends') {
      
        const results = await FriendsService.searchUsers(searchQuery);
        setSearchResults(results);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, userAuditoryId, activeTab]);

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
   
      const friendshipStatus = await FriendsService.checkFriendship(userAuditoryId, friendAuditoryId);
      if (friendshipStatus.isFriend) {
        Alert.alert('Info', 'This user is already your friend');
        return;
      }
 
      const pendingRequest = await FriendsService.checkPendingRequest(userAuditoryId, friendAuditoryId);
      if (pendingRequest.hasRequest) {
        Alert.alert('Info', 'Friend request already sent');
        return;
      }

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

  const renderUserCard = ({ item }: { item: FriendResponse }) => {
    const fullName = `${item.friendFirstName || ''} ${item.friendMiddleName || ''} ${item.friendLastName || ''}`.trim();

    return (
      <View style={styles.userCard}>
        <TouchableOpacity
          style={styles.userInfo}
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
            <Text style={styles.userName}>{fullName || 'Unknown'}</Text>
            <Text style={styles.userEmail}>{item.friendId}</Text>
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

  const renderSearchResultCard = ({ item }: { item: FriendResponse }) => {
    const fullName = `${item.friendFirstName || ''} ${item.friendMiddleName || ''} ${item.friendLastName || ''}`.trim();
    const isMyFriendsTab = activeTab === 'my-friends';

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
        {isMyFriendsTab ? (
          <TouchableOpacity
            style={styles.removeFriendButton}
            onPress={() => handleRemoveFriend(item.friendId)}
          >
            <Text style={styles.removeFriendButtonText}>Remove</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => handleAddFriend(item.friendId)}
          >
            <Text style={styles.addFriendButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getCurrentData = () => {
    if (searchResults.length > 0) {
      return searchResults;
    }
    if (activeTab === 'my-friends') {
      return friends;
    }
    if (activeTab === 'find-friends') {
      return allUsers;
    }
    return [];
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error && friends.length === 0 && allUsers.length === 0 && pendingRequests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentData = getCurrentData();
  const isMyFriendsTab = activeTab === 'my-friends';
  const isFindFriendsTab = activeTab === 'find-friends';
  const isRequestsTab = activeTab === 'requests';
  const showRequests = isMyFriendsTab && searchResults.length === 0 && pendingRequests.length > 0;

  return (
    <View style={styles.container}>
   
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, isMyFriendsTab && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('my-friends');
            setSearchQuery('');
            setSearchResults([]);
            setIsSearching(false);
          }}
        >
          <Text style={[styles.tabButtonText, isMyFriendsTab && styles.tabButtonTextActive]}>
            My Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, isFindFriendsTab && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('find-friends');
            setSearchQuery('');
            setSearchResults([]);
            setIsSearching(false);
          }}
        >
          <Text style={[styles.tabButtonText, isFindFriendsTab && styles.tabButtonTextActive]}>
            Find Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, isRequestsTab && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('requests');
            setSearchQuery('');
            setSearchResults([]);
            setIsSearching(false);
          }}
        >
          <View style={styles.tabButtonWithBadge}>
            <Text style={[styles.tabButtonText, isRequestsTab && styles.tabButtonTextActive]}>
              Requests
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingRequests.length > 99 ? '99+' : pendingRequests.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

   
      {!isRequestsTab && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={isMyFriendsTab ? "Search my friends..." : "Search users by name..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      )}
 
      {isRequestsTab && (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item: FriendRequestResponse) => item.id}
          renderItem={renderRequestCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyText}>No friend requests</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
 
      {!isRequestsTab && (
        <FlatList
          data={currentData as FriendResponse[]}
          keyExtractor={(item: FriendResponse) => item.id}
          renderItem={
            searchResults.length > 0
              ? renderSearchResultCard
              : isMyFriendsTab
              ? renderFriendCard
              : renderUserCard
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            isMyFriendsTab && showRequests ? (
              <>
                <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
                <FlatList
                  data={pendingRequests}
                  keyExtractor={(item: FriendRequestResponse) => item.id}
                  renderItem={renderRequestCard}
                  scrollEnabled={false}
                  contentContainerStyle={styles.requestsList}
                />
              </>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>
                {isMyFriendsTab
                  ? pendingRequests.length === 0 ? 'No friends yet' : 'No friends found'
                  : 'No users found'
                }
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabButtonTextActive: {
    color: '#007AFF',
  },
  tabButtonWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  userCard: {
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
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
  removeFriendButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  removeFriendButtonText: {
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
