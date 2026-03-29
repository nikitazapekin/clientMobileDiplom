 
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ProfileService } from '../../http/profile';
import { CertificateService } from '../../http/certificate';
import type { CertificateResponse } from '../../http/certificate';
import type { FullClientInfo, StudentResultResponse } from '../../http/types/profile';
import { CodingTasksService, type CodeTask, type StudentLevel } from '../../http/codingTasksService';
import AvatarPicker from '../AvatarPicker';
import { COLORS, SIZES } from 'appStyles';
import { ROUTES } from '@/navigation/routes';
import type { RootStackParamList } from '@/navigation/types';

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
      <Text style={styles.taskDesc} numberOfLines={2}>
        {task.description}
      </Text>
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
          
                <Text style={styles.emptyText}>У вас еще нет решенных задач</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const UserProfile = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<FullClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

      const auditoryId = await AsyncStorage.getItem('userId');

      if (!auditoryId) {
        setError('User not authenticated');
        return;
      }

      const profileData = await ProfileService.getFullProfileByAuditoryId(auditoryId);

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
          CodingTasksService.getStudentLevel().catch(() => null),
        ]);
        setCodingTasks(tasksData);
        setStudentLevel(levelData);
      } catch (codingErr) {
        console.error('Failed to load coding tasks:', codingErr);
      } finally {
        setCodingLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
 
  const handleAvatarUploaded = (avatarUrl: string) => {
    if (profile) {
      if (avatarUrl) {
        setProfile({
          ...profile,
          avatar: {
            ...profile.avatar!,
            imageUrl: avatarUrl,
          },
        });
        loadProfile();
      } else {
        setProfile({
          ...profile,
          avatar: undefined,
        });
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleAvatarPress = () => {
    setAvatarPickerVisible(true);
  };

  const handleAvatarLongPress = () => {
    Alert.alert(
      'Avatar Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Full Size',
          onPress: () => {
            if (profile?.avatar) {
              Alert.alert('Avatar', 'Full size view coming soon!');
            }
          },
        },
        {
          text: 'Change Avatar',
          onPress: () => setAvatarPickerVisible(true),
        },
      ]
    );
  };

  const handleTaskPress = (taskId: string) => {
    navigation.navigate(ROUTES.STACK.CODING_SOLVE as any, { id: taskId });
  };

  const renderStars = (count: number) => {
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, i <= count ? styles.starFilled : styles.starEmpty]}>
          ★
        </Text>
      );
    }

    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderStudentResult = ({ item }: { item: StudentResultResponse }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => {
        Alert.alert('Lesson', `View lesson ${item.lessonId}`);
      }}
    >
      <Text style={styles.resultLessonId} numberOfLines={1}>
        Lesson: {item.lessonId}
      </Text>
      <View style={styles.resultStars}>
        {renderStars(item.countOfStars)}
      </View>
      <Text style={styles.resultDate}>
        {new Date(item.completedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </Text>
    </TouchableOpacity>
  );

  
  const getRequiredExp = (level: number) => Math.pow(10, level - 1);
  
  const currentLevel = studentLevel?.level || 1;
  const currentExp = studentLevel?.experience || 0;
  const requiredExp = getRequiredExp(currentLevel);
  const progress = currentExp / requiredExp;
  
  const solvedTasksCount = studentLevel?.solvedTasks?.length ?? 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
     
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>No profile data available</Text>
      </View>
    );
  }

  const auditoryId = profile.auditoryId;

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
     
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            onLongPress={handleAvatarLongPress}
            delayLongPress={500}
            style={styles.avatarContainer}
          >
            {uploadingAvatar ? (
              <View style={[styles.avatar, styles.avatarUploading]}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : profile.avatar ? (
              <Image
                source={{ uri: profile.avatar.imageUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </Text>
              </View>
            )}
 
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeText}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>
            {profile.firstName} {profile.lastName}
            {profile.middleName ? ` ${profile.middleName}` : ''}
          </Text>

          <View style={styles.emailContainer}>
            <Text style={styles.email}>{profile.email}</Text>
          </View>

        
          <TouchableOpacity
            style={styles.friendsButton}
            onPress={() => {
              navigation.navigate(ROUTES.STACK.FRIENDS as any);
            }}
          >
            <Text style={styles.friendsButtonText}>👥 Мои друзья</Text>
          </TouchableOpacity>
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
            <Text style={styles.sectionTitle}>Мой прогресс в задачах</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Личная информация</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Телефон</Text>
              <Text style={styles.infoItemValue}>{profile.phone}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Страна</Text>
              <Text style={styles.infoItemValue}>{profile.country}</Text>
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
                {new Date(profile.registeredAt).toLocaleDateString('en-US', {
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
                  {new Date(profile.lastLoginAt).toLocaleDateString('en-US', {
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

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, profile.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>
              {profile.isActive ? 'В сети' : 'Не в сети'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.removeItem('accessToken');
                    await AsyncStorage.removeItem('auditoryId');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
 
      {auditoryId && (
        <AvatarPicker
          visible={avatarPickerVisible}
          onClose={() => setAvatarPickerVisible(false)}
          auditoryId={auditoryId}
          onAvatarUploaded={handleAvatarUploaded}
        />
      )}
      
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
  header: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarUploading: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#5a67d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraBadgeText: {
    fontSize: 18,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 5,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  email: {
    fontSize: 16,
    color: '#000000',
    opacity: 0.9,
  },
  friendsButton: {
    marginTop: 15,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  friendsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
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
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllLink: {
    fontSize: 14,
    color: '#9F0FA7',
    fontWeight: '500',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  infoItem: {
    width: '50%',
    padding: 5,
  },
  infoItemFull: {
    width: '100%',
  },
  infoItemLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  statusActive: {
    backgroundColor: '#48bb78',
  },
  statusInactive: {
    backgroundColor: '#f56565',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#f56565',
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#f56565',
    fontWeight: '600',
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
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },
  certDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  certDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  certDotActive: {
    backgroundColor: '#9F0FA7',
    width: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  modalListContent: {
    padding: 20,
  },

  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },
  taskCardSolved: {
    borderLeftColor: "#4caf50",
    opacity: 0.85,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  taskDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskMeta: {
    fontSize: 12,
    color: '#999',
  },
  xpBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#667eea",
  },
  xpBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: "700",
  },
  authorText: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },
  solvedDateBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },
  solvedDateText: {
    color: '#666',
    fontSize: 10,
    fontWeight: "500",
  },

  levelSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  circularProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  expInfoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 15,
  },
  expValue: {
    fontSize: 24,
    fontWeight: "700",
    color: '#9F0FA7',
  },
  expSeparator: {
    fontSize: 18,
    color: '#999',
    marginHorizontal: 4,
  },
  expTotal: {
    fontSize: 18,
    color: '#666',
  },
  expLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  starFilled: {
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  starEmpty: {
    color: '#ddd',
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  resultLessonId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  resultStars: {
    marginVertical: 5,
  },
  resultDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default UserProfile;