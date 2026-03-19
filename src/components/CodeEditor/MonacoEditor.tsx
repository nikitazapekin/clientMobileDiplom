
import React, { forwardRef,useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const editorHtml = require('./webview-assets/editor.html');

export interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  options?: {
    readOnly?: boolean;
    minimap?: { enabled: boolean };
    fontSize?: number;
    lineNumbers?: string;
    scrollBeyondLastLine?: boolean;
    automaticLayout?: boolean;
    wordWrap?: string;
    suggest?: {
      showKeywords?: boolean;
      showSnippets?: boolean;
      showMethods?: boolean;
      showFunctions?: boolean;
    };
    quickSuggestions?: boolean;
    tabSize?: number;
    padding?: { top: number };
    theme?: string;
    fontFamily?: string;
    cursorBlinking?: string;
    cursorSmoothCaretAnimation?: boolean;
    renderLineHighlight?: string;
  };
  editorDidMount?: (editor: any) => void;
  style?: any;
}

export interface MonacoEditorRef {
  setValue: (value: string) => void;
  getValue: () => string;
}

const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>(
  ({ value, language, onChange, options, editorDidMount, style }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const isInternalChange = useRef(false);
    const initialValueSent = useRef(false);

    const injectedJavaScript = `
      (function() {
        var messageHandlers = {
          'initialize': function(data) {
            if (window.initializeEditor) {
              window.initializeEditor(data.value, data.language, data.options);
            }
          },
          'setValue': function(data) {
            if (window.editor && window.editor.getValue() !== data.value) {
              window.editor.setValue(data.value);
            }
          },
          'setLanguage': function(data) {
            if (window.editor && window.monaco) {
              monaco.editor.setModelLanguage(window.editor.getModel(), data.language);
            }
          },
          'setOptions': function(data) {
            if (window.editor) {
              window.editor.updateOptions(data.options);
            }
          }
        };

        window.ReactNativeWebView.onMessage = function(event) {
          try {
            var message = JSON.parse(event.nativeEvent.data);
            var handler = messageHandlers[message.type];
            if (handler) {
              handler(message.data);
            }
          } catch (e) {
            console.error('Message parsing error:', e);
          }
        };

        return true;
      })();
    `;

    useImperativeHandle(ref, () => ({
      setValue: (newValue: string) => {
        webViewRef.current?.postMessage(
          JSON.stringify({ type: 'setValue', data: { value: newValue } })
        );
      },
      getValue: () => {
       
        return value;
      },
    }));

    const handleMessage = (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        switch (data.type) {
          case 'initialized':
            initialValueSent.current = true;
            editorDidMount?.({});
            break;

          case 'change':
            if (!isInternalChange.current) {
              onChange(data.value);
            }

            break;
        }
      } catch (e) {
        console.error('WebView message error:', e);
      }
    };

    const source = {
      html: editorHtml,
      baseUrl: '',
    };

    return (
      <WebView
        ref={webViewRef}
        source={source}
        style={[styles.webview, style]}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scrollEnabled={false}
        onShouldStartLoadWithRequest={(request) => {
          return request.url === 'about:blank';
        }}
      />
    );
  }
);

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
});

export default MonacoEditor;
