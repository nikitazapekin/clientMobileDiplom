// components/CodeEditor/index.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Text,
} from "react-native";
import { WebView } from "react-native-webview";
import { styles } from "./styled";
import type { CodeLanguage } from "../Lesson/types";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  readOnly?: boolean;
  height?: number;
  /** При наличии показывается зелёная кнопка "Запуск" справа сверху */
  onRun?: () => void;
  runLoading?: boolean;
}

// Простой редактор для мобильных устройств с подсветкой синтаксиса через WebView
const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = 240,
  onRun,
  runLoading = false,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Обновление локального состояния при изменении value извне
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Отправка изменений в WebView
  useEffect(() => {
    if (webViewRef.current && !isFocused) {
      const script = `
        if (window.editor && window.editor.getValue() !== ${JSON.stringify(localValue)}) {
          window.editor.setValue(${JSON.stringify(localValue)});
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [localValue, isFocused]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  // HTML для WebView с Monaco Editor
  const getEditorHTML = () => {
    const monacoLang = {
      javascript: "javascript",
      python: "python",
      csharp: "csharp",
      java: "java",
      golang: "go",
    }[language] || "plaintext";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
            background-color: #1e1e1e;
          }
          #container {
            width: 100%;
            height: 100%;
          }
          .run-button {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 1000;
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 4px;
            background: #2ea043;
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
          }
          .run-button:hover:not(:disabled) {
            background: #238636;
          }
          .run-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .run-icon {
            width: 0;
            height: 0;
            margin-left: 2px;
            border-style: solid;
            border-width: 6px 0 6px 10px;
            border-color: transparent transparent transparent currentColor;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            font-family: system-ui;
          }
        </style>
        <link rel="stylesheet" data-name="vs/editor/editor.main" href="https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs/editor/editor.main.min.css">
        <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs/loader.js"></script>
      </head>
      <body>
        <div id="container"></div>
        ${onRun ? `
          <button class="run-button" id="runButton" ${runLoading ? 'disabled' : ''}>
            <span class="run-icon"></span>
          </button>
        ` : ''}
        <script>
          (function() {
            const container = document.getElementById('container');
            const runButton = document.getElementById('runButton');
            
            let editor = null;
            let isUpdating = false;

            require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs' } });
            
            require(['vs/editor/editor.main'], function() {
              monaco.editor.defineTheme('custom-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                  'editor.background': '#1e1e1e',
                  'editor.lineHighlightBackground': '#2a2a2a',
                  'editorLineNumber.foreground': '#6e6e6e',
                }
              });

              editor = monaco.editor.create(container, {
                value: ${JSON.stringify(localValue)},
                language: '${monacoLang}',
                theme: 'custom-dark',
                readOnly: ${readOnly},
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                suggest: { showKeywords: true, showSnippets: true },
                quickSuggestions: true,
                tabSize: 2,
                padding: { top: 8 },
                lineHeight: 18,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              });

              window.editor = editor;

              editor.onDidChangeModelContent(() => {
                if (!isUpdating) {
                  const newValue = editor.getValue();
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'change',
                    value: newValue
                  }));
                }
              });

              editor.onDidFocusEditorText(() => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'focus'
                }));
              });

              editor.onDidBlurEditorText(() => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'blur'
                }));
              });
            });

            if (runButton) {
              runButton.addEventListener('click', function() {
                if (!this.disabled) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'run'
                  }));
                }
              });
            }

            window.setEditorValue = function(newValue) {
              if (editor && editor.getValue() !== newValue) {
                isUpdating = true;
                editor.setValue(newValue);
                isUpdating = false;
              }
            };
          })();
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'change':
          handleChange(data.value);
          break;
        case 'focus':
          setIsFocused(true);
          break;
        case 'blur':
          setIsFocused(false);
          break;
        case 'run':
          if (onRun && !runLoading) {
            onRun();
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        source={{ html: getEditorHTML() }}
        onMessage={handleMessage}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      /*   onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }} */
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#2ea043" />
          </View>
        )}
        startInLoadingState={true}
      />
    </View>
  );
};

// Альтернативный простой редактор для случаев, когда WebView не подходит
export const SimpleCodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = 240,
  onRun,
  runLoading = false,
}) => {
  return (
    <View style={[styles.simpleContainer, { height }]}>
      {onRun && (
        <TouchableOpacity
          style={[styles.simpleRunButton, runLoading && styles.simpleRunButtonDisabled]}
          onPress={onRun}
          disabled={runLoading}
        >
          {runLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.simpleRunIcon} />
          )}
        </TouchableOpacity>
      )}
      <TextInput
        style={[
          styles.simpleInput,
          readOnly && styles.simpleInputReadOnly,
          { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }
        ]}
        value={value}
        onChangeText={onChange}
        editable={!readOnly}
        multiline
        numberOfLines={Math.floor(height / 20)}
        textAlignVertical="top"
        placeholder={`Введите код на ${language}...`}
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
    </View>
  );
};

export default CodeEditor;