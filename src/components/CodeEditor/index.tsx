import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  StyleProp,
  TextInputKeyPressEventData,
  TextInputProps,
  TextInputScrollEventData,
  TextInputSelectionChangeEventData,
  ViewStyle,
} from 'react-native';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'php'
  | 'ruby'
  | 'rust'
  | 'java'
  | 'csharp'
  | 'golang'
  | 'cpp';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  readOnly?: boolean;
  height?: number;
  onRun?: () => void;
  runLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const KEYWORDS: Record<CodeLanguage, string[]> = {
  javascript: [
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
    'return', 'class', 'this', 'new', 'try', 'catch', 'finally',
    'switch', 'case', 'break', 'continue', 'typeof', 'instanceof',
    'console.log', 'Array', 'Object', 'String', 'Number', 'Boolean',
  ],
  typescript: [
    'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
    'return', 'class', 'interface', 'type', 'enum', 'extends', 'implements',
    'public', 'private', 'protected', 'readonly', 'as', 'unknown', 'never',
    'console.log', 'Array', 'Record', 'Partial', 'Pick', 'Promise',
  ],
  python: [
    'def', 'if', 'elif', 'else', 'for', 'while', 'return', 'import',
    'from', 'as', 'class', 'try', 'except', 'finally', 'with',
    'print', 'len', 'range', 'enumerate', 'zip', 'open', 'None',
    'True', 'False', 'and', 'or', 'not', 'in', 'is', 'lambda',
  ],
  php: [
    'function', 'if', 'elseif', 'else', 'for', 'foreach', 'while', 'return',
    'echo', 'print', 'class', 'public', 'private', 'protected', 'new',
    'array', 'null', 'true', 'false', 'try', 'catch', 'finally',
    'json_encode', 'json_decode', 'count', 'isset', 'empty',
  ],
  ruby: [
    'def', 'end', 'if', 'elsif', 'else', 'unless', 'for', 'while',
    'do', 'class', 'module', 'return', 'puts', 'print', 'each',
    'map', 'select', 'nil', 'true', 'false', 'begin', 'rescue',
    'ensure', 'require', 'attr_reader', 'attr_accessor',
  ],
  rust: [
    'fn', 'let', 'mut', 'if', 'else', 'match', 'loop', 'while', 'for',
    'return', 'struct', 'enum', 'impl', 'trait', 'pub', 'use',
    'println!', 'print!', 'vec!', 'Some', 'None', 'Result', 'Ok', 'Err',
    'String', 'Vec', 'HashMap',
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

const FONT_FAMILY = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

const FONT_SIZE = 14;
const LINE_HEIGHT = 20;
const CURSOR_HEIGHT = 18;
const PADDING_VERTICAL = 8;
const PADDING_HORIZONTAL = 8;
const LINE_NUMBER_WIDTH = 40;
const CURSOR_SAMPLE = 'MMMMMMMMMM';

const LETTER_SPACING = Platform.select({
  ios: -0.3,
  android: -0.2,
  default: -0.2,
});

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
  const horizontalScrollRef = useRef<ScrollView>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const selectionRef = useRef(selection);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [characterWidth, setCharacterWidth] = useState(FONT_SIZE * 0.6);
  const [lineLayouts, setLineLayouts] = useState<Record<number, { y: number; height: number }>>({});
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const setTrackedSelection = useCallback((nextSelection: { start: number; end: number }) => {
    selectionRef.current = nextSelection;
    setSelection(nextSelection);
  }, []);

  const syncSelectionToInput = useCallback((nextSelection: { start: number; end: number }) => {
    setTrackedSelection(nextSelection);

    setTimeout(() => {
      inputRef.current?.setNativeProps({ selection: nextSelection });
    }, 0);
  }, [setTrackedSelection]);

  const getCurrentWord = useCallback((text: string, pos: number) => {
    const beforeCursor = text.slice(0, pos);
    const afterCursor = text.slice(pos);

    const beforeMatch = beforeCursor.match(/[a-zA-Z0-9_.]*$/);
    const afterMatch = afterCursor.match(/^[a-zA-Z0-9_]*/);

    return (beforeMatch ? beforeMatch[0] : '') + (afterMatch ? afterMatch[0] : '');
  }, []);

  const getCursorLocation = useCallback((text: string, offset: number) => {
    const textBeforeCursor = text.slice(0, offset);
    const lines = textBeforeCursor.split('\n');

    return {
      line: lines.length - 1,
      column: lines[lines.length - 1].length,
    };
  }, []);

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

  const insertSnippet = useCallback((snippet: string) => {
    const currentSelection = selectionRef.current;
    const beforeCursor = value.slice(0, currentSelection.start);
    const afterCursor = value.slice(currentSelection.end);
    const word = getCurrentWord(value, currentSelection.start);

    const newText = beforeCursor.slice(0, -word.length) + snippet + afterCursor;

    onChange(newText);

    const newPosition = beforeCursor.length - word.length + snippet.length;

    syncSelectionToInput({ start: newPosition, end: newPosition });
    setShowAutocomplete(false);
  }, [value, onChange, getCurrentWord, syncSelectionToInput]);

  const handleChangeText = useCallback((nextValue: string) => {
    const currentSelection = selectionRef.current;
    const beforeCursor = value.slice(0, currentSelection.start);
    const afterCursor = value.slice(currentSelection.end);
    const canResolveInsertedText =
      nextValue.startsWith(beforeCursor) &&
      nextValue.endsWith(afterCursor) &&
      nextValue.length >= beforeCursor.length + afterCursor.length;

    if (!canResolveInsertedText) {
      onChange(nextValue);

      return;
    }

    const insertedText = nextValue.slice(
      beforeCursor.length,
      nextValue.length - afterCursor.length
    );

    if (insertedText !== '\n') {
      onChange(nextValue);

      return;
    }

    const currentLine = beforeCursor.slice(beforeCursor.lastIndexOf('\n') + 1);
    const currentIndent = currentLine.match(/^\s*/)?.[0] ?? '';
    const trimmedLine = currentLine.trimEnd();
    const shouldIncreaseIndent =
      /[[{(]\s*$/.test(trimmedLine) || trimmedLine.endsWith(':');
    const newIndent = shouldIncreaseIndent ? `${currentIndent}  ` : currentIndent;
    const nextText = `${beforeCursor}\n${newIndent}${afterCursor}`;
    const nextCursorPosition = beforeCursor.length + 1 + newIndent.length;

    onChange(nextText);
    syncSelectionToInput({ start: nextCursorPosition, end: nextCursorPosition });
  }, [value, onChange, syncSelectionToInput]);

  const handleKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
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

    if (key === 'Tab') {
      e.preventDefault();
      const currentSelection = selectionRef.current;
      const newText =
        value.slice(0, currentSelection.start) +
        '  ' +
        value.slice(currentSelection.end);

      onChange(newText);
      syncSelectionToInput({
        start: currentSelection.start + 2,
        end: currentSelection.start + 2,
      });
    }
  }, [
    value,
    showAutocomplete,
    autocompleteSuggestions,
    selectedSuggestion,
    insertSnippet,
    onChange,
    syncSelectionToInput,
  ]);

  const handleSelectionChange = useCallback((event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    const { selection } = event.nativeEvent;

    setCursorVisible(true);
    setTrackedSelection(selection);
  }, [setTrackedSelection]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<TextInputScrollEventData>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    highlightScrollRef.current?.scrollTo({
      y: offsetY,
      animated: false,
    });
  }, []);

  const handleCharacterMeasure = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width / CURSOR_SAMPLE.length;

    if (width > 0) {
      setCharacterWidth(width);
    }
  }, []);

  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;

    if (width > 0) {
      setViewportWidth(width);
    }
  }, []);

  const handleLineLayout = useCallback((lineIndex: number, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;

    setLineLayouts(prev => {
      const currentLayout = prev[lineIndex];

      if (currentLayout && currentLayout.y === y && currentLayout.height === height) {
        return prev;
      }

      return {
        ...prev,
        [lineIndex]: { y, height },
      };
    });
  }, []);

  const cursorLocation = getCursorLocation(value, selection.start);
  const activeLineLayout = lineLayouts[cursorLocation.line];
  const longestLineLength = value
    .split('\n')
    .reduce((maxLength, line) => Math.max(maxLength, line.length), 1);
  const contentWidth = Math.max(
    viewportWidth,
    LINE_NUMBER_WIDTH + PADDING_HORIZONTAL * 2 + longestLineLength * characterWidth
  );
  const shouldRenderCursor =
    isFocused &&
    !readOnly &&
    cursorVisible &&
    selection.start === selection.end;
  const cursorStyle = {
    left: LINE_NUMBER_WIDTH + PADDING_HORIZONTAL + cursorLocation.column * characterWidth,
    top:
      (activeLineLayout?.y ?? PADDING_VERTICAL + cursorLocation.line * LINE_HEIGHT) +
      ((activeLineLayout?.height ?? LINE_HEIGHT) - CURSOR_HEIGHT) / 2,
  };

  const renderHighlightedCode = useCallback(() => {
    if (!value) {
      return (
        <View style={styles.lineContainer}>
          <Text style={styles.lineNumber}>1</Text>
          <View style={styles.lineContent}>
            <Text style={[styles.codeText, { color: COLORS.comment }]}>
              Введите код...
            </Text>
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

      return (
        <View
          key={`line-${lineIndex}`}
          style={styles.lineContainer}
          onLayout={event => handleLineLayout(lineIndex, event)}
        >
          <Text style={styles.lineNumber}>{lineIndex + 1}</Text>
          <View style={styles.lineContent}>{tokens}</View>
        </View>
      );
    });
  }, [value, language, handleLineLayout]);

  const textInputProps: ExtendedTextInputProps = {
    style: styles.hiddenInput,
    value,
    onChangeText: handleChangeText,
    onSelectionChange: handleSelectionChange,
    onKeyPress: handleKeyPress,
    onFocus: () => {
      setCursorVisible(true);
      setIsFocused(true);
    },
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
    caretHidden: true,
  };

  if (Platform.OS === 'android') {
    textInputProps.includeFontPadding = false;
    textInputProps.cursorColor = COLORS.text;
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
        <View style={styles.editorContainer} onLayout={handleViewportLayout}>
          <ScrollView
            ref={horizontalScrollRef}
            horizontal={true}
            style={styles.horizontalScroll}
            contentContainerStyle={[styles.horizontalContent, { width: contentWidth }]}
            showsHorizontalScrollIndicator={true}
            bounces={false}
            alwaysBounceHorizontal={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            <View style={[styles.editorCanvas, { width: contentWidth }]}>
              <ScrollView
                ref={highlightScrollRef}
                style={styles.highlightScroll}
                contentContainerStyle={styles.highlightContent}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                pointerEvents="none"
              >
                <View style={[styles.editor, { width: contentWidth }]}>
                  {renderHighlightedCode()}
                  {shouldRenderCursor && (
                    <View style={[styles.cursor, cursorStyle]} />
                  )}
                </View>
              </ScrollView>

              <TextInput
                ref={inputRef}
                {...textInputProps}
                style={[styles.hiddenInput, { width: contentWidth }]}
              />
              <Text
                style={styles.measureText}
                onLayout={handleCharacterMeasure}
                pointerEvents="none"
              >
                {CURSOR_SAMPLE}
              </Text>
            </View>
          </ScrollView>
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
  horizontalScroll: {
    flex: 1,
  },
  horizontalContent: {
    minWidth: '100%',
  },
  editorCanvas: {
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
    position: 'relative',
  },
  lineContainer: {
    flexDirection: 'row',
    paddingHorizontal: PADDING_HORIZONTAL,
    minHeight: LINE_HEIGHT,
    alignItems: 'flex-start',
  },
  lineNumber: {
    width: LINE_NUMBER_WIDTH,
    color: COLORS.lineNumber,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    textAlign: 'right',
    paddingRight: 8,
  },
  lineContent: {
    flex: 1,
    minHeight: LINE_HEIGHT,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    alignItems: 'flex-start',
  },

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
    position: 'absolute',
    width: 2,
    height: CURSOR_HEIGHT,
    backgroundColor: COLORS.text,
    zIndex: 3,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,

    padding: 0,
    margin: 0,
    borderWidth: 0,

    ...Platform.select({
      ios: {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        letterSpacing: LETTER_SPACING,
        fontWeight: '400',
        includeFontPadding: false,
        textAlignVertical: 'top',
      },
      android: {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        letterSpacing: LETTER_SPACING,
        fontWeight: '400',
        includeFontPadding: false,
        textAlignVertical: 'top',
      },
    }),

    paddingLeft: LINE_NUMBER_WIDTH + PADDING_HORIZONTAL,
    paddingTop: PADDING_VERTICAL,
    paddingBottom: PADDING_VERTICAL,
    paddingRight: PADDING_HORIZONTAL,

    color: 'transparent',

    backgroundColor: 'transparent',

    zIndex: 2,
    opacity: 0,

    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: 'transparent',
    elevation: 0,
  },
  measureText: {
    position: 'absolute',
    opacity: 0,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    letterSpacing: LETTER_SPACING,
    fontWeight: '400',
    includeFontPadding: false,
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
