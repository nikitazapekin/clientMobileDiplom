import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RouteProp} from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { COLORS, FONTS } from "appStyles";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import forumService from "@/http/forum";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp, RootStackParamList } from "@/navigation/types";

type ForumEditorRoute = RouteProp<
  RootStackParamList,
  typeof ROUTES.STACK.FORUM_EDITOR
>;

const parseTags = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function ForumEditorScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<ForumEditorRoute>();
  const questionId = route.params?.questionId;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(Boolean(questionId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!questionId) {
      return;
    }

    const load = async () => {
      try {
        const question = await forumService.getQuestionById(questionId);

        setTitle(question.title);
        setContent(question.content);
        setTagsInput(question.tags.join(", "));
      } catch (err: any) {
        Alert.alert("Ошибка", err.message || "Не удалось загрузить вопрос");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [questionId]);

  const submit = async () => {
    const tags = parseTags(tagsInput);

    if (!title.trim() || !content.trim() || tags.length === 0) {
      Alert.alert("Проверь поля", "Нужно заполнить заголовок, описание и хотя бы один тег.");

      return;
    }

    try {
      setSaving(true);

      const saved = questionId
        ? await forumService.updateQuestion(questionId, {
          content: content.trim(),
          tags,
          title: title.trim(),
        })
        : await forumService.createQuestion({
          content: content.trim(),
          tags,
          title: title.trim(),
        });

      navigation.navigate(ROUTES.STACK.FORUM_QUESTION, {
        questionId: saved.id,
      });
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось сохранить вопрос");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title={questionId ? "Редактирование вопроса" : "Новый вопрос"} />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={COLORS.PRIMARY} size="large" />
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              {questionId ? "Исправь формулировку и теги" : "Сформулируй вопрос понятно и предметно"}
            </Text>
            <Text style={styles.cardText}>
              Чем точнее контекст, тем выше шанс получить полезный и быстрый ответ.
            </Text>

            <TextInput
              onChangeText={setTitle}
              placeholder="Название вопроса"
              placeholderTextColor={COLORS.GRAY_400}
              style={styles.input}
              value={title}
            />

            <TextInput
              multiline={true}
              onChangeText={setContent}
              placeholder="Опиши проблему, шаги, что уже пробовал и где упираешься"
              placeholderTextColor={COLORS.GRAY_400}
              style={[styles.input, styles.textArea]}
              value={content}
            />

            <TextInput
              onChangeText={setTagsInput}
              placeholder="Теги через запятую: nestjs, jwt, mobile"
              placeholderTextColor={COLORS.GRAY_400}
              style={styles.input}
              value={tagsInput}
            />

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={saving}
              onPress={() => void submit()}
              style={[styles.submitButton, saving && styles.disabledButton]}
            >
              <Text style={styles.submitButtonText}>
                {saving ? "Сохраняю..." : questionId ? "Сохранить вопрос" : "Опубликовать вопрос"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Footer activeTab="courses" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
 
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  formCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  cardTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.LG,
    fontWeight: "800",
    lineHeight: 30,
  },
  cardText: {
    color: COLORS.GRAY_600,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 22,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.GRAY_50,
    borderColor: COLORS.GRAY_200,
    borderRadius: 16,
    borderWidth: 1,
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.SM,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  textArea: {
    minHeight: 180,
    textAlignVertical: "top",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#9F0FA7",
    borderRadius: 18,
    marginTop: 4,
    paddingVertical: 15,
  },
  disabledButton: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "800",
  },
});
