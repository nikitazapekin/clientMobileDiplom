// components/FullScreenCodeEditor.tsx
import React from "react";
import {
  Modal,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CodeEditor from "../CodeEditor";
import { styles } from "../CodeEditor/styled";
import type { CodeLanguage } from "../Lesson/types";

interface FullScreenCodeEditorProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  onRun?: () => void;
  runLoading?: boolean;
  title?: string;
}

const FullScreenCodeEditor: React.FC<FullScreenCodeEditorProps> = ({
  visible,
  onClose,
  value,
  onChange,
  language,
  onRun,
  runLoading = false,
  title = "Редактор кода",
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalEditor}>
          <CodeEditor
            value={value}
            onChange={onChange}
            language={language}
            height={Platform.OS === 'ios' ? 500 : 400}
            onRun={onRun}
            runLoading={runLoading}
          />
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalButtonCancel]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Закрыть</Text>
          </TouchableOpacity>

          {onRun && (
            <TouchableOpacity
              style={styles.modalButton}
              onPress={onRun}
              disabled={runLoading}
            >
              <Text style={styles.modalButtonText}>
                {runLoading ? "Запуск..." : "Запустить"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default FullScreenCodeEditor;
