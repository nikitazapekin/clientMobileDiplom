// UserProfile.tsx (обновленная версия)

import React, { useCallback,useEffect, useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProfileService } from '../../http/profile';
import { CertificateService } from '../../http/certificate';
import type { CertificateResponse } from '../../http/certificate';
import type { FullClientInfo, StudentResultResponse } from '../../http/types/profile';
import AvatarPicker from '../AvatarPicker';
import { COLORS } from 'appStyles';

const SECTION_HORIZONTAL_MARGIN = 20;
const SECTION_PADDING = 20;
const certSlideWidth = Dimensions.get('window').width - (SECTION_HORIZONTAL_MARGIN + SECTION_PADDING) * 2;

const UserProfile = () => {
  const [profile, setProfile] = useState<FullClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [activeCertIndex, setActiveCertIndex] = useState(0);
 
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

      // Проверяем и обрабатываем аватар
      if (profileData.avatar) {
        console.log('Avatar data:', profileData.avatar);

     
        if (profileData.avatar.imageUrl && !profileData.avatar.imageUrl.startsWith('data:')) {
          profileData.avatar.imageUrl = `data:${profileData.avatar.mimeType};base64,${profileData.avatar.imageUrl}`;
        }
      }

      setProfile(profileData);

      // Загружаем сертификаты
      setCertificatesLoading(true);
      try {
        const certs = await CertificateService.getCertificatesByAuditoryId(auditoryId);
        setCertificates(certs);
      } catch (certErr) {
        console.error('Failed to load certificates:', certErr);
      } finally {
        setCertificatesLoading(false);
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
        <Text style={styles.errorIcon}>⚠️</Text>
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

          
        </View>

    
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

        {/* Сертификаты */}
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

        {profile.studentResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⭐ Recent Results</Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('View All', 'Navigate to all results');
                }}
              >
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={profile.studentResults.slice(0, 5)}
              renderItem={renderStudentResult}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.resultsList}
            />
          </View>
        )}

        {/* Status Badge */}
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

    </>
  );
};
/*
  GRAY_DARK: "#303027", 
  GRAY_TEXT: "#222121", 

  */
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
    color:  COLORS.BLACK,
    marginTop: 5,
    
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  emailIcon: {
    fontSize: 16,
    marginRight: 8,
    color:  COLORS.BLACK,
    opacity: 0.9,
  },
  email: {
    fontSize: 16,
    color: COLORS.BLACK,
    opacity: 0.9,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleIcon: {
    fontSize: 14,
    marginRight: 5,
    color: '#fff',
  },
  role: {
    fontSize: 14,
    color: '#fff',
    textTransform: 'capitalize',
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
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
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
  resultsList: {
    paddingBottom: 10,
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
  resultDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
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
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#fff',
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
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
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
    backgroundColor: COLORS.ACCENT,
    width: 20,
  },
});

export default UserProfile;
