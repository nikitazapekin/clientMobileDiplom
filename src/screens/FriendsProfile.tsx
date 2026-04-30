import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { FriendsService, type FriendRequestResponse } from '../http/friends';
import { ProfileService } from '../http/profile';
import { CertificateService } from '../http/certificate';
import type { CertificateResponse } from '../http/certificate';
import { CodingTasksService, type CodeTask, type StudentLevel } from '../http/codingTasksService';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';
import type { FullClientInfo } from '../http/types/profile';
import { COLORS } from 'appStyles';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type FriendsProfileRouteProp = RouteProp<RootStackParamList, 'FriendsProfile'>;
 
const SECTION_HORIZONTAL_MARGIN = 20;
const SECTION_PADDING = 20;
const certSlideWidth = Dimensions.get('window').width - (SECTION_HORIZONTAL_MARGIN + SECTION_PADDING) * 2;
 
const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.28;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2 - 10;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
 
const DIFFICULTIES: Record<string, { label: string; color: string }> = {
  easy: { label: "Легкий", color: "#4caf50" },
  medium: { label: "Средний", color: "#ff9800" },
  hard: { label: "Сложный", color: "#f44336" },
};
 
const CircularProgress = ({
  progress,
  level,
  experience,
  nextLevelExp
}: {
  progress: number;
  level: number;
  experience: number;
  nextLevelExp: number;
}) => {
  const strokeWidth = 8;
  const center = CIRCLE_SIZE / 2;
  const radius = CIRCLE_RADIUS;
  const circumference = CIRCLE_CIRCUMFERENCE;
 
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={styles.circularProgressContainer}>
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
     
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.GRAY_200}
          strokeWidth={strokeWidth}
          fill="none"
        />
 
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.ACCENT}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
 
        <SvgText
          x={center}
          y={center - 8}
          fontSize="20"
          fontWeight="bold"
          fill={COLORS.GRAY_900}
          textAnchor="middle"
        >
          {level}
        </SvgText>

        <SvgText
          x={center}
          y={center + 16}
          fontSize="12"
          fill={COLORS.GRAY_500}
          textAnchor="middle"
        >
          УРОВЕНЬ
        </SvgText>
      </Svg>

      <View style={styles.expInfoContainer}>
        <Text style={styles.expValue}>{experience}</Text>
        <Text style={styles.expSeparator}>/</Text>
        <Text style={styles.expTotal}>{nextLevelExp}</Text>
        <Text style={styles.expLabel}>XP</Text>
      </View>
    </View>
  );
};
 
const SolvedTaskCard = ({
  task,
  solvedAt,
  onPress
}: {
  task: CodeTask;
  solvedAt: string;
  onPress: () => void;
}) => {
  const diffInfo = DIFFICULTIES[task.difficulty] || DIFFICULTIES.easy;
 
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    if (diffDays < 7) return `${diffDays} дня назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity
      style={[styles.taskCard, styles.taskCardSolved]}
      onPress={onPress}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={1}>
           {task.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: diffInfo.color }]}>
          <Text style={styles.badgeText}>{diffInfo.label}</Text>
        </View>
      </View>
   
      <View style={styles.taskFooter}>
        <Text style={styles.taskMeta}>
          {(task.languages || []).join(", ")} | {task.testCases?.length ?? 0} тестов
        </Text>
        <View style={styles.solvedDateBadge}>
          <Text style={styles.solvedDateText}>{formatDate(solvedAt)}</Text>
        </View>
      </View>
      <View style={styles.taskFooter}>
        <Text style={styles.authorText}>Автор: {task.authorName}</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>+{task.experienceReward} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
 
const SolvedTasksPreview = ({
  solvedTasks,
  allTasks,
  onViewAll,
  onTaskPress
}: {
  solvedTasks: Array<{ codeTaskId: string; solvedAt: string }>;
  allTasks: CodeTask[];
  onViewAll: () => void;
  onTaskPress: (taskId: string) => void;
}) => {
  
  const recentSolved = [...solvedTasks]
    .sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime())
    .slice(0, 4);

  if (recentSolved.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Решенные задачи</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllLink}>Просмотреть все</Text>
        </TouchableOpacity>
      </View>

      {recentSolved.map((solved) => {
        const task = allTasks.find(t => t.id === solved.codeTaskId);
        if (!task) return null;

        return (
          <SolvedTaskCard
            key={solved.codeTaskId}
            task={task}
            solvedAt={solved.solvedAt}
            onPress={() => onTaskPress(task.id)}
          />
        );
      })}
    </View>
  );
}; 
const AllSolvedTasksModal = ({
  visible,
  onClose,
  solvedTasks,
  allTasks,
  onTaskPress
}: {
  visible: boolean;
  onClose: () => void;
  solvedTasks: Array<{ codeTaskId: string; solvedAt: string }>;
  allTasks: CodeTask[];
  onTaskPress: (taskId: string) => void;
}) => {
  
  const sortedTasks = [...solvedTasks].sort(
    (a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Все решенные задачи</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={sortedTasks}
            keyExtractor={(item) => item.codeTaskId}
            contentContainerStyle={styles.modalListContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const task = allTasks.find(t => t.id === item.codeTaskId);
              if (!task) return null;

              return (
                <SolvedTaskCard
                  task={task}
                  solvedAt={item.solvedAt}
                  onPress={() => {
                    onClose();
                    onTaskPress(task.id);
                  }}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
              
                <Text style={styles.emptyText}>У пользователя еще нет решенных задач</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

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
 
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [activeCertIndex, setActiveCertIndex] = useState(0);
  const [codingTasks, setCodingTasks] = useState<CodeTask[]>([]);
  const [studentLevel, setStudentLevel] = useState<StudentLevel | null>(null);
  const [codingLoading, setCodingLoading] = useState(false);
  const [showAllSolvedModal, setShowAllSolvedModal] = useState(false);

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
 
      const profileData = await FriendsService.getProfileByAuditoryId(auditoryId);
 
      if (profileData.avatar) {
        if (profileData.avatar.imageUrl && !profileData.avatar.imageUrl.startsWith('data:')) {
          profileData.avatar.imageUrl = `data:${profileData.avatar.mimeType};base64,${profileData.avatar.imageUrl}`;
        }
      }

      setProfile(profileData);
 
      setCertificatesLoading(true);
      try {
        const certs = await CertificateService.getCertificatesByAuditoryId(auditoryId);
        setCertificates(certs);
      } catch (certErr) {
        console.error('Failed to load certificates:', certErr);
      } finally {
        setCertificatesLoading(false);
      }
 
      setCodingLoading(true);
      try {
        const [tasksData, levelData] = await Promise.all([
          CodingTasksService.getAllTasks(),
          profileData.clientId 
            ? CodingTasksService.getStudentLevelByClientId(profileData.clientId).catch(() => null)
            : Promise.resolve(null),
        ]);
        setCodingTasks(tasksData);
        setStudentLevel(levelData);
      } catch (codingErr) {
        console.error('Failed to load coding tasks:', codingErr);
      } finally {
        setCodingLoading(false);
      }
 
      const [friendshipStatus, pendingRequests, friendsData] = await Promise.all([
        FriendsService.checkFriendship(myAuditoryId, auditoryId).catch(() => ({ isFriend: false })),
        FriendsService.getPendingFriendRequests(myAuditoryId).catch(() => []),
        FriendsService.getFriendsByAuditoryId(myAuditoryId).catch(() => []),
      ]);

      const isFriendByList = friendsData.some((friend) => friend.friendId === auditoryId);

      setIsFriend(friendshipStatus.isFriend || isFriendByList);
 
      const requestFromUser = pendingRequests.find(req => req.senderId === profileData.clientId);
      if (requestFromUser) {
        setRequestReceived(true);
        setPendingRequestId(requestFromUser.id);
      }
 
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
    navigation.navigate(ROUTES.STACK.CHAT as any, { 
      userId: profile?.auditoryId,
      participantInfo: {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
      }
    });
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

  const handleTaskPress = (taskId: string) => {
    navigation.navigate(ROUTES.STACK.CODING_SOLVE as any, { id: taskId });
  };
 
  const getRequiredExp = (level: number) => Math.pow(10, level - 1);

  const currentLevel = studentLevel?.level || 1;
  const currentExp = studentLevel?.experience || 0;
  const requiredExp = getRequiredExp(currentLevel);
  const progress = currentExp / requiredExp;

  const solvedTasksCount = studentLevel?.solvedTasks?.length ?? 0;

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
   
    if (isFriend) {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton]}
            onPress={handleSendMessage}
          >
            <Text style={styles.actionButtonText}> Написать</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={handleRemoveFriend}
          >
            <Text style={styles.actionButtonText}> Удалить из друзей</Text>
          </TouchableOpacity>
        </View>
      );
    }
 
    if (requestReceived) {
      return (
        <View style={styles.buttonContainer}>
          <View style={styles.requestStatusContainer}>
            <Text style={styles.requestStatusText}> Заявка в друзья</Text>
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
 
    if (requestSent) {
      return (
        <View style={styles.buttonContainer}>
          <View style={[styles.requestStatusContainer, styles.sentStatusContainer]}>
            <Text style={styles.requestStatusText}> Заявка отправлена</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelRequest}
          >
            <Text style={styles.actionButtonText}> Отозвать</Text>
          </TouchableOpacity>
        </View>
      );
    }
 
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={handleSendFriendRequest}
        >
          <Text style={styles.actionButtonText}>  Добавить в друзья</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleSendMessage}
        >
          <Text style={styles.actionButtonText}>  Написать</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
      
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
 
        {renderActionButton()}
      </View>

   
      <View style={styles.statsContainer}>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{certificates.length}</Text>
          <Text style={styles.statLabel}>Сертификатов</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{solvedTasksCount}</Text>
          <Text style={styles.statLabel}>Задач</Text>
        </View>
      </View>
 
      {!codingLoading && studentLevel && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Прогресс в задачах</Text>
          <View style={styles.levelSection}>
            <CircularProgress
              progress={progress}
              level={currentLevel}
              experience={currentExp}
              nextLevelExp={requiredExp}
            />
          </View>
        </View>
      )}
 
      {!codingLoading &&
       studentLevel?.solvedTasks &&
       studentLevel.solvedTasks.length > 0 &&
       codingTasks.length > 0 && (
        <SolvedTasksPreview
          solvedTasks={studentLevel.solvedTasks}
          allTasks={codingTasks}
          onViewAll={() => setShowAllSolvedModal(true)}
          onTaskPress={handleTaskPress}
        />
      )}
 
      {certificatesLoading ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Сертификаты</Text>
          <ActivityIndicator size="small" color={COLORS.ACCENT} style={{ marginTop: 12 }} />
        </View>
      ) : certificates.length > 0 ? (
        <View style={styles.certSection}>
          <Text style={styles.sectionTitle}>Сертификаты</Text>
          <View style={styles.certSliderContainer}>
            <FlatList
              data={certificates}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              snapToInterval={certSlideWidth}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / certSlideWidth
                );
                setActiveCertIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={{ width: certSlideWidth, alignItems: 'center' }}>
                  <Image
                    source={{ uri: item.url }}
                    style={styles.certImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.certDate}>
                    {new Date(item.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            />
          </View>
          {certificates.length > 1 && (
            <View style={styles.certDots}>
              {certificates.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.certDot,
                    i === activeCertIndex && styles.certDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : null}

       
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

    </ScrollView>
 
    <AllSolvedTasksModal
      visible={showAllSolvedModal}
      onClose={() => setShowAllSolvedModal(false)}
      solvedTasks={studentLevel?.solvedTasks ?? []}
      allTasks={codingTasks}
      onTaskPress={handleTaskPress}
    />
    </>
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
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
  
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  expInfoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  expValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.GRAY_900,
  },
  expSeparator: {
    fontSize: 16,
    color: COLORS.GRAY_500,
    marginHorizontal: 4,
  },
  expTotal: {
    fontSize: 16,
    color: COLORS.GRAY_600,
  },
  expLabel: {
    fontSize: 14,
    color: COLORS.GRAY_500,
    marginLeft: 4,
  },
  levelSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 14,
    color: COLORS.ACCENT,
    fontWeight: '600',
  },
  taskCard: {
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
  taskCardSolved: {
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.GRAY_900,
    flex: 1,
    marginRight: 8,
  },
  taskDesc: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginBottom: 12,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  taskMeta: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  solvedDateBadge: {
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  solvedDateText: {
    fontSize: 11,
    color: COLORS.GRAY_600,
    fontWeight: '600',
  },
  authorText: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },
  xpBadge: {
    backgroundColor: COLORS.ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
 
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.GRAY_900,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    color: COLORS.GRAY_500,
  },
  modalListContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY_500,
    textAlign: 'center',
  },
 
  certSection: {
    backgroundColor: '#fff',
    marginHorizontal: SECTION_HORIZONTAL_MARGIN,
    marginTop: 20,
    padding: SECTION_PADDING,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certSliderContainer: {
    marginTop: 12,
    marginHorizontal: -SECTION_PADDING,
    overflow: 'hidden',
    paddingHorizontal: SECTION_PADDING,
  },
  certImage: {
    width: certSlideWidth,
    height: certSlideWidth * 0.66,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  certDate: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginTop: 8,
  },
  certDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  certDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.GRAY_300,
  },
  certDotActive: {
    backgroundColor: COLORS.ACCENT,
    width: 24,
  },
});

export default FriendsProfileScreen;
