import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import Button from "../Button";

import Certificate from "../../assets/utils/Certificate.png";
import CourseService from "@/http/courses";
import SubscriptionService from "@/http/subscribtion";
import type { CourseResponse, CourseStatsResponse } from "@/http/types/course";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp } from "@/navigation/types";

interface CourseInfoProps {
  id: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const CourseInfo = ({ id }: CourseInfoProps) => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionChecking, setSubscriptionChecking] = useState(true);
  const [actionLoading, setActionLoading] = useState<"subscribe" | "unsubscribe" | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const auditoryId = await AsyncStorage.getItem("userId");

      if (!auditoryId) {
        setUserId(null);
        setSubscriptionError("Войдите в систему, чтобы управлять подпиской на курс");
        setSubscriptionChecking(false);

        return;
      }

      setUserId(auditoryId);
      setSubscriptionError(null);
    } catch (err: unknown) {
      setUserId(null);
      setSubscriptionError(
        getErrorMessage(err, "Не удалось загрузить данные пользователя"),
      );
      setSubscriptionChecking(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [courseResponse, statsResponse] = await Promise.all([
        CourseService.getCourseById(id),
        CourseService.getCourseStats(id).catch((statsError) => {
          console.error("Error fetching course stats:", statsError);

          return null;
        }),
      ]);

      setCourse(courseResponse);
      setCourseStats(statsResponse);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Не удалось загрузить информацию о курсе"));
      console.error("Error fetching course:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCourseDetails();
  }, [fetchCourseDetails]);

  const checkSubscription = useCallback(async () => {
    if (!userId) {
      setIsSubscribed(false);
      setSubscriptionChecking(false);

      return false;
    }

    try {
      setSubscriptionChecking(true);
      const subscribed = await SubscriptionService.checkSubscription(userId, id);

      setIsSubscribed(subscribed);
      setSubscriptionError(null);

      return subscribed;
    } catch (err: unknown) {
      setSubscriptionError(
        getErrorMessage(err, "Не удалось проверить подписку на курс"),
      );

      return false;
    } finally {
      setSubscriptionChecking(false);
    }
  }, [id, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    void checkSubscription();
  }, [checkSubscription, userId]);

  const updateStudentCount = useCallback((delta: number) => {
    setCourseStats((prevStats) => {
      if (!prevStats) {
        return prevStats;
      }

      return {
        ...prevStats,
        studentCount: Math.max(0, prevStats.studentCount + delta),
      };
    });
  }, []);

  const handleSubscribe = async () => {
    if (!userId) {
      setSubscriptionError("Не удалось определить пользователя");

      return;
    }

    try {
      setActionLoading("subscribe");
      setSubscriptionError(null);

      await SubscriptionService.subscribeToCourse(userId, id);

      setIsSubscribed(true);
      setShowSuccessModal(true);
      updateStudentCount(1);
    } catch (err: unknown) {
      setSubscriptionError(
        getErrorMessage(err, "Не удалось подписаться на курс"),
      );
      await checkSubscription();
    } finally {
      setActionLoading(null);
    }
  };

  const handleGoToProfile = () => {
    setShowSuccessModal(false);

  };

  const handleGoToMap = () => {
    setShowSuccessModal(false);
    navigation.navigate(ROUTES.STACK.MAP, { id, courseName: course?.title });
  };

  const handleUnsubscribe = async () => {
    if (!userId) {
      setSubscriptionError("Не удалось определить пользователя");

      return;
    }

    try {
      setActionLoading("unsubscribe");
      setSubscriptionError(null);

      await SubscriptionService.unsubscribeFromCourse(userId, id);

      setIsSubscribed(false);
      setShowSuccessModal(false);
      updateStudentCount(-1);
    } catch (err: unknown) {
      setSubscriptionError(
        getErrorMessage(err, "Не удалось отписаться от курса"),
      );
      await checkSubscription();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9F0FA7" />
      </View>
    );

  }

  if (error || !course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Курс не найден"}</Text>
        <TouchableOpacity
          onPress={() => {
            void fetchCourseDetails();
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.previewContainer}>
          <Image
            source={{ uri: course.logo  }}
            style={styles.courseImage}
            resizeMode="cover"
          />

          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.courseTitle}>{course.title}</Text>

            </View>

            <Text style={styles.courseDescription}>{course.description}</Text>

            <Text style={styles.courseDetail}>
              Количество уроков: {courseStats?.lessonCount ?? "..."}
            </Text>
            <Text style={styles.courseDetail}>
              Количество студентов: {courseStats?.studentCount ?? "..."}
            </Text>

            <View style={styles.tagsContainer}>
              {course.tags?.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>О курсе</Text>
          <Text style={styles.aboutText}>
            {course.description}
            {"\n\n"}
         
          </Text>
        </View>

        <View style={styles.certificateSection}>
          <Text style={styles.certificateTitle}>
            Сертификат о успешном прохождении курса
          </Text>
          <Image
            source={ Certificate}
            style={styles.certificateImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.actionsContainer}>
          {subscriptionChecking ? (
            <View style={styles.subscriptionLoadingContainer}>
              <ActivityIndicator size="small" color="#9F0FA7" />
              <Text style={styles.subscriptionLoadingText}>Проверяем подписку...</Text>
            </View>
          ) : isSubscribed ? (
            <>
              <Button
                text="Перейти на карту"
                handler={handleGoToMap}
                color="#fff"
                backgroundColor="#9F0FA7"
                disabled={actionLoading !== null}
              />
              <TouchableOpacity
                style={[
                  styles.secondaryActionButton,
                  actionLoading !== null && styles.secondaryActionButtonDisabled,
                ]}
                onPress={() => {
                  void handleUnsubscribe();
                }}
                disabled={actionLoading !== null}
              >
                <Text style={styles.secondaryActionButtonText}>
                  {actionLoading === "unsubscribe"
                    ? "Отписываем..."
                    : "Отписаться от курса"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Button
              text={
                actionLoading === "subscribe"
                  ? "Добавляем..."
                  : userId
                    ? "Добавить в мои курсы"
                    : "Войдите, чтобы подписаться"
              }
              handler={() => {
                void handleSubscribe();
              }}
              color="#fff"
              backgroundColor="#9F0FA7"
              disabled={actionLoading !== null || !userId}
            />
          )}

          {subscriptionError ? (
            <Text style={styles.actionErrorText}>{subscriptionError}</Text>
          ) : null}
        </View>

        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Поздравляем!</Text>
              <Text style={styles.modalMessage}>
                Вы успешно подписались на курс{"\n"}
                <Text style={styles.modalCourseTitle}>"{course?.title}"</Text>
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleGoToProfile}
                >
                  <Text style={styles.modalButtonText}>Перейти в профиль</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={handleGoToMap}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                    Перейти к карте курса
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>Тип: {course.type}</Text>
          <Text style={styles.metaText}>Язык: {course.language}</Text>
          <Text style={styles.metaText}>
            Статус: {course.status === 'published' ? 'Опубликован' :
              course.status === 'draft' ? 'Черновик' : 'В архиве'}
          </Text>
          <Text style={styles.metaText}>
            Создан: {new Date(course.createdAt).toLocaleDateString('ru-RU')}
          </Text>
          {course.publishedAt && (
            <Text style={styles.metaText}>
              Опубликован: {new Date(course.publishedAt).toLocaleDateString('ru-RU')}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#9F0FA7',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: "center",
  },
  editText: {
    fontSize: 14,
    color: '#9F0FA7',
    marginLeft: 8,
  },
  courseDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  courseDetail: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  aboutSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  certificateSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  certificateImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  subscriptionLoadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  secondaryActionButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9F0FA7',
    backgroundColor: 'transparent',
  },
  secondaryActionButtonDisabled: {
    opacity: 0.6,
  },
  secondaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9F0FA7',
  },
  actionErrorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#D4380D',
    textAlign: 'center',
  },
  metaInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalCourseTitle: {
    fontWeight: 'bold',
    color: '#9F0FA7',
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#9F0FA7',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9F0FA7',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonTextSecondary: {
    color: '#9F0FA7',
  },
} as const;

export default CourseInfo;
