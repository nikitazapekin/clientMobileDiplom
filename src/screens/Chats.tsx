import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList, StyleSheet, Keyboard } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import chatService, { Conversation, User } from "../http/chat";
import { styles as globalStyles } from "./styles";
import { COLORS } from "appStyles";

const chatStyles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.GRAY,
  },
  conversationMessage: {
    fontSize: 14,
    color: COLORS.GRAY_DARK,
  },
  conversationEmail: {
    fontSize: 12,
    color: COLORS.GRAY,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#e53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default function ChatsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const activeTab: TabName = route.name === "Chats" ? "chats" : "chats";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
      if (userId) {
        chatService.connect(userId);
        
        const unsubscribe = chatService.onNewMessage(() => {
          
        });

        return unsubscribe;
      }
    } catch (error) {
      console.error('Failed to load user ID:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setConversations([]);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await chatService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const selectConversation = (userId: string) => {
    Keyboard.dismiss();
    (navigation as any).navigate('Chat', { userId });
  };

  const selectNewChat = (user: User) => {
    selectConversation(user.id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getLastMessageText = (conversation: Conversation) => {
    if (!conversation.lastMessage) {
      return 'Нет сообщений';
    }
    
    const { content, senderId } = conversation.lastMessage;
    const isOwnMessage = senderId === currentUserId;
    
    return isOwnMessage ? `Вы: ${content}` : content;
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const participantId = item.participant1Id === currentUserId ? item.participant2Id : item.participant1Id;
    
    return (
      <TouchableOpacity
        style={chatStyles.conversationItem}
        onPress={() => selectConversation(participantId)}
      >
        <View style={chatStyles.avatar}>
          <Text style={chatStyles.avatarText}>
            {item.participantFirstName[0]}{item.participantLastName[0]}
          </Text>
        </View>
        <View style={chatStyles.conversationInfo}>
          <View style={chatStyles.conversationHeader}>
            <Text style={chatStyles.conversationName}>
              {item.participantFirstName} {item.participantLastName}
            </Text>
            <Text style={chatStyles.conversationTime}>
              {item.lastMessage && formatTime(item.lastMessage.createdAt)}
            </Text>
          </View>
          <Text style={chatStyles.conversationMessage} numberOfLines={1}>
            {getLastMessageText(item)}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={chatStyles.unreadBadge}>
            <Text style={chatStyles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderUser = ({ item }: { item: User }) => {
    return (
      <TouchableOpacity
        style={chatStyles.conversationItem}
        onPress={() => selectNewChat(item)}
      >
        <View style={chatStyles.avatar}>
          <Text style={chatStyles.avatarText}>
            {item.firstName[0]}{item.lastName[0]}
          </Text>
        </View>
        <View style={chatStyles.conversationInfo}>
          <Text style={chatStyles.conversationName}>{item.fullName}</Text>
          <Text style={chatStyles.conversationEmail}>{item.email}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={globalStyles.containerLight}>
        <Header title="Chats" />

        <View style={chatStyles.searchContainer}>
          <TextInput
            style={chatStyles.searchInput}
            placeholder="Поиск по имени и фамилии..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={COLORS.GRAY}
          />
        </View>

        <View style={chatStyles.content}>
          {loading ? (
            <View style={chatStyles.emptyContainer}>
              <Text style={chatStyles.emptyText}>Загрузка...</Text>
            </View>
          ) : isSearching ? (
            <FlatList
              data={searchResults}
              renderItem={renderUser}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={chatStyles.emptyContainer}>
                  <Text style={chatStyles.emptyText}>Ничего не найдено</Text>
                </View>
              }
            />
          ) : conversations.length === 0 ? (
            <View style={chatStyles.emptyContainer}>
              <Text style={chatStyles.emptyText}>
                У вас пока нет сообщений{'\n'}
                Найдите собеседника через поиск
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
            />
          )}
        </View>

        <Footer activeTab={activeTab} />
      </View>
    </>
  );
}
