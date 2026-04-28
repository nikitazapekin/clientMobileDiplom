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

import ArticleBlocksEditor from "@/components/ArticleBlocksEditor";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import articlesService from "@/http/articles";
import type { ArticleBlock } from "@/http/types/community";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp, RootStackParamList } from "@/navigation/types";

type ArticleEditorRoute = RouteProp<
  RootStackParamList,
  typeof ROUTES.STACK.ARTICLE_EDITOR
>;

const parseTags = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const defaultBlocks: ArticleBlock[] = [{ type: "text", data: { text: "" } }];

export default function ArticleEditorScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<ArticleEditorRoute>();
  const articleId = route.params?.articleId;
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [blocks, setBlocks] = useState<ArticleBlock[]>(defaultBlocks);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!articleId) {
      return;
    }

    const load = async () => {
      try {
        const article = await articlesService.getArticleById(articleId);

        setTitle(article.title);
        setTagsInput(article.tags.join(", "));
        setBlocks(article.contentBlocks.length ? article.contentBlocks : defaultBlocks);
      } catch (err: any) {
        Alert.alert("Ошибка", err.message || "Не удалось загрузить статью");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [articleId]);

  const submit = async () => {
    const tags = parseTags(tagsInput);

    if (!title.trim() || tags.length === 0 || blocks.length === 0) {
      Alert.alert("Проверь поля", "Нужно заполнить заголовок, теги и хотя бы один блок статьи.");

      return;
    }

    try {
      setSaving(true);

      const saved = articleId
        ? await articlesService.updateArticle(articleId, {
          contentBlocks: blocks,
          tags,
          title: title.trim(),
        })
        : await articlesService.createArticle({
          contentBlocks: blocks,
          tags,
          title: title.trim(),
        });

      navigation.navigate(ROUTES.STACK.ARTICLE, {
        articleId: saved.id,
      });
    } catch (err: any) {
      Alert.alert("Ошибка", err.message || "Не удалось сохранить статью");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title={articleId ? "Редактирование статьи" : "Новая статья"} />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={COLORS.PRIMARY} size="large" />
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              {articleId
                ? "Обнови структуру материала"
                : "Собери статью из текста, таблиц, ссылок, изображений и demo code"}
            </Text>
            <Text style={styles.cardText}>
              Code-блоки ниже используют встроенный редактор из приложения.
            </Text>

            <TextInput
              onChangeText={setTitle}
              placeholder="Название статьи"
              placeholderTextColor={COLORS.GRAY_400}
              style={styles.input}
              value={title}
            />

            <TextInput
              onChangeText={setTagsInput}
              placeholder="Теги через запятую: sql, ui, architecture"
              placeholderTextColor={COLORS.GRAY_400}
              style={styles.input}
              value={tagsInput}
            />

            <ArticleBlocksEditor blocks={blocks} onChange={setBlocks} />

            <TouchableOpacity
              activeOpacity={0.88}
              disabled={saving}
              onPress={() => void submit()}
              style={[styles.submitButton, saving && styles.disabledButton]}
            >
              <Text style={styles.submitButtonText}>
                {saving ? "Сохраняю..." : articleId ? "Сохранить статью" : "Опубликовать статью"}
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
    backgroundColor: "#F4F6F1",
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
    gap: 16,
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
    marginBottom: 2,
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
  submitButton: {
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 18,
    marginTop: 6,
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
