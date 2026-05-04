import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { styles } from "./styles";
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
 
export default CourseInfo;
