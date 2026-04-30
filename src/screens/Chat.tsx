import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS } from "appStyles";

import type { Message } from "../http/chat";
import chatService from "../http/chat";
import type { ROUTES } from "../navigation/routes";
import type { RootStackNavigationProp, RootStackParamList } from "../navigation/types";

import { styles as globalStyles } from "./styles";

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

type ChatRouteProp = RouteProp<RootStackParamList, typeof ROUTES.STACK.CHAT>;
type ChatParticipantInfo =
  NonNullable<RootStackParamList[typeof ROUTES.STACK.CHAT]["participantInfo"]>;

export default function ChatScreen() {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { userId: receiverId, participantInfo: initialParticipantInfo } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [participantInfo, setParticipantInfo] = useState<ChatParticipantInfo | null>(
    initialParticipantInfo || null,
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!receiverId) return;

    setParticipantInfo(initialParticipantInfo || null);
    setMessages([]);
    void loadUserId();
  }, [receiverId, initialParticipantInfo]);

  useEffect(() => {
    if (!currentUserId || !receiverId) {
      return;
    }

    let isActive = true;

    const isConversationMessage = (message: Message) =>
      (message.senderId === currentUserId && message.receiverId === receiverId) ||
      (message.senderId === receiverId && message.receiverId === currentUserId);

    const syncConversation = async () => {
      try {
        setLoading(true);

        const [loadedMessages, loadedParticipantInfo] = await Promise.all([
          chatService.getConversationMessages(currentUserId, receiverId, 50, 0),
          initialParticipantInfo
            ? Promise.resolve(initialParticipantInfo)
            : chatService.getUserProfile(receiverId),
        ]);

        if (!isActive) {
          return;
        }

        setMessages(loadedMessages);
        setParticipantInfo(loadedParticipantInfo);

        await chatService.markMessagesAsRead(receiverId, currentUserId);
      } catch (error) {
        console.error('Failed to load chat data:', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    chatService.joinConversation(currentUserId, receiverId);
    void syncConversation();

    const unsubscribeMessage = chatService.onNewMessage((message) => {
      if (!isConversationMessage(message) || !isActive) {
        return;
      }

      if (message.receiverId === currentUserId) {
        void chatService.markMessagesAsRead(message.senderId, currentUserId);
      }

      setMessages((prev) => {
        if (prev.some((existingMessage) => existingMessage.id === message.id)) {
          return prev;
        }

        return [...prev, message];
      });
    });

    const unsubscribeRead = chatService.onMessagesRead(({ senderId, receiverId: readReceiverId }) => {
      if (!isActive || senderId !== currentUserId || readReceiverId !== receiverId) {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          read: msg.senderId === currentUserId ? true : msg.read,
        })),
      );
    });

    return () => {
      isActive = false;
      unsubscribeMessage();
      unsubscribeRead();
      chatService.leaveConversation(currentUserId, receiverId);
    };
  }, [receiverId, currentUserId, initialParticipantInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');

      setCurrentUserId(userId);

      if (userId) {
        void chatService.connect(userId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load user ID:', error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    const content = newMessage.trim();

    if (!content || !currentUserId || !receiverId || sending) return;

    try {
      setSending(true);
      await chatService.sendMessage(receiverId, content);
      setNewMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Не удалось отправить сообщение');
    } finally {
      setSending(false);
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

  const participantInitials =
    participantInfo
      ? `${participantInfo.firstName?.[0] ?? ''}${participantInfo.lastName?.[0] ?? ''}` || '?'
      : '?';
  const participantName = participantInfo
    ? `${participantInfo.firstName ?? ''} ${participantInfo.lastName ?? ''}`.trim() || 'Без имени'
    : 'Загрузка...';

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
          <Text style={chatStyles.backButtonText}> Назад</Text>
        </TouchableOpacity>
        <View style={chatStyles.participant}>
          <View style={chatStyles.avatar}>
            <Text style={chatStyles.avatarText}>{participantInitials}</Text>
          </View>
          <Text style={chatStyles.participantName}>{participantName}</Text>
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
            !newMessage.trim() || sending ? chatStyles.sendButtonDisabled : null,
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Text style={chatStyles.sendButtonText}>Отправить</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
