import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputScrollEventData,
  TouchableOpacity,
  View,
  TextInputProps,
} from 'react-native';

type CodeLanguage = 'javascript' | 'python' | 'java' | 'csharp' | 'golang' | 'cpp';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  readOnly?: boolean;
  height?: number;
  onRun?: () => void;
  runLoading?: boolean;
  style?: any;
}

const KEYWORDS: Record<CodeLanguage, string[]> = {
  javascript: [
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
    'return', 'class', 'this', 'new', 'try', 'catch', 'finally',
    'switch', 'case', 'break', 'continue', 'typeof', 'instanceof',
    'console.log', 'Array', 'Object', 'String', 'Number', 'Boolean',
  ],
  python: [
    'def', 'if', 'elif', 'else', 'for', 'while', 'return', 'import',
    'from', 'as', 'class', 'try', 'except', 'finally', 'with',
    'print', 'len', 'range', 'enumerate', 'zip', 'open', 'None',
    'True', 'False', 'and', 'or', 'not', 'in', 'is', 'lambda',
  ],
  java: [
    'public', 'private', 'protected', 'class', 'void', 'static',
    'final', 'if', 'else', 'for', 'while', 'return', 'new', 'try',
    'catch', 'System.out.println', 'String', 'int', 'double', 'boolean',
    'this', 'super', 'extends', 'implements', 'interface', 'enum',
  ],
  csharp: [
    'public', 'private', 'protected', 'class', 'void', 'static',
    'readonly', 'if', 'else', 'for', 'foreach', 'while', 'return',
    'using', 'namespace', 'Console.WriteLine', 'string', 'int', 'bool',
    'var', 'get', 'set', 'value', 'this', 'base', 'virtual', 'override',
  ],
  golang: [
    'func', 'var', 'const', 'if', 'else', 'for', 'range', 'return',
    'package', 'import', 'type', 'struct', 'interface', 'go', 'defer',
    'chan', 'map', 'make', 'new', 'fmt.Println', 'len', 'cap', 'append',
  ],
  cpp: [
    'int', 'char', 'float', 'double', 'void', 'class', 'public',
    'private', 'protected', 'if', 'else', 'for', 'while', 'return',
    'new', 'delete', 'cout', 'cin', 'endl', 'std', 'using', 'namespace',
    'virtual', 'override', 'const', 'static', 'template', 'typename',
  ]
};

const COLORS = {
  background: '#0D1117',
  surface: '#161B22',
  text: '#E6EDF3',
  keyword: '#FF79C6',
  string: '#A6E22E',
  number: '#E6DB74',
  comment: '#7E8C9A',
  function: '#66D9EF',
  type: '#A6E22E',
  operator: '#66D9EF',
  punctuation: '#E6EDF3',
  accent: '#FF79C6',
  selection: '#264F78',
  lineNumber: '#6E7681',
  autocompleteBg: '#1F2937',
  autocompleteBorder: '#374151',
  autocompleteSelected: '#2D3748',
};

// Более моноширинный шрифт
const FONT_FAMILY = Platform.select({
  ios: 'Courier', // Самый моноширинный шрифт на iOS
  android: 'monospace',
  default: 'monospace',
});

const FONT_SIZE = 14;
const LINE_HEIGHT = 20;
const PADDING_VERTICAL = 8;
const PADDING_HORIZONTAL = 8;
const LINE_NUMBER_WIDTH = 40;

// Общий letter-spacing для обоих слоев
const LETTER_SPACING = Platform.select({
  ios: -0.3,
  android: -0.2,
  default: -0.2,
});

// Расширяем типы для TextInput чтобы включить Android-специфичные пропсы
type ExtendedTextInputProps = Omit<TextInputProps, 'ref'> & {
  includeFontPadding?: boolean;
  importantForAutofill?: 'auto' | 'no' | 'noExcludeDescendants' | 'yes' | 'yesExcludeDescendants';
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = 400,
  onRun,
  runLoading = false,
  style,
}) => {
  const inputRef = useRef<TextInput>(null);
  const highlightScrollRef = useRef<ScrollView>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Мигание курсора
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Получение текущего слова
  const getCurrentWord = useCallback((text: string, pos: number) => {
    const beforeCursor = text.slice(0, pos);
    const afterCursor = text.slice(pos);

    const beforeMatch = beforeCursor.match(/[a-zA-Z0-9_.]*$/);
    const afterMatch = afterCursor.match(/^[a-zA-Z0-9_]*/);

    return (beforeMatch ? beforeMatch[0] : '') + (afterMatch ? afterMatch[0] : '');
  }, []);

  // Обновление автокомплита
  useEffect(() => {
    const word = getCurrentWord(value, selection.start);

    if (word.length >= 2 && !readOnly && isFocused) {
      const suggestions = KEYWORDS[language]
        .filter(keyword =>
          keyword.toLowerCase().startsWith(word.toLowerCase()) &&
          keyword !== word
        )
        .slice(0, 6);

      setAutocompleteSuggestions(suggestions);
      setShowAutocomplete(suggestions.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowAutocomplete(false);
    }
  }, [value, selection.start, language, readOnly, isFocused, getCurrentWord]);

  // Вставка сниппета
  const insertSnippet = useCallback((snippet: string) => {
    const beforeCursor = value.slice(0, selection.start);
    const afterCursor = value.slice(selection.end);
    const word = getCurrentWord(value, selection.start);

    const newText = beforeCursor.slice(0, -word.length) + snippet + afterCursor;

    onChange(newText);

    const newPosition = beforeCursor.length - word.length + snippet.length;

    setSelection({ start: newPosition, end: newPosition });
    setShowAutocomplete(false);
  }, [value, selection, onChange]);

  // Обработка клавиш
  const handleKeyPress = useCallback((e: any) => {
    const { key } = e.nativeEvent;

    if (showAutocomplete) {
      if (key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev =>
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
        );

        return;
      } else if (key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : 0);

        return;
      } else if (key === 'Enter' || key === 'Tab') {
        e.preventDefault();

        if (autocompleteSuggestions[selectedSuggestion]) {
          insertSnippet(autocompleteSuggestions[selectedSuggestion]);
        }

        return;
      } else if (key === 'Escape') {
        setShowAutocomplete(false);

        return;
      }
    }

    if (key === 'Enter') {
      e.preventDefault();

      const lines = value.split('\n');
      const textBeforeCursor = value.slice(0, selection.start);
      const currentLineIndex = textBeforeCursor.split('\n').length - 1;
      const currentLine = lines[currentLineIndex] || '';

      const indentMatch = currentLine.match(/^\s*/);
      const currentIndent = indentMatch ? indentMatch[0] : '';

      const shouldIncreaseIndent = /[{([][^}\])]*$/.test(currentLine.trim()) ||
                                   currentLine.trim().endsWith(':');

      const newIndent = shouldIncreaseIndent ? currentIndent + '  ' : currentIndent;

      const newText = value.slice(0, selection.start) + '\n' + newIndent + value.slice(selection.end);

      onChange(newText);

      setTimeout(() => {
        const newPosition = selection.start + 1 + newIndent.length;
        setSelection({ start: newPosition, end: newPosition });
      }, 0);
    }
    else if (key === 'Tab') {
      e.preventDefault();
      const newText = value.slice(0, selection.start) + '  ' + value.slice(selection.end);

      onChange(newText);
      setTimeout(() => {
        setSelection({ start: selection.start + 2, end: selection.start + 2 });
      }, 0);
    }
  }, [value, selection, showAutocomplete, autocompleteSuggestions, selectedSuggestion]);

  // Обновление позиции курсора
  const handleSelectionChange = useCallback((event: any) => {
    const { selection } = event.nativeEvent;
    setSelection(selection);

    const textBeforeCursor = value.slice(0, selection.start);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;

    setCursorPosition({ line, column });
  }, [value]);

  // Синхронизация скролла
  const handleScroll = useCallback((event: NativeSyntheticEvent<TextInputScrollEventData>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollY(offsetY);
    highlightScrollRef.current?.scrollTo({
      y: offsetY,
      animated: false,
    });
  }, []);

  // Функция для раскрашивания кода
  const renderHighlightedCode = useCallback(() => {
    if (!value) {
      return (
        <View style={styles.lineContainer}>
          <Text style={styles.lineNumber}>1</Text>
          <View style={styles.lineContent}>
            <Text style={[styles.codeText, { color: COLORS.comment }]}>
              Введите код...
            </Text>
            {isFocused && cursorVisible && cursorPosition.line === 0 && cursorPosition.column === 0 && (
              <View style={[styles.cursor, { marginLeft: 0 }]} />
            )}
          </View>
        </View>
      );
    }

    const lines = value.split('\n');

    return lines.map((line, lineIndex) => {
      const tokens: React.ReactNode[] = [];
      let i = 0;
      const length = line.length;

      while (i < length) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '/' && nextChar === '/') {
          tokens.push(
            <Text key={`comment-${i}`} style={[styles.codeText, { color: COLORS.comment }]}>
              {line.slice(i)}
            </Text>
          );
          break;
        }

        if (char === '"' || char === "'" || char === '`') {
          const quote = char;
          let j = i + 1;

          while (j < length && line[j] !== quote) {
            if (line[j] === '\\') j += 2;
            else j++;
          }

          const str = line.slice(i, j + 1);

          tokens.push(
            <Text key={`string-${i}`} style={[styles.codeText, { color: COLORS.string }]}>
              {str}
            </Text>
          );
          i = j + 1;
          continue;
        }

        if (/[0-9]/.test(char) && (i === 0 || !/[a-zA-Z_]/.test(line[i-1]))) {
          let j = i;

          while (j < length && /[0-9.]/.test(line[j])) j++;

          const num = line.slice(i, j);

          tokens.push(
            <Text key={`number-${i}`} style={[styles.codeText, { color: COLORS.number }]}>
              {num}
            </Text>
          );
          i = j;
          continue;
        }

        if (/[a-zA-Z_]/.test(char)) {
          let j = i;

          while (j < length && /[a-zA-Z0-9_]/.test(line[j])) j++;

          const word = line.slice(i, j);

          const keywords = KEYWORDS[language] || [];
          let color = COLORS.text;

          if (keywords.includes(word)) {
            color = COLORS.keyword;
          } else if (['function', 'def', 'func'].includes(word)) {
            color = COLORS.function;
          } else if (['class', 'interface', 'struct', 'enum'].includes(word)) {
            color = COLORS.type;
          }

          tokens.push(
            <Text key={`word-${i}`} style={[styles.codeText, { color }]}>
              {word}
            </Text>
          );
          i = j;
          continue;
        }

        if (/[+\-*/%=<>!&|^~?:]/.test(char)) {
          tokens.push(
            <Text key={`op-${i}`} style={[styles.codeText, { color: COLORS.operator }]}>
              {char}
            </Text>
          );
          i++;
          continue;
        }

        if (/[{}()[\];,.]/.test(char)) {
          tokens.push(
            <Text key={`punc-${i}`} style={[styles.codeText, { color: COLORS.punctuation }]}>
              {char}
            </Text>
          );
          i++;
          continue;
        }

        tokens.push(
          <Text key={`text-${i}`} style={[styles.codeText, { color: COLORS.text }]}>
            {char}
          </Text>
        );
        i++;
      }

      const isCursorLine = lineIndex === cursorPosition.line;
      const showCursor = isCursorLine && isFocused && cursorVisible;

      return (
        <View key={`line-${lineIndex}`} style={styles.lineContainer}>
          <Text style={styles.lineNumber}>{lineIndex + 1}</Text>
          <View style={styles.lineContent}>
            {tokens}
            {showCursor && cursorPosition.column === line.length && (
              <View style={[styles.cursor, { marginLeft: 0 }]} />
            )}
          </View>
        </View>
      );
    });
  }, [value, language, cursorPosition, cursorVisible, isFocused]);

  // Базовые пропсы для TextInput (без ref)
  const textInputProps: ExtendedTextInputProps = {
    style: styles.hiddenInput,
    value,
    onChangeText: onChange,
    onSelectionChange: handleSelectionChange,
    onKeyPress: handleKeyPress,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    onScroll: handleScroll,
    multiline: true,
    editable: !readOnly,
    autoCapitalize: "none",
    autoCorrect: false,
    spellCheck: false,
    keyboardType: "default",
    keyboardAppearance: "dark",
    blurOnSubmit: false,
    textAlignVertical: "top",
    selectionColor: COLORS.selection,
    contextMenuHidden: true,
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
    textContentType: "none",
    importantForAutofill: "no",
  };

  // Добавляем Android-специфичный пропс только для Android
  if (Platform.OS === 'android') {
    textInputProps.includeFontPadding = false;
  }

  return (
    <View style={[styles.container, style, { height }]}>
      <View style={styles.toolbar}>
        <Text style={styles.languageText}>{language.toUpperCase()}</Text>
        <View style={styles.toolbarButtons}>
          <Text style={styles.statsText}>
            {value.split('\n').length} строк
          </Text>

          {onRun && (
            <TouchableOpacity
              style={[styles.runButton, runLoading && styles.runButtonDisabled]}
              onPress={onRun}
              disabled={runLoading}
            >
              <Text style={styles.runButtonText}>
                {runLoading ? '...' : '▶ Запустить'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.editorTouchable}
        onPress={() => inputRef.current?.focus()}
      >
        <View style={styles.editorContainer}>
          {/* Слой с подсветкой */}
          <ScrollView
            ref={highlightScrollRef}
            style={styles.highlightScroll}
            contentContainerStyle={styles.highlightContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            pointerEvents="none"
          >
            <View style={styles.editor}>
              {renderHighlightedCode()}
            </View>
          </ScrollView>

          {/* Реальный TextInput для ввода */}
          <TextInput
            ref={inputRef}
            {...textInputProps}
          />
        </View>
      </TouchableOpacity>

      {showAutocomplete && (
        <View style={styles.autocompleteContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {autocompleteSuggestions.map((item, index) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.suggestionItem,
                  index === selectedSuggestion && styles.suggestionItemSelected
                ]}
                onPress={() => insertSnippet(item)}
              >
                <Text style={[
                  styles.suggestionText,
                  index === selectedSuggestion && styles.suggestionTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.autocompleteBorder,
  },
  languageText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsText: {
    color: COLORS.comment,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  runButton: {
    backgroundColor: COLORS.string,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  runButtonDisabled: {
    opacity: 0.5,
  },
  runButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '600',
  },
  editorTouchable: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    position: 'relative',
  },
  highlightScroll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  highlightContent: {
    flexGrow: 1,
  },
  editor: {
    paddingVertical: PADDING_VERTICAL,
  },
  lineContainer: {
    flexDirection: 'row',
    paddingHorizontal: PADDING_HORIZONTAL,
    minHeight: LINE_HEIGHT,
  },
  lineNumber: {
    width: LINE_NUMBER_WIDTH,
    color: COLORS.lineNumber,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    textAlign: 'right',
    paddingRight: 8,
  },
  lineContent: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  // Общий стиль для всего кода (и подсветки и ввода)
  codeText: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    letterSpacing: LETTER_SPACING,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cursor: {
    width: 2,
    height: 18,
    backgroundColor: COLORS.text,
    opacity: 0.8,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    
    // Полное обнуление всех стилей
    padding: 0,
    margin: 0,
    borderWidth: 0,
    
    // Используем тот же стиль что и для подсветки
    ...Platform.select({
      ios: {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        letterSpacing: LETTER_SPACING,
        fontWeight: '400',
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
      android: {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        letterSpacing: LETTER_SPACING,
        fontWeight: '400',
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
    
    // Точное позиционирование для выравнивания с номерами строк
    paddingLeft: LINE_NUMBER_WIDTH + PADDING_HORIZONTAL,
    paddingTop: PADDING_VERTICAL,
    paddingBottom: PADDING_VERTICAL,
    paddingRight: PADDING_HORIZONTAL,
    
    // Красный текст для проверки (после проверки можно заменить на transparent)
    color: '#FF0000',
    
    // Прозрачный фон
    backgroundColor: 'transparent',
    
    // Поверх подсветки
    zIndex: 2,
    
    // Убираем все эффекты
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: 'transparent',
    elevation: 0,
  },
  autocompleteContainer: {
    position: 'absolute',
    bottom: 8,
    left: LINE_NUMBER_WIDTH + PADDING_HORIZONTAL,
    right: 8,
    maxHeight: 200,
    backgroundColor: COLORS.autocompleteBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.autocompleteBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.autocompleteBorder,
  },
  suggestionItemSelected: {
    backgroundColor: COLORS.autocompleteSelected,
  },
  suggestionText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  suggestionTextSelected: {
    color: COLORS.accent,
  },
});

export default CodeEditor;