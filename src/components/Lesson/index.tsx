// app/lesson/[id]/index.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./styled";
import CustomButton from "@/components/Button";
import CodeEditor from "@/components/CodeEditor";
import { LessonDetailsService } from "@/http/lessonDetails";
import { CodeService } from "@/http/codeService";
import type { CodeLanguage } from "./types";
import type {
  Slide,
  SlideBlock,
  SourceBlock,
  TextBlock,
  CodeExampleBlock,
  TableBlock,
  ImageBlock,
  CodeTaskBlock,
  TheoryQuestionBlock,
  CodeConstraintType,
} from "./types";
import { COLORS } from "appStyles";

// Функция для сортировки блоков
const sortBlocks = (blocks: any[]) => {
  return [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
};

// Компонент для текстового блока
const TextBlockView = ({ block }: { block: TextBlock }) => {
  return <Text style={styles.textBlock}>{block.content}</Text>;
};

// Компонент для блока с примером кода
const CodeExampleBlockView = ({ block }: { block: CodeExampleBlock }) => {
  return (
    <View style={styles.codeExampleBlock}>
      <CodeEditor
        value={block.code || ""}
        onChange={() => {}}
        language={block.language || "javascript"}
        readOnly
        height={200}
      />
      {block.runnable && (
        <Text >* Этот код можно запустить</Text>
      )}
    </View>
  );
};

// Компонент для таблицы
const TableBlockView = ({ block }: { block: TableBlock }) => {
  return (
    <View style={styles.tableWrapper}>
      {block.cells.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={styles.tableCell}>
              <Text style={styles.tableCellText}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// Компонент для изображения
const ImageBlockView = ({ block }: { block: ImageBlock }) => {
  if (!block.url) return null;
  
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.imageBlock}>
      {loading && !imageError && (
        <View style={styles.imageLoading}>
          <ActivityIndicator size="small" color={COLORS.BLACK} />
        </View>
      )}
      
      {!imageError ? (
        <Image
          source={{ uri: block.url }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setImageError(true);
            setLoading(false);
          }}
        />
      ) : (
        <View style={styles.imageError}>
          <Text style={styles.imageErrorText}>❌ Не удалось загрузить изображение</Text>
          <Text style={styles.imageUrl}>{block.url}</Text>
        </View>
      )}
    </View>
  );
};



// Компонент для задачи с кодом
const CodeTaskBlockView = ({ block }: { block: CodeTaskBlock }) => {
  const [code, setCode] = useState(block.startCode || "");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput("");
    try {
      const res = await CodeService.executeCode({
        language: block.language || "javascript",
        code: code,
      });
      setOutput(res.error ? `Ошибка: ${res.error}` : res.output || "Код выполнен успешно");
    } catch (error: any) {
      setOutput(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.codeTaskBlock}>
      {block.description && (
        <Text style={styles.taskDescription}>{block.description}</Text>
      )}

      <CodeEditor
        value={code}
        onChange={setCode}
        language={block.language || "javascript"}
        height={200}
      />

      <View style={styles.buttonRow}>
        <CustomButton
          text={loading ? "Запуск..." : "Запустить"}
          handler={runCode}
          disabled={loading}
          backgroundColor={COLORS.BLACK}
          maxWidth={120}
        />
      </View>

      {output !== "" && (
        <View style={styles.consoleOutput}>
          <Text style={styles.consoleTitle}>Результат:</Text>
          <Text style={styles.consoleText}>{output}</Text>
        </View>
      )}

      {block.testCases && block.testCases.length > 0 && (
        <View >
          <Text >Тест-кейсы: {block.testCases.length}</Text>
        </View>
      )}
    </View>
  );
};

// Компонент для теоретического вопроса
const TheoryQuestionBlockView = ({ block }: { block: TheoryQuestionBlock }) => {
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    setShowResult(true);
  };

  return (
    <View style={styles.theoryQuestionBlock}>
      {block.text && <Text style={styles.questionText}>{block.text}</Text>}
      
      {block.code && (
        <CodeEditor
          value={block.code}
          onChange={() => {}}
          language="javascript"
          readOnly
          height={100}
        />
      )}

      <View style={styles.optionsList}>
        {block.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionItem,
              selected === index && styles.selectedOption,
           //   showResult && index === block.correctIndex  ,
           //   showResult && selected === index && selected !== block.correctIndex && styles.wrongOption,
            ]}
            onPress={() => !showResult && setSelected(index)}
            disabled={showResult}
          >
            <View style={styles.optionRadio}>
              {selected === index && <View style={styles.optionRadioSelected} />}
            </View>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!showResult && (
        <CustomButton
          text="Ответить"
          handler={handleSubmit}
          disabled={selected === undefined}
          backgroundColor={COLORS.BLACK}
          maxWidth={120}
        />
      )}

      {showResult && (
        <Text style={selected === block.correctIndex ? styles.correctText : styles.incorrectText}>
          {selected === block.correctIndex ? "✅ Правильно!" : "❌ Неправильно"}
        </Text>
      )}
    </View>
  );
};

// Модальное окно для источников
const SourcesModal = ({ visible, onClose, sources }: { 
  visible: boolean; 
  onClose: () => void; 
  sources: { url: string; note?: string }[] 
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Источники</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {sources.length === 0 ? (
              <Text style={styles.noSourcesText}>Нет источников</Text>
            ) : (
              sources.map((source, index) => (
                <View key={index} style={styles.sourceItem}>
                  <Text style={styles.sourceUrl}>{source.url}</Text>
                  {source.note && <Text style={styles.sourceNote}>{source.note}</Text>}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Основной компонент
const Lesson = ({ id }: { id: string }) => {
  console.log("🎯 Lesson mounted with ID:", id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sourcesModalVisible, setSourcesModalVisible] = useState(false);
  const [currentSources, setCurrentSources] = useState<{ url: string; note?: string }[]>([]);

  useEffect(() => {
    loadLessonDetails();
  }, [id]);

  const loadLessonDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!id) throw new Error("Lesson ID is required");

      const data = await LessonDetailsService.getLessonDetailsByLessonId(id);
      
      const allSlides: Slide[] = [];
      
      if (Array.isArray(data.slides)) {
        data.slides.forEach((slide, index) => {
          allSlides.push({
            id: slide.id || `slide_${index}`,
            title: slide.title || "Урок",
            type: "lesson",
            order: slide.orderIndex || index,
            blocks: Array.isArray(slide.blocks) ? (slide.blocks as any) : [],
          });
        });
      }

      if (Array.isArray(data.tests)) {
        data.tests.forEach((test, index) => {
          allSlides.push({
            id: test.id || `test_${index}`,
            title: test.title || "Тест",
            type: "test",
            order: test.orderIndex || (data.slides?.length || 0) + index,
            blocks: Array.isArray(test.blocks) ? (test.blocks as any) : [],
          });
        });
      }

      allSlides.sort((a, b) => a.order - b.order);
      
      if (allSlides.length === 0) {
        setError("В уроке нет слайдов");
      } else {
        setSlides(allSlides);
      }
    } catch (err: any) {
      setError(err.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      Alert.alert("Поздравляем!", "Вы завершили урок!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  }, [currentIndex, slides.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const openSourcesModal = useCallback((sources: { url: string; note?: string }[]) => {
    setCurrentSources(sources);
    setSourcesModalVisible(true);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.BLACK} />
          <Text style={styles.loadingText}>Загрузка урока...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <CustomButton text="Назад" handler={() => router.back()} backgroundColor={COLORS.BLACK} />
        </View>
      </SafeAreaView>
    );
  }

  if (slides.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>Нет слайдов</Text>
          <CustomButton text="Назад" handler={() => router.back()} backgroundColor={COLORS.BLACK} />
        </View>
      </SafeAreaView>
    );
  }

  const currentSlide = slides[currentIndex];
  
  // Собираем источники для текущего слайда
  const slideSources = currentSlide.blocks
    .filter((block): block is SourceBlock => block.type === "source")
    .map((block) => ({ url: block.url, note: block.note }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{currentSlide.title}</Text>
          {slideSources.length > 0 && (
            <TouchableOpacity
              style={styles.sourcesButton}
              onPress={() => openSourcesModal(slideSources)}
            >
              <Text style={styles.sourcesButtonText}>?</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.progress}>
          {currentIndex + 1} / {slides.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sortBlocks(currentSlide.blocks).map((block) => {
          console.log("🔍 Rendering block type:", block.type);
          
          switch (block.type) {
            case "text":
              return <TextBlockView key={block.id} block={block} />;
            
            case "codeExample":
              return <CodeExampleBlockView key={block.id} block={block} />; 
            
          
                  case "table":
                      return <TableBlockView key={block.id} block={block} />;
                      
                      case "image":
                          return <ImageBlockView key={block.id} block={block} />;
                          /*    
                  */
            
                 case "codeTask":
                     return <CodeTaskBlockView key={block.id} block={block} />; 
             
            

                     case "theoryQuestion":
                         return <TheoryQuestionBlockView key={block.id} block={block} />;
                         /*     
            
              */
            case "source":
              return null; // Источники отображаются в модальном окне
            default:
              return (
                <View key={block.id} style={styles.unknownBlock}>
                  <Text>Неизвестный тип блока: "{block.type}"</Text>
                </View>
              );
          }
        })}
      </ScrollView>

      <View style={styles.navigation}>
        <CustomButton
          text="Назад"
          handler={goToPrev}
          disabled={currentIndex === 0}
          backgroundColor={COLORS.BLACK}
          maxWidth={100}
        />
        <CustomButton
          text={currentIndex === slides.length - 1 ? "Завершить" : "Вперёд"}
          handler={goToNext}
          backgroundColor={COLORS.BLACK}
          maxWidth={100}
        />
      </View>

      <SourcesModal
        visible={sourcesModalVisible}
        onClose={() => setSourcesModalVisible(false)}
        sources={currentSources}
      />
    </SafeAreaView>
  );
};

export default Lesson;