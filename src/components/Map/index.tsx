import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { styles } from "./styled";
import { MapService } from "@/http/map";
import { LessonService } from "@/http/lesson";
import { CheckpointService } from "@/http/checkpoint";
import type {
  MapElementResponse,
} from "@/http/types/map";
import CustomButton from "../Button";
import { useNavigation } from "@react-navigation/native";
import { ROUTES } from "@/navigation/routes";
import { MainTabNavigationProp, RootStackParamList, RootStackNavigationProp } from "@/navigation/types";

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

interface MapProps {
  courseId: string;
  onElementPress?: (element: MapElement) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Map: React.FC<MapProps> = ({ courseId, onElementPress }) => {
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

  // Загрузка карты
  useEffect(() => {
    if (courseId) {
      loadCourseMap();
    }
  }, [courseId]);

  const loadCourseMap = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Загрузка карты для курса:", courseId);

      const mapData = await MapService.getCourseMapByCourseId(courseId);

      console.log("✅ Карта загружена. ID:", mapData.id, "Элементов:", mapData.elements.length);

      setMapSize({ width: mapData.width, height: mapData.height });
      setMapBackground({
        color: mapData.backgroundColor,
        image: mapData.backgroundImage,
        repeat: mapData.backgroundRepeat,
        size: mapData.backgroundSize,
      });

      // Преобразуем элементы из серверного формата
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
      console.log(`✅ Загружено ${loadedElements.length} элементов с сервера`);

      // Загружаем дополнительные данные для уроков и контрольных точек
      await loadAdditionalData(loadedElements);
    } catch (error: any) {
      console.error("❌ Ошибка загрузки карты:", error);
      setError("Не удалось загрузить карту.");
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка дополнительных данных для уроков и контрольных точек
  const loadAdditionalData = async (elements: MapElement[]) => {
    try {
      const lessons: Record<string, LessonData> = {};
      const checkpoints: Record<string, CheckpointData> = {};

      // Загружаем данные для каждого урока
      const lessonElements = elements.filter((el) => el.type === "lesson");
      
      // Сначала устанавливаем данные из элементов карты как запасной вариант
      lessonElements.forEach((element) => {
        if (element.title) {
          lessons[element.id] = {
            id: `temp_${element.id}`,
            mapElementId: element.id,
            title: element.title,
            description: element.text || "",
            orderIndex: 0,
            isPublished: true,
          };
        }
      });

      // Затем пытаемся загрузить реальные данные с сервера
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
            console.log(`✅ Загружены данные урока для элемента: ${element.id}, название: "${lessonData.title}"`);
          } catch (error) {
            console.warn(`⚠️ Не удалось загрузить данные урока для элемента: ${element.id}, использую данные из элемента карты`);
            // Оставляем данные из элемента карты
          }
        })
      );

      // Загружаем данные для каждой контрольной точки
      const checkpointElements = elements.filter((el) => el.type === "checkpoint");
      
      // Сначала устанавливаем данные из элементов карты как запасной вариант
      checkpointElements.forEach((element) => {
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
      });

      // Затем пытаемся загрузить реальные данные с сервера
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
            console.log(`✅ Загружены данные контрольной точки для элемента: ${element.id}, название: "${checkpointData.title}"`);
          } catch (error) {
            console.warn(
              `⚠️ Не удалось загрузить данные контрольной точки для элемента: ${element.id}, использую данные из элемента карты`
            );
            // Оставляем данные из элемента карты
          }
        })
      );

      setLessonsData(lessons);
      setCheckpointsData(checkpoints);
      
      console.log("📚 Итоговые данные уроков:", Object.keys(lessons).length);
      Object.entries(lessons).forEach(([id, data]) => {
        console.log(`   ${id}: "${data.title}"`);
      });
    } catch (error) {
      console.error("❌ Ошибка загрузки дополнительных данных:", error);
    }
  };

  // Функция для преобразования строки fontWeight
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

  // Вычисление позиции элемента - ТОЧНО КАК В КОНСТРУКТОРЕ
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

  // Обработчик клика на элемент
  const handleElementClick = (element: MapElement) => {
    if (element.type === "lesson") {
      const lessonData = lessonsData[element.id];
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


  const navigation = useNavigation<RootStackNavigationProp>()

  const handleNavigate = () => {
    if (!modalData || !modalData.targetId) return;
    
navigation.navigate(ROUTES.STACK.LESSON, { id: modalData.targetId });
//navigation.navigate(ROUTES.STACK.LESSON, { id: modalData.targetId });
    setModalVisible(false);
    Alert.alert("Навигация", `Переход к ${modalData.type} с ID: ${modalData.targetId}`);
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
        // Используем данные из lessonsData, если они есть
        const displayTitle = lessonData?.title || element.title || "Урок";
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
                width: element.width || 60,
                height: element.height || 60,
              },
            ]}
          >
            <View
              style={[
                styles.lessonCircle,
                element.isActive && styles.lessonActive,
              ]}
            >
              <Text style={styles.lessonCircleText}>
                {displayTitle.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.starsArc}>
              {[1, 2, 3].map((star) => (
                <View
                  key={star}
                  style={[
                    styles.star,
                    star <= (element.stars || 0) && styles.starFilled,
                  ]}
                />
              ))}
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

  // Получение стилей для фонового изображения
  const getBackgroundImageStyle = () => {
    const style: any = {
      position: 'absolute',
      width: '100%',
      height: mapSize.height,
    };

    // Устанавливаем режим повторения
    if (mapBackground.repeat === 'repeat') {
      style.resizeMode = 'repeat';
    } else if (mapBackground.repeat === 'repeat-x') {
      style.resizeMode = 'repeat';
      style.transform = [{ scaleX: 1 }];
    } else if (mapBackground.repeat === 'repeat-y') {
      style.resizeMode = 'repeat';
      style.transform = [{ scaleY: 1 }];
    } else {
      // Устанавливаем resizeMode в зависимости от backgroundSize
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
      
      {/* Вертикальный ScrollView */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Контейнер карты с фиксированной высотой из БД */}
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
          {/* Фоновое изображение с учетом повторения и размера */}
          {mapBackground.image && (
            <Image
              source={{ uri: mapBackground.image }}
              style={getBackgroundImageStyle()}
              resizeMethod="resize"
            />
          )}
          
          {/* Элементы карты */}
          {elements.map(renderElement)}
        </View>
      </ScrollView>

      {/* Информационная панель */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>
          {mapSize.width}×{mapSize.height} | Эл: {elements.length} | 
          Ур: {Object.keys(lessonsData).length} | 
          КТ: {Object.keys(checkpointsData).length}
        </Text>
      </View>

      {/* Модальное окно для уроков и контрольных точек */}
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
             {/*  <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Закрыть</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navigateButton}
                onPress={handleNavigate}
              >
                <Text style={styles.navigateButtonText}>
                  {modalData?.type === "lesson" ? "Перейти к уроку" : "Перейти к контрольной точке"}
                </Text>
              </TouchableOpacity> */}


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
    </View>
  );
};

export default Map;