import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { COLORS, FONTS } from "appStyles";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import articlesService from "@/http/articles";
import type { Article } from "@/http/types/community";
import { ROUTES } from "@/navigation/routes";
import type { RootStackNavigationProp } from "@/navigation/types";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function ArticlesScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async (isRefresh = false) => {
    try {
      setError(null);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await articlesService.getArticles({
        limit: 50,
        page: 1,
        search: search.trim() || undefined,
        tag: tag.trim() || undefined,
      });

      setArticles(response.items);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить статьи");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, tag]);

  useFocusEffect(
    useCallback(() => {
      void loadArticles();
    }, [loadArticles]),
  );

  return (
    <View style={styles.screen}>
      <Header title="Статьи" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[COLORS.PRIMARY]}
            onRefresh={() => void loadArticles(true)}
            refreshing={refreshing}
          />
        }
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Статьи</Text>
         
          <Text style={styles.heroText}>
            Публикуй свои статьи и делитесь ими с другими пользователями!
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate(ROUTES.STACK.ARTICLE_EDITOR)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Новая статья</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersCard}>
          <TextInput
            onChangeText={setSearch}
            placeholder="Поиск по названию"
            placeholderTextColor={COLORS.GRAY_400}
            style={styles.input}
            value={search}
          />

          <TextInput
            onChangeText={setTag}
            placeholder="Фильтр по тегу"
            placeholderTextColor={COLORS.GRAY_400}
            style={styles.input}
            value={tag}
          />

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => void loadArticles()}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Найти статьи</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={COLORS.PRIMARY} size="large" />
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => void loadArticles()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>Статей пока нет</Text>
            <Text style={styles.emptyText}>
              Можно опубликовать первую и сразу использовать изображения, таблицы и демо-код.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {articles.map((article) => (
              <TouchableOpacity
                activeOpacity={0.88}
                key={article.id}
                onPress={() =>
                  navigation.navigate(ROUTES.STACK.ARTICLE, {
                    articleId: article.id,
                  })
                }
                style={styles.articleCard}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardDate}>{formatDate(article.createdAt)}</Text>
                  <View style={styles.reactionBadge}>
                    <Text style={styles.reactionBadgeText}>
                      {article.likes - article.dislikes >= 0 ? "+" : ""}
                      {article.likes - article.dislikes}
                    </Text>
                  </View>
                </View>

                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text numberOfLines={4} style={styles.articleExcerpt}>
                  {article.excerpt}
                </Text>

                <View style={styles.tagsWrap}>
                  {article.tags.map((item) => (
                    <View key={`${article.id}-${item}`} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.authorText}>{article.authorName}</Text>
                   
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Footer activeTab="courses" />
    </View>
  );
}
/*
    backgroundColor: COLORS.GRAY_DARK,
    borderRadius: 28,
    marginBottom: 16,
    overflow: "hidden",
    padding: 20,
  },
  heroEyebrow: {
    color: "#C3D4B6",
    fontSize: 12,
    */
const styles = StyleSheet.create({
  screen: {
  
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 110,
  },
  heroCard: {
   
    
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
     backgroundColor: COLORS.GRAY_DARK,
  },
  heroEyebrow: {
 color: "white",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroTitle: {
   
    fontSize: FONTS.SIZE.LG,
    fontWeight: "800",
    lineHeight: 30,
    color: "white",
  },
  heroText: {
    color: "white",
    fontSize: FONTS.SIZE.SM,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 18,
  },
  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor:"#9F0FA7",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: "800",
  },
  filtersCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },
  input: {
    backgroundColor: COLORS.GRAY_50,
    borderColor: COLORS.GRAY_200,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.SM,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButton: {
    alignItems: "center",
   
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: "#9F0FA7", 
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 24,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: FONTS.SIZE.SM,
    textAlign: "center",
  },
  emptyTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.MD,
    fontWeight: "800",
  },
  emptyText: {
    color: COLORS.GRAY_600,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 22,
    textAlign: "center",
  },
  list: {
    gap: 14,
  },
  articleCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.GRAY_200,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardDate: {
    color: COLORS.GRAY_500,
    fontSize: 12,
  },
  reactionBadge: {
    backgroundColor: "#9F0FA7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reactionBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },
  articleTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: FONTS.SIZE.MD,
    fontWeight: "800",
    lineHeight: 27,
  },
  articleExcerpt: {
    color: COLORS.GRAY_700,
    fontSize: FONTS.SIZE.SM,
    lineHeight: 23,
    marginTop: 8,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  tagChip: {
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tagText: {
    color: COLORS.GRAY_700,
    fontSize: 12,
    fontWeight: "700",
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  authorText: {
    color: COLORS.GRAY_DARK,
    fontSize: 13,
    fontWeight: "700",
  },
  metaText: {
    color: COLORS.GRAY_500,
    fontSize: 13,
  },
});
