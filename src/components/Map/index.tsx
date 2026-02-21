import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import { styles } from "./styled";
import { MapService } from "@/http/map";
import { LessonService } from "@/http/lesson";
import { CheckpointService } from "@/http/checkpoint";
import type {
  MapElementResponse,
} from "@/http/types/map";

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
  id?: string;
  mapElementId: string;
  title: string;
  description: string;
  content?: string;
  duration?: number;
  orderIndex: number;
  isPublished: boolean;
}

interface CheckpointData {
  id?: string;
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
  const [activeBreakpoint, setActiveBreakpoint] = useState<string>("desktop");
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);

  // Определяем брейкпоинт на основе ширины контейнера
  useEffect(() => {
    if (containerWidth <= 375) {
      setActiveBreakpoint("mobile");
    } else if (containerWidth <= 768) {
      setActiveBreakpoint("tablet");
    } else {
      setActiveBreakpoint("desktop");
    }
  }, [containerWidth]);

  // Следим за изменением размера экрана
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setContainerWidth(window.width);
      setContainerHeight(window.height);
    });

    return () => subscription?.remove();
  }, []);

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
      for (const element of lessonElements) {
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
          console.log(`✅ Загружены данные урока для элемента: ${element.id}`);
        } catch (error) {
          console.warn(`⚠️ Не удалось загрузить данные урока для элемента: ${element.id}`, error);
          lessons[element.id] = {
            mapElementId: element.id,
            title: element.title || `Урок ${element.id.substring(0, 8)}`,
            description: element.text || "",
            orderIndex: 0,
            isPublished: true,
          };
        }
      }

      // Загружаем данные для каждой контрольной точки
      const checkpointElements = elements.filter((el) => el.type === "checkpoint");
      for (const element of checkpointElements) {
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
          console.log(`✅ Загружены данные контрольной точки для элемента: ${element.id}`);
        } catch (error) {
          console.warn(
            `⚠️ Не удалось загрузить данные контрольной точки для элемента: ${element.id}`,
            error
          );
          checkpoints[element.id] = {
            mapElementId: element.id,
            title: element.title || `Контрольная точка ${element.id.substring(0, 8)}`,
            description: element.text || "",
            type: "quiz",
            isPublished: true,
          };
        }
      }

      setLessonsData(lessons);
      setCheckpointsData(checkpoints);
      console.log(
        `✅ Загружено данных: ${Object.keys(lessons).length} уроков, ${Object.keys(checkpoints).length} контрольных точек`
      );
    } catch (error) {
      console.error("❌ Ошибка загрузки дополнительных данных:", error);
    }
  };

  // Функция для преобразования строки fontWeight в допустимый тип
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

  // Получение настроек элемента для текущего брейкпоинта
  const getElementBreakpointSettings = (element: MapElement) => {
    if (!element.breakpoints || !element.breakpoints[activeBreakpoint]) {
      return {};
    }
    return element.breakpoints[activeBreakpoint];
  };

  // ПРАВИЛЬНОЕ вычисление позиции элемента относительно текущего размера экрана
  const calculateElementPosition = (element: MapElement): Position => {
    const breakpointSettings = getElementBreakpointSettings(element);
    const isHidden = breakpointSettings.hidden;

    if (isHidden) {
      return { x: -1000, y: -1000 };
    }

    const currentPositioning = breakpointSettings.positioning || element.positioning;
    const currentOffset = breakpointSettings.offset || element.offset;

    let x = 0;
    let y = currentOffset.y; // Y всегда отступ сверху

    switch (currentPositioning) {
      case "left":
        // От левого края: позиция = отступ
        x = currentOffset.x;
        break;

      case "center":
        // От центра: позиция = половина ширины экрана + смещение
        x = containerWidth / 2 + currentOffset.x;
        break;

      case "right":
        // От правого края: позиция = ширина экрана - отступ
        x = containerWidth - currentOffset.x;
        break;

      case "free":
        // Процентное позиционирование относительно исходного размера карты
        // Но масштабируем относительно текущего экрана
        const scaleX = containerWidth / mapSize.width;
        const scaleY = containerHeight / mapSize.height;
        
        x = (element.position.x / 100) * mapSize.width * scaleX;
        y = (element.position.y / 100) * mapSize.height * scaleY;
        break;
    }

    return { x, y };
  };

  // Обработчик изменения размера контейнера
  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  };

  // Рендер элемента
  const renderElement = (element: MapElement) => {
    const position = calculateElementPosition(element);
    const breakpointSettings = getElementBreakpointSettings(element);
    const isHidden = breakpointSettings.hidden;
    const rotation = element.rotation || 0;

    if (isHidden) return null;

    // Стиль с translate(-50%, -50%) для центрирования элемента относительно его позиции
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

    // Обработчик нажатия на элемент
    const handlePress = () => {
      if (onElementPress) {
        onElementPress(element);
      }
    };

    switch (element.type) {
      case "circle":
        return (
          <TouchableOpacity
            key={element.id}
            onPress={handlePress}
            activeOpacity={0.7}
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
            onPress={handlePress}
            activeOpacity={0.7}
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
        const displayTitle = lessonData?.title || element.title;
        return (
          <TouchableOpacity
            key={element.id}
            onPress={handlePress}
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
                {displayTitle?.charAt(0) || "У"}
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
            <Text style={styles.lessonTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
          </TouchableOpacity>
        );

      case "text":
        return (
          <TouchableOpacity
            key={element.id}
            onPress={handlePress}
            activeOpacity={0.7}
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
        const checkpointTitle = checkpointData?.title || element.title;
        return (
          <TouchableOpacity
            key={element.id}
            onPress={handlePress}
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
            <Text style={styles.checkpointTitle} numberOfLines={1}>
              {checkpointTitle}
            </Text>
          </TouchableOpacity>
        );

      case "emoji":
        return (
          <TouchableOpacity
            key={element.id}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <Text
              style={[
                elementStyle,
                {
                  fontSize: element.fontSize || 40,
                  width: element.width || 40,
                  height: element.height || 40,
                  textAlign: 'center',
                  textAlignVertical: 'center',
                } as any,
              ]}
            >
              {element.emoji}
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  // Получение стилей для фона карты
  const getMapBackgroundStyle = () => {
    const style: any = {
      backgroundColor: mapBackground.color,
    };

    if (mapBackground.image) {
      style.backgroundImage = `url(${mapBackground.image})`;
    }

    if (mapBackground.repeat) {
      style.backgroundRepeat = mapBackground.repeat;
    }

    if (mapBackground.size) {
      style.backgroundSize = mapBackground.size;
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
      
      {/* Резиновый контейнер на весь экран */}
      <View 
        style={styles.responsiveContainer}
        onLayout={onContainerLayout}
      >
        {/* Фон карты (растягивается на весь экран) */}
        <View 
          style={[
            styles.backgroundContainer,
            getMapBackgroundStyle() as any,
          ]}
        >
          {/* Элементы карты */}
          {elements.map(renderElement)}
        </View>

        {/* Информация о брейкпоинте */}
        <View style={styles.breakpointInfo}>
          <Text style={styles.breakpointInfoText}>
            {activeBreakpoint === 'mobile' ? '📱' : 
             activeBreakpoint === 'tablet' ? '📟' : '💻'} 
            {' '}{activeBreakpoint}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Map;