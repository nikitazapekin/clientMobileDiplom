import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import chatService, { Message } from "../http/chat";
import { styles as globalStyles } from "./styles";
import { COLORS, SIZES } from "appStyles";

const chatStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.BLACK,
  },
  messages: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 8,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.GRAY_DARK,
  },
  message: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a90e2',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.WHITE,
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    fontSize: 14,
    color: COLORS.BLACK,
    lineHeight: 20,
  },
  ownMessageContent: {
    color: COLORS.WHITE,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: COLORS.GRAY,
  },
  readMark: {
    fontSize: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    gap: 12,
  },
  inputField: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.BLACK,
  },
  sendButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4a90e2',
    borderRadius: 24,
  },
  sendButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId: receiverId, participantInfo: initialParticipantInfo } = (route.params as any) || {};
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [participantInfo, setParticipantInfo] = useState<any>(initialParticipantInfo || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!receiverId) return;

    loadUserId();
  }, [receiverId]);

  useEffect(() => {
    if (currentUserId && receiverId) {
      if (!participantInfo) {
        loadParticipantInfo();
      }
      loadMessages();

      const unsubscribe = chatService.onNewMessage((message) => {
        if (
          (message.senderId === currentUserId && message.receiverId === receiverId) ||
          (message.senderId === receiverId && message.receiverId === currentUserId)
        ) {
          setMessages((prev) => [...prev, message]);
        }
      });

      chatService.onMessagesRead(({ senderId, receiverId }) => {
        if (senderId === currentUserId && receiverId === receiverId) {
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              read: true,
            })),
          );
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [receiverId, currentUserId, participantInfo]);

  useEffect(() => {
    if (currentUserId && receiverId) {
      loadMessages();
      loadParticipantInfo();

      chatService.joinConversation(currentUserId, receiverId);

      const unsubscribe = chatService.onNewMessage((message) => {
        if (
          (message.senderId === currentUserId && message.receiverId === receiverId) ||
          (message.senderId === receiverId && message.receiverId === currentUserId)
        ) {
          setMessages((prev) => [...prev, message]);
        }
      });

      chatService.onMessagesRead(({ senderId, receiverId }) => {
        if (senderId === currentUserId && receiverId === receiverId) {
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              read: true,
            })),
          );
        }
      });

      return () => {
        unsubscribe();
        chatService.leaveConversation(currentUserId, receiverId);
      };
    }
  }, [receiverId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
      if (userId) {
        chatService.connect(userId);
      }
    } catch (error) {
      console.error('Failed to load user ID:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      if (!currentUserId || !receiverId) return;

      const loadedMessages = await chatService.getConversationMessages(
        currentUserId,
        receiverId,
        50,
        0,
      );

      setMessages(loadedMessages);

      await chatService.markMessagesAsRead(receiverId, currentUserId);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantInfo = async () => {
    try {
      const info = await chatService.getUserProfile(receiverId);
      setParticipantInfo(info);
    } catch (error) {
      console.error('Failed to load participant info:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !receiverId) return;

    try {
      await chatService.sendMessage(receiverId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Не удалось отправить сообщение');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderDateSeparator = (index: number) => {
    if (index === 0) return true;
    
    const current = new Date(messages[index].createdAt);
    const previous = new Date(messages[index - 1].createdAt);
    
    return current.toDateString() !== previous.toDateString();
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === currentUserId;

    return (
      <>
        {renderDateSeparator(index) && (
          <View style={chatStyles.dateSeparator}>
            <Text style={chatStyles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
        <View
          style={[
            chatStyles.message,
            isOwn ? chatStyles.ownMessage : chatStyles.otherMessage,
          ]}
        >
          <Text
            style={[
              chatStyles.messageContent,
              isOwn ? chatStyles.ownMessageContent : null,
            ]}
          >
            {item.content}
          </Text>
          <View
            style={[
              chatStyles.messageTime,
              isOwn ? chatStyles.ownMessageTime : chatStyles.otherMessageTime,
            ]}
          >
            <Text>{formatTime(item.createdAt)}</Text>
            {isOwn && item.read && (
              <Text style={chatStyles.readMark}>✓✓</Text>
            )}
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={globalStyles.containerLight}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={chatStyles.header}>
        <TouchableOpacity
          style={chatStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={chatStyles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <View style={chatStyles.participant}>
          <View style={chatStyles.avatar}>
            <Text style={chatStyles.avatarText}>
              {participantInfo
                ? `${participantInfo.firstName[0]}${participantInfo.lastName[0]}`
                : '?'}
            </Text>
          </View>
          <Text style={chatStyles.participantName}>
            {participantInfo
              ? `${participantInfo.firstName} ${participantInfo.lastName}`
              : 'Загрузка...'}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={chatStyles.messages}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {loading ? (
          <View style={chatStyles.emptyContainer}>
            <Text style={chatStyles.emptyText}>Загрузка...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={chatStyles.emptyContainer}>
            <Text style={chatStyles.emptyText}>
              Нет сообщений. Начните диалог!
            </Text>
          </View>
        ) : (
          messages.map((message, index) => (
            <View key={message.id}>
              {renderMessage({ item: message, index })}
            </View>
          ))
        )}
      </ScrollView>

      <View style={chatStyles.inputContainer}>
        <TextInput
          style={chatStyles.inputField}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Введите сообщение..."
          placeholderTextColor={COLORS.GRAY}
        />
        <TouchableOpacity
          style={[
            chatStyles.sendButton,
            !newMessage.trim() ? chatStyles.sendButtonDisabled : null,
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={chatStyles.sendButtonText}>Отправить</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}