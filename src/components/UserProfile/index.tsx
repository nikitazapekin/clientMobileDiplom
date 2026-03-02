// UserProfile.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { ProfileService } from "../../http/profile"
import type { FullClientInfo, StudentResultResponse } from "../../http/types/profile"
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserProfile = () => {
  const [profile, setProfile] = useState<FullClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const getAuditoryId = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('userId');
    } catch (error) {
      console.error('Error getting auditoryId:', error);
      return null;
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const auditoryId = await getAuditoryId();
      
      if (!auditoryId) {
        setError('User not authenticated');
        return;
      }

      const profileData = await ProfileService.getFullProfileByAuditoryId(auditoryId);
      setProfile(profileData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleAvatarPress = () => {
    // Здесь можно добавить логику для смены аватара
    Alert.alert('Change Avatar', 'This feature is coming soon!');
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
    <View style={styles.resultCard}>
      <Text style={styles.resultLessonId}>Lesson: {item.lessonId}</Text>
      <View style={styles.resultStars}>
        {renderStars(item.countOfStars)}
      </View>
      <Text style={styles.resultDate}>
        Completed: {new Date(item.completedAt).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text>No profile data available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
    
    >
      {/* Header with Avatar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
          {profile.avatar ? (
            <Image 
              source={{ uri: profile.avatar.imageUrl }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.name}>
          {profile.firstName} {profile.lastName} {profile.middleName}
        </Text>
        <Text style={styles.email}>{profile.email}</Text>
        <Text style={styles.role}>{profile.role}</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile.totalLessons}</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profile.averageStars.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg. Stars</Text>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{profile.phone}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Country:</Text>
          <Text style={styles.infoValue}>{profile.country}</Text>
        </View>
        
        {profile.description && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>About:</Text>
            <Text style={styles.infoValue}>{profile.description}</Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Registered:</Text>
          <Text style={styles.infoValue}>
            {new Date(profile.registeredAt).toLocaleDateString()}
          </Text>
        </View>

        {profile.lastLoginAt && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Login:</Text>
            <Text style={styles.infoValue}>
              {new Date(profile.lastLoginAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Recent Results */}
      {profile.studentResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Results</Text>
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
            {profile.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0056b3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  editBadgeText: {
    fontSize: 16,
    color: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  email: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  role: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
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
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  resultsList: {
    paddingBottom: 10,
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  resultLessonId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  resultStars: {
    marginVertical: 5,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 18,
    marginHorizontal: 2,
  },
  starFilled: {
    color: '#FFD700',
  },
  starEmpty: {
    color: '#ddd',
  },
  resultDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#f44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserProfile;