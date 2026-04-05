import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import CustomButton from "../Button";

import { styles } from "./styled";

import { CheckpointService } from "@/http/checkpoint";
import { LessonService } from "@/http/lesson";
import { MapService } from "@/http/map";
import type { MapElementResponse } from "@/http/types/map";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp } from "@/navigation/types";
import { ProfileService } from "@/http/profile";
import { CertificateService } from "@/http/certificate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConfettiCannon from 'react-native-confetti-cannon';

interface Position {
  x: number;
  y: number;
}

interface MapElement {
  id: string;
  type: "circle" | "image" | "lesson" | "text" | "checkpoint" | "emoji";
  color?: string;
  position: Position;
  positioning: "left" | "center" | "right" | "free";
  offset: Position;
  imageUrl?: string;
  title?: string;
  isActive?: boolean;
  stars?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  width?: number;
  height?: number;
  rotation?: number;
  emoji?: string;
  breakpoints?: {
    [breakpoint: string]: {
      hidden?: boolean;
      positioning?: "left" | "center" | "right" | "free";
      offset?: Position;
    };
  };
}

interface MapSize {
  width: number;
  height: number;
}

interface MapBackground {
  color: string;
  image?: string;
  repeat?: string;
  size?: string;
}

interface LessonData {
  id: string;
  mapElementId: string;
  title: string;
  description: string;
  content?: string;
  duration?: number;
  orderIndex: number;
  isPublished: boolean;
}

interface CheckpointData {
  id: string;
  mapElementId: string;
  title: string;
  description: string;
  type: string;
  passingScore?: number;
  maxAttempts?: number;
  timeLimit?: number;
  instructions?: string;
  isPublished: boolean;
}

interface ModalData {
  type: "lesson" | "checkpoint";
  elementId: string;
  title: string;
  description: string;
  targetId: string;
}

interface LessonProgress {
  lessonId: string;
  bestResult: {
    countOfStars: number | null;
    completedAt: string;
    id: string;
  } | null;
}

interface MapProps {
  courseId: string;
  courseName?: string;
  onElementPress?: (element: MapElement) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Map: React.FC<MapProps> = ({ courseId, courseName = "Курс", onElementPress }) => {
  const [mapSize, setMapSize] = useState<MapSize>({ width: 800, height: 600 });
  const [mapBackground, setMapBackground] = useState<MapBackground>({
    color: "#ffffff",
    repeat: "no-repeat",
    size: "cover",
  });
  const [elements, setElements] = useState<MapElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonsData, setLessonsData] = useState<Record<string, LessonData>>({});
  const [checkpointsData, setCheckpointsData] = useState<Record<string, CheckpointData>>({});
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [sortedLessons, setSortedLessons] = useState<LessonData[]>([]);
  
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef<any>(null);
  const isCheckingCertificateRef = useRef(false);

  useEffect(() => {
    if (courseId) {
      loadCourseMap();
    }
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadAndCheck = async () => {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId || !courseId) return;

        try {
          console.log("Загрузка прогресса...");
          const response = await ProfileService.getStudentCourseProgress(userId, courseId);
          const progressMap: Record<string, LessonProgress> = {};
          response.forEach((item: LessonProgress) => {
            progressMap[item.lessonId] = item;
          });

          if (cancelled) return;
          setLessonProgress(progressMap);

          if (sortedLessons.length === 0) {
            console.log("Уроки ещё не загружены, пропускаем проверку сертификата");
            return;
          }

          const allCompleted = sortedLessons.every(lesson => {
            const p = progressMap[lesson.id];
            const done = p?.bestResult?.countOfStars !== null && p?.bestResult?.countOfStars !== undefined;
            console.log(`Урок "${lesson.title}" (${lesson.id}): ${done ? 'Огрничение пройдено' : 'Огрничение не пройдено'}, звёзды: ${p?.bestResult?.countOfStars ?? 'нет'}`);
            return done;
          });

          if (!allCompleted) {
            console.log("Не все уроки пройдены");
            return;
          }

          let totalStars = 0;
          sortedLessons.forEach(lesson => {
            totalStars += progressMap[lesson.id]?.bestResult?.countOfStars || 0;
          });
          const maxStars = sortedLessons.length * 3;
          const pct = (totalStars / maxStars) * 100;
          console.log(` Звёзд: ${totalStars}/${maxStars} (${pct.toFixed(1)}%)`);

          if (pct < 90) {
            console.log("Менее 90% звёзд");
            return;
          }

          if (cancelled || isCheckingCertificateRef.current) {
            console.log("Проверка сертификата уже выполняется или эффект отменён");
            return;
          }
          isCheckingCertificateRef.current = true;

          try {
            console.log("Условия выполнены! Проверяем сертификаты на сервере...");

            const allCerts = await CertificateService.getCertificatesByAuditoryId(userId);
            const existing = allCerts.filter(c => c.courseId === courseId);
            console.log(`Сертификатов для курса ${courseId}: ${existing.length}`);

            if (cancelled) return;

            if (existing.length > 0) {
              const latest = existing[0];
              if (latest.isViewed) {
                console.log("ℹСертификат для этого курса уже просмотрен");
                return;
              }
              console.log("ℹЕсть непросмотренный сертификат, показываем");
              setCertificateData({ ...latest, imageUrl: CertificateService.getCertificateImageUrl(latest.id) });
              setShowConfetti(true);
              setCertificateModalVisible(true);
              return;
            }

            console.log("Создаём сертификат...");
            const profile = await ProfileService.getFullProfileByAuditoryId(userId);

            if (cancelled) return;

            let studentName = "Студент";
            if (profile.firstName || profile.lastName) {
              const parts = [];
              if (profile.lastName) parts.push(profile.lastName);
              if (profile.firstName) parts.push(profile.firstName);
              if (profile.middleName) parts.push(profile.middleName);
              studentName = parts.join(' ');
            } else {
              studentName = profile.email || studentName;
            }

            const cert = await CertificateService.createStudentCertificate(userId, studentName, courseName, courseId);
            console.log("Сертификат создан:", cert.id);

            if (cancelled) return;

            setCertificateData({ ...cert, imageUrl: CertificateService.getCertificateImageUrl(cert.id) });
            setShowConfetti(true);
            setCertificateModalVisible(true);
          } finally {
            isCheckingCertificateRef.current = false;
          }
        } catch (error) {
          console.error("Ошибка при проверке сертификата:", error);
          isCheckingCertificateRef.current = false;
        }
      };

      loadAndCheck();

      return () => {
        cancelled = true;
      };
    }, [courseId, sortedLessons, courseName])
  );

  const loadCourseMap = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Загрузка карты для курса:", courseId);

      const mapData = await MapService.getCourseMapByCourseId(courseId);

      console.log("Карта загружена. ID:", mapData.id, "Элементов:", mapData.elements.length);

      setMapSize({ width: mapData.width, height: mapData.height });
      setMapBackground({
        color: mapData.backgroundColor,
        image: mapData.backgroundImage,
        repeat: mapData.backgroundRepeat,
        size: mapData.backgroundSize,
      });

      const loadedElements = mapData.elements.map((element: MapElementResponse) => ({
        id: element.id,
        type: element.type as MapElement["type"],
        color: element.color,
        position: { x: element.positionX, y: element.positionY },
        positioning: element.positioning as MapElement["positioning"],
        offset: { x: element.offsetX, y: element.offsetY },
        imageUrl: element.imageUrl,
        title: element.title,
        isActive: element.isActive,
        stars: element.stars,
        text: element.text,
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        width: element.width,
        height: element.height,
        rotation: element.rotation || 0,
        emoji: element.emoji,
        breakpoints: element.breakpoints,
      }));

      setElements(loadedElements);
      console.log(`Загружено ${loadedElements.length} элементов с сервера`);

      await loadAdditionalData(loadedElements);
    } catch (error: any) {
      console.error("Ошибка загрузки карты:", error);
      setError("Не удалось загрузить карту.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdditionalData = async (elements: MapElement[]) => {
    try {
      const lessons: Record<string, LessonData> = {};
      const checkpoints: Record<string, CheckpointData> = {};

      const lessonElements = elements.filter((el) => el.type === "lesson");

      await Promise.all(
        lessonElements.map(async (element) => {
          try {
            const lessonData = await LessonService.getLessonByMapElementId(element.id);

            lessons[element.id] = {
              id: lessonData.id,
              mapElementId: lessonData.mapElementId,
              title: lessonData.title,
              description: lessonData.description,
              content: lessonData.content,
              duration: lessonData.duration,
              orderIndex: lessonData.orderIndex,
              isPublished: lessonData.isPublished,
            };
            
            console.log(`Загружены данные урока для элемента: ${element.id}, название: "${lessonData.title}", order: ${lessonData.orderIndex}, lessonId: ${lessonData.id}`);
          } catch (error) {
            console.warn(`Не удалось загрузить данные урока для элемента: ${element.id}`);
          
            if (element.title) {
              lessons[element.id] = {
                id: `temp_${element.id}`,
                mapElementId: element.id,
                title: element.title,
                description: element.text || "",
                orderIndex: 999,
                isPublished: true,
              };
            }
          }
        })
      );

      const checkpointElements = elements.filter((el) => el.type === "checkpoint");
      await Promise.all(
        checkpointElements.map(async (element) => {
          try {
            const checkpointData = await CheckpointService.getCheckpointByMapElementId(element.id);

            checkpoints[element.id] = {
              id: checkpointData.id,
              mapElementId: checkpointData.mapElementId,
              title: checkpointData.title,
              description: checkpointData.description,
              type: checkpointData.type || "quiz",
              passingScore: checkpointData.passingScore,
              maxAttempts: checkpointData.maxAttempts,
              timeLimit: checkpointData.timeLimit,
              instructions: checkpointData.instructions,
              isPublished: checkpointData.isPublished,
            };
            console.log(`Загружены данные контрольной точки для элемента: ${element.id}, название: "${checkpointData.title}"`);
          } catch (error) {
            console.warn(
              `Не удалось загрузить данные контрольной точки для элемента: ${element.id}`
            );
            if (element.title) {
              checkpoints[element.id] = {
                id: `temp_${element.id}`,
                mapElementId: element.id,
                title: element.title,
                description: element.text || "",
                type: "quiz",
                isPublished: true,
              };
            }
          }
        })
      );

      setLessonsData(lessons);
      setCheckpointsData(checkpoints);

      const lessonsArray = Object.values(lessons);
      const sorted = lessonsArray.sort((a, b) => a.orderIndex - b.orderIndex);
      setSortedLessons(sorted);

      console.log("Отсортированные уроки:");
      sorted.forEach((lesson, index) => {
        console.log(`   ${index + 1}. ${lesson.title} (order: ${lesson.orderIndex}, mapElementId: ${lesson.mapElementId})`);
      });
    } catch (error) {
      console.error("Ошибка загрузки дополнительных данных:", error);
    }
  };

  const getStarsByMapElementId = (mapElementId: string): number => {
    const lessonData = lessonsData[mapElementId];
    if (!lessonData) return 0;
    
    const progress = lessonProgress[lessonData.id];
    const stars = progress?.bestResult?.countOfStars;
    
    console.log(`getStarsByMapElementId: ${mapElementId}, lessonId: ${lessonData.id}, stars: ${stars}`);
    
    if (stars === null || stars === undefined) {
      return 0;
    }
    
    return stars;
  };

  const isLessonAvailableByMapElementId = (mapElementId: string): boolean => {
    if (sortedLessons.length === 0) return true;
    
    const currentLessonIndex = sortedLessons.findIndex(l => l.mapElementId === mapElementId);
    
    if (currentLessonIndex === -1) return true;
    
    if (currentLessonIndex === 0) return true;
    
    const previousLesson = sortedLessons[currentLessonIndex - 1];
    const previousProgress = lessonProgress[previousLesson.id];
    const previousStars = previousProgress?.bestResult?.countOfStars;

    console.log(`Проверка предыдущего урока ${currentLessonIndex}: ${previousLesson.mapElementId}, звезды: ${previousStars}`);
     
    if (previousStars === null || previousStars === undefined || previousStars === 0) {
      console.log(`Урок ${mapElementId} недоступен: предыдущий урок ${previousLesson.mapElementId} имеет ${previousStars} звезд`);
      return false;
    }
    
    console.log(`Урок ${mapElementId} доступен: предыдущий урок пройден с ${previousStars} звездами`);
    return true;
  };

  const isFirstLesson = (mapElementId: string): boolean => {
    if (sortedLessons.length === 0) return false;
    
    const currentLessonIndex = sortedLessons.findIndex(l => l.mapElementId === mapElementId);
    
    return currentLessonIndex === 0;
  };

  const getValidFontWeight = (weight?: string): any => {
    const validWeights: Record<string, any> = {
      'normal': 'normal',
      'bold': 'bold',
      '100': '100',
      '200': '200',
      '300': '300',
      '400': '400',
      '500': '500',
      '600': '600',
      '700': '700',
      '800': '800',
      '900': '900',
    };

    return (weight && validWeights[weight]) || 'normal';
  };

  const calculateElementPosition = (element: MapElement): Position => {
    const currentPositioning = element.positioning;
    const currentOffset = element.offset;

    let x = 0;
    let y = 0;

    switch (currentPositioning) {
      case "left":
        x = currentOffset.x;
        y = currentOffset.y;
        break;

      case "center":
        x = containerWidth / 2 + currentOffset.x;
        y = currentOffset.y;
        break;

      case "right":
        x = containerWidth - currentOffset.x;
        y = currentOffset.y;
        break;

      case "free":
        x = (element.position.x / 100) * containerWidth;
        y = (element.position.y / 100) * mapSize.height;
        break;
    }

    return { x, y };
  };
  const handleElementClick = (element: MapElement) => {
    console.log("Клик по элементу:", element.type, element.id);
    
    if (element.type === "lesson") {
      const lessonData = lessonsData[element.id];
      
      if (!isLessonAvailableByMapElementId(element.id)) {
        Alert.alert(
          "Урок недоступен",
          "Пожалуйста, завершите предыдущий урок, чтобы получить доступ к этому уроку."
        );
        return;
      }

      if (lessonData) {
        setModalData({
          type: "lesson",
          elementId: element.id,
          title: lessonData.title,
          description: lessonData.description,
          targetId: lessonData.id,
        });
        setModalVisible(true);
      }
    } else if (element.type === "checkpoint") {
      const checkpointData = checkpointsData[element.id];

      if (checkpointData) {
        setModalData({
          type: "checkpoint",
          elementId: element.id,
          title: checkpointData.title,
          description: checkpointData.description,
          targetId: checkpointData.id,
        });
        setModalVisible(true);
      }
    }

    if (onElementPress) {
      onElementPress(element);
    }
  };

  const navigation = useNavigation<RootStackNavigationProp>();

  const handleNavigate = () => {
    if (!modalData || !modalData.targetId) return;

    navigation.navigate(ROUTES.STACK.LESSON, { id: modalData.targetId });
    setModalVisible(false);
  };

  const handleCloseCertificateModal = async () => {
    if (certificateData?.id) {
      try {
        await CertificateService.setIsViewed(certificateData.id);
      } catch (e) {
        console.error("Ошибка при setIsViewed:", e);
      }
    }
    setCertificateModalVisible(false);
    setShowConfetti(false);
  };

  const handleCertificateShare = async () => {
    if (!certificateData) return;
    
    try {
      await CertificateService.shareCertificate(
        certificateData.id,
        `Certificate of Completion - ${courseName}`
      );
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось поделиться сертификатом");
    }
  };

  const handleCertificateDownload = async () => {
    if (!certificateData) return;
    
     
  };

  const handleCertificateOpen = async () => {
    if (!certificateData) return;
    
    try {
      await CertificateService.openDigitalVersion(certificateData.id);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось открыть сертификат");
    }
  };

  const renderElement = (element: MapElement) => {
    const position = calculateElementPosition(element);
    const rotation = element.rotation || 0;

    const elementStyle: any = {
      position: 'absolute',
      left: position.x,
      top: position.y,
      transform: [
        { translateX: -((element.width || 40) / 2) },
        { translateY: -((element.height || 40) / 2) },
        { rotate: `${rotation}deg` }
      ],
    };

    const isClickable = element.type === "lesson" || element.type === "checkpoint";

    switch (element.type) {
      case "circle":
        return (
          <TouchableOpacity
            key={element.id}
            onPress={() => handleElementClick(element)}
            activeOpacity={isClickable ? 0.7 : 1}
            style={[
              elementStyle,
              {
                width: element.width || 40,
                height: element.height || 40,
                borderRadius: (element.width || 40) / 2,
                backgroundColor: element.color || "#ff6b6b",
              },
            ]}
          />
        );

      case "image":
        return (
          <TouchableOpacity
            key={element.id}
            onPress={() => handleElementClick(element)}
            activeOpacity={isClickable ? 0.7 : 1}
            style={[
              elementStyle,
              {
                width: element.width || 60,
                height: element.height || 60,
                overflow: 'hidden',
              },
            ]}
          >
            {element.imageUrl ? (
              <Image
                source={{ uri: element.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text>Изображение</Text>
              </View>
            )}
          </TouchableOpacity>
        );

      case "lesson":
        const lessonData = lessonsData[element.id];
        const displayTitle = lessonData?.title || element.title || "Урок";
        const starsCount = getStarsByMapElementId(element.id);
        const available = isLessonAvailableByMapElementId(element.id);
        const isFirst = isFirstLesson(element.id);

        console.log(`Рендер урока ${element.id}: звезды=${starsCount}, доступен=${available}, первый=${isFirst}, lessonId=${lessonData?.id}`);

        return (
          <TouchableOpacity
            key={element.id}
            onPress={() => handleElementClick(element)}
            activeOpacity={0.7}
            style={[
              elementStyle,
              {
                alignItems: 'center',
                justifyContent: 'center',
                width: element.width || 70,
                height: element.height || 90,
              },
            ]}
          >
            <View
              style={[
                styles.lessonCircle,
                element.isActive && styles.lessonActive,
                !available && styles.lessonDisabled,
              ]}
            >
              <Text style={styles.lessonCircleText}>
                {displayTitle.charAt(0).toUpperCase()}
              </Text>
            </View>
            
         
            <View style={styles.starsContainer}>
              {[1, 2, 3].map((star) => {
                const isFilled = star <= starsCount;
                
                return (
                  <Text
                    key={star}
                    style={[
                      styles.starText,
                      isFilled ? styles.starFilledText : styles.starEmptyText
                    ]}
                  >
                    ★
                  </Text>
                );
              })}
            </View>
            
            <Text style={styles.lessonTitle} numberOfLines={2}>
              {displayTitle}
            </Text>
          </TouchableOpacity>
        );

      case "text":
        return (
          <TouchableOpacity
            key={element.id}
            onPress={() => handleElementClick(element)}
            activeOpacity={isClickable ? 0.7 : 1}
          >
            <Text
              style={[
                elementStyle,
                {
                  fontSize: element.fontSize || 16,
                  fontFamily: element.fontFamily || "Arial",
                  fontWeight: getValidFontWeight(element.fontWeight),
                  fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
                  color: element.color || "#000000",
                  width: element.width || 200,
                } as any,
              ]}
            >
              {element.text}
            </Text>
          </TouchableOpacity>
        );

      case "checkpoint":
        const checkpointData = checkpointsData[element.id];
        const checkpointTitle = checkpointData?.title || element.title || "Контрольная точка";

        return (
          <TouchableOpacity
            key={element.id}
            onPress={() => handleElementClick(element)}
            activeOpacity={0.7}
            style={[
              elementStyle,
              {
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <View
              style={[
                styles.checkpointElement,
                {
                  backgroundColor: element.color || "#ff0000",
                  width: element.width || 40,
                  height: element.height || 40,
                },
              ]}
            >
              <View style={styles.checkpointInner} />
            </View>
            <Text style={styles.checkpointTitle} numberOfLines={2}>
              {checkpointTitle}
            </Text>
          </TouchableOpacity>
        );

      case "emoji":
        return (
          <TouchableOpacity
            key={element.id}
            onPress={() => handleElementClick(element)}
            activeOpacity={isClickable ? 0.7 : 1}
          >
            <View style={[elementStyle, { width: element.width || 40, height: element.height || 40 }]}>
              <Text
                style={{
                  fontSize: element.fontSize || 40,
                  textAlign: 'center',
                  textAlignVertical: 'center',
                  width: '100%',
                  height: '100%',
                  includeFontPadding: false,
                }}
              >
                {element.emoji}
              </Text>
            </View>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };
 
  const getBackgroundImageStyle = () => {
    const style: any = {
      position: 'absolute',
      width: '100%',
      height: mapSize.height,
    };

    if (mapBackground.repeat === 'repeat') {
      style.resizeMode = 'repeat';
    } else if (mapBackground.repeat === 'repeat-x') {
      style.resizeMode = 'repeat';
      style.transform = [{ scaleX: 1 }];
    } else if (mapBackground.repeat === 'repeat-y') {
      style.resizeMode = 'repeat';
      style.transform = [{ scaleY: 1 }];
    } else {
      switch (mapBackground.size) {
        case 'cover':
          style.resizeMode = 'cover';
          break;
        case 'contain':
          style.resizeMode = 'contain';
          break;
        case 'auto':
          style.resizeMode = 'center';
          break;
        default:
          style.resizeMode = 'cover';
      }
    }

    return style;
  };

  if (isLoading && !elements.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9F0FA7" />
        <Text style={styles.loadingText}>Загрузка карты...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCourseMap}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.studentContainer}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />

      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
          autoStart={true}
          fadeOut={true}
          fallSpeed={3000}
          colors={['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#9F0FA7']}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={true}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.mapContainer,
            {
              width: '100%',
              height: mapSize.height,
              backgroundColor: mapBackground.color,
            }
          ]}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {mapBackground.image && (
            <Image
              source={{ uri: mapBackground.image }}
              style={getBackgroundImageStyle()}
              resizeMethod="resize"
            />
          )}

          {elements.map(renderElement)}
        </View>
      </ScrollView>

      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>
          {mapSize.width}×{mapSize.height} | Эл: {elements.length} |
          Ур: {Object.keys(lessonsData).length} |
          КТ: {Object.keys(checkpointsData).length}
        </Text>
      </View>
 
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {modalData?.type === "lesson" ? "Урок" : "Контрольная точка"}
            </Text>

            <Text style={styles.modalSubtitle}>{modalData?.title}</Text>

            <View style={styles.modalDescription}>
              <Text style={styles.modalDescriptionText}>
                {modalData?.description}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <CustomButton
                handler={() => setModalVisible(false)}
                text="Закрыть"
                maxWidth={120}
              />
              <CustomButton
                handler={handleNavigate}
                text={modalData?.type === "lesson" ? "Перейти к уроку" : "Перейти к контрольной точке"}
                backgroundColor="#D8D8D8"
                maxWidth={120}
                color="#000"
              />
            </View>
          </View>
        </View>
      </Modal>
 
      <Modal
        animationType="slide"
        transparent={true}
        visible={certificateModalVisible}
        onRequestClose={handleCloseCertificateModal}
      >
        <View style={styles.certificateModalOverlay}>
          <View style={styles.certificateModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseCertificateModal}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.certificateTitle}> Поздравляем! </Text>
            
            <Text style={styles.certificateSubtitle}>
              Вы успешно завершили курс!
            </Text>

            {certificateData?.imageUrl && (
              <Image
                source={{ uri: certificateData.imageUrl }}
                style={styles.certificateImage}
                resizeMode="contain"
              />
            )}

            <TouchableOpacity
              style={styles.certificateCloseButton}
              onPress={handleCloseCertificateModal}
            >
              <Text style={styles.certificateCloseButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Map;