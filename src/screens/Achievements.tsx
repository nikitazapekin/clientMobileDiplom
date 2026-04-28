import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { COLORS } from "appStyles";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { AchievementsService } from "../http/achievements";
import { LeadersService } from "../http/leaders";
import type { Achievement, AchievementProgress } from "../http/types/achievements";
import type { LeaderboardEntry, LeaderboardResponse } from "../http/types/leaders";

import { styles } from "./styles";

const RANK_COLORS: Record<number, { background: string; border: string }> = {
  1: { background: "#fff8e1", border: "#f59e0b" },
  2: { background: "#f8fafc", border: "#cbd5e1" },
  3: { background: "#fff7ed", border: "#fdba74" },
};

const LEADERBOARD_PAGE_SIZE = 50;

type ScreenError = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getScreenErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const normalizedError = error as ScreenError;

  return normalizedError.response?.data?.message || normalizedError.message || fallback;
};

export default function AchievementsScreen() {
  const route = useRoute();
  const activeTab: TabName =
    route.name === "Achievements" ? "achievements" : "achievements";

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const auditoryId = await AsyncStorage.getItem("userId");

      if (!auditoryId) {
        setError("Пользователь не авторизован");

        return;
      }

      try {
        await AchievementsService.checkAndAwardAchievements(auditoryId);
      } catch (awardError: unknown) {
        console.error("Error awarding achievements:", getScreenErrorMessage(awardError, "Unknown error"));
      }

      const [achievementsData, progressData, leaderboardData] =
        await Promise.all([
          AchievementsService.getAchievementsByAuditoryId(auditoryId),
          AchievementsService.getAchievementProgress(auditoryId),
          LeadersService.getLeaderboard(currentPage),
        ]);

      setAchievements(achievementsData);
      setProgress(progressData);
      setLeaderboard(leaderboardData);
    } catch (error: unknown) {
      console.error("Error loading achievements:", getScreenErrorMessage(error, "Unknown error"));
      setError(
        getScreenErrorMessage(
          error,
          "Не удалось загрузить достижения и рейтинг",
        ),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage]);

  useFocusEffect(
    useCallback(() => {
      void loadAchievements();
    }, [loadAchievements]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadAchievements();
  };

  const handlePageChange = (nextPage: number) => {
    if (!leaderboard) {
      return;
    }

    if (nextPage < 1 || nextPage > leaderboard.totalPages) {
      return;
    }

    if (nextPage === currentPage) {
      return;
    }

    setCurrentPage(nextPage);
  };

  const getTierColor = (tier: string): string => {
    const tierColors: Record<string, string> = {
      novice: COLORS.PRIMARY,
      advanced: "#3b82f6",
      expert: "#8b5cf6",
      master: "#f59e0b",
      beginner: COLORS.PRIMARY,
      intermediate: "#3b82f6",
      professional: "#8b5cf6",
      legendary: "#f59e0b",
    };

    return tierColors[tier] || COLORS.GRAY_500;
  };

  const getTierLabel = (tier: string): string => {
    const tierLabels: Record<string, string> = {
      novice: "Новичок",
      advanced: "Продвинутый",
      expert: "Эксперт",
      master: "Мастер",
      beginner: "Начинающий",
      intermediate: "Средний",
      professional: "Профессионал",
      legendary: "Легенда",
    };

    return tierLabels[tier] || tier;
  };

  const getRankMark = (rank: number): string => {
    if (rank === 1) return "🥇";

    if (rank === 2) return "🥈";

    if (rank === 3) return "🥉";

    return `#${rank}`;
  };

  const getLeaderboardAvatarUri = (
    leader: LeaderboardEntry,
  ): string | null => {
    if (!leader.avatarUrl) {
      return null;
    }

    if (leader.avatarUrl.startsWith("data:")) {
      return leader.avatarUrl;
    }

    return `data:${leader.avatarMimeType || "image/jpeg"};base64,${leader.avatarUrl}`;
  };

  const getInitials = (leader: LeaderboardEntry): string => {
    const initials = [leader.firstName, leader.lastName]
      .map((value) => value?.trim()?.[0] || "")
      .join("")
      .toUpperCase();

    return initials || "ST";
  };

  const renderProgressItem = (
    label: string,
    current: number,
    thresholds: { tier: string; required: number }[],
  ) => {
    const nextThreshold = thresholds.find((threshold) => threshold.required > current);
    const currentProgress = nextThreshold
      ? (current / nextThreshold.required) * 100
      : 100;

    return (
      <View style={styles.progressItem}>
        <Text style={styles.progressLabel}>{label}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(currentProgress, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {current} / {nextThreshold?.required || "∞"}
        </Text>
      </View>
    );
  };

  const renderProgressSection = () => {
    if (!progress) {
      return null;
    }

    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Прогресс</Text>

        {renderProgressItem(
          "Уроки с 2+ звездами",
          progress.studentResults.current,
          progress.studentResults.thresholds,
        )}

        {renderProgressItem(
          "Решенные задачи",
          progress.solvedTasks.current,
          progress.solvedTasks.thresholds,
        )}
      </View>
    );
  };

  const renderMyRankSection = () => {
    const currentUser = leaderboard?.currentUser;

    if (!leaderboard || !currentUser) {
      return null;
    }

    return (
      <View style={styles.myRankCard}>
        <Text style={styles.myRankLabel}>Моя позиция</Text>
        <Text style={styles.myRankName}>{currentUser.fullName}</Text>
        <Text style={styles.myRankMeta}>
          Уровень {currentUser.level} из {leaderboard.totalStudents} студентов
        </Text>

        <View style={styles.myRankStatsRow}>
          <View style={styles.myRankStat}>
            <Text style={styles.myRankStatValue}>#{currentUser.rank}</Text>
            <Text style={styles.myRankStatLabel}>место</Text>
          </View>

          <View style={styles.myRankStat}>
            <Text style={styles.myRankStatValue}>{currentUser.score}</Text>
            <Text style={styles.myRankStatLabel}>общий XP</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLeaderboardRow = (leader: LeaderboardEntry) => {
    const isCurrentUser = leaderboard?.currentUser?.clientId === leader.clientId;
    const colors = RANK_COLORS[leader.rank] || {
      background: COLORS.GRAY_50,
      border: COLORS.GRAY_200,
    };
    const avatarUri = getLeaderboardAvatarUri(leader);

    return (
      <View
        key={leader.id}
        style={[
          styles.leaderboardRow,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
          isCurrentUser && styles.leaderboardRowCurrent,
        ]}
      >
        <View style={styles.leaderboardRankBadge}>
          <Text style={styles.leaderboardRankText}>{getRankMark(leader.rank)}</Text>
        </View>

        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.leaderboardAvatarImage} />
        ) : (
          <View style={styles.leaderboardAvatarPlaceholder}>
            <Text style={styles.leaderboardAvatarPlaceholderText}>
              {getInitials(leader)}
            </Text>
          </View>
        )}

        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName} numberOfLines={1}>
            {leader.fullName}
          </Text>
          <Text style={styles.leaderboardMeta}>
            Уровень {leader.level}
            {isCurrentUser ? " • это вы" : ""}
          </Text>
        </View>

        <View style={styles.leaderboardScore}>
          <Text style={styles.leaderboardScoreValue}>{leader.score}</Text>
          <Text style={styles.leaderboardScoreLabel}>XP</Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardSection = () => {
    if (!leaderboard) {
      return null;
    }

    const pageStart = (leaderboard.page - 1) * leaderboard.limit + 1;
    const pageEnd = Math.min(
      leaderboard.page * leaderboard.limit,
      leaderboard.totalStudents,
    );

    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Рейтинг по XP</Text>
        <Text style={styles.sectionCaption}>
          Студенты отсортированы по общему опыту, заработанному за решенные задачи.
        </Text>

        <View style={styles.leaderboardHeaderRow}>
          <Text style={styles.leaderboardPageSummary}>
            {leaderboard.totalStudents > 0
              ? `Показано ${pageStart}-${pageEnd} из ${leaderboard.totalStudents}`
              : "Пока нет студентов в рейтинге"}
          </Text>
          <Text style={styles.leaderboardPageSummary}>
            По {LEADERBOARD_PAGE_SIZE} на страницу
          </Text>
        </View>

        {renderMyRankSection()}

        {leaderboard.leaders.length > 0 ? (
          <View style={styles.leaderboardList}>
            {leaderboard.leaders.map(renderLeaderboardRow)}
          </View>
        ) : (
          <View style={styles.noAchievementsContainer}>
            <Text style={styles.noAchievementsText}>
              Рейтинг пока пуст. Решите первую задачу, чтобы попасть в таблицу лидеров.
            </Text>
          </View>
        )}

        {leaderboard.totalPages > 1 ? (
          <View style={styles.leaderboardPagination}>
            <TouchableOpacity
              style={[
                styles.leaderboardPaginationButton,
                leaderboard.page === 1 && styles.leaderboardPaginationButtonDisabled,
              ]}
              disabled={leaderboard.page === 1}
              onPress={() => handlePageChange(leaderboard.page - 1)}
            >
              <Text
                style={[
                  styles.leaderboardPaginationButtonText,
                  leaderboard.page === 1 &&
                    styles.leaderboardPaginationButtonTextDisabled,
                ]}
              >
                Назад
              </Text>
            </TouchableOpacity>

            <Text style={styles.leaderboardPaginationText}>
              Страница {leaderboard.page} из {leaderboard.totalPages}
            </Text>

            <TouchableOpacity
              style={[
                styles.leaderboardPaginationButton,
                leaderboard.page === leaderboard.totalPages &&
                  styles.leaderboardPaginationButtonDisabled,
              ]}
              disabled={leaderboard.page === leaderboard.totalPages}
              onPress={() => handlePageChange(leaderboard.page + 1)}
            >
              <Text
                style={[
                  styles.leaderboardPaginationButtonText,
                  leaderboard.page === leaderboard.totalPages &&
                    styles.leaderboardPaginationButtonTextDisabled,
                ]}
              >
                Вперед
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  const renderAchievementCard = (item: Achievement) => (
    <View key={item.id} style={styles.achievementCard}>
      {item.image && item.image.startsWith("http") ? (
        <Image source={{ uri: item.image }} style={styles.achievementImage} />
      ) : (
        <View
          style={[
            styles.achievementImage,
            styles.achievementImageFallback,
            { backgroundColor: getTierColor(item.tier) },
          ]}
        >
          <Text style={styles.achievementFallbackIcon}>🏆</Text>
        </View>
      )}

      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDescription}>{item.description}</Text>
        <Text
          style={[styles.achievementTier, { color: getTierColor(item.tier) }]}
        >
          {getTierLabel(item.tier)}
        </Text>
        <Text style={styles.achievementDate}>
          Получено:{" "}
          {new Date(item.earnedAt).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
    </View>
  );

  const renderAchievementsSection = () => (
    <View style={styles.sectionBlock}>
      <Text style={styles.listSectionTitle}>Достижения</Text>

      {achievements.length > 0 ? (
        achievements.map(renderAchievementCard)
      ) : (
        <View style={styles.noAchievementsContainer}>
          <Text style={styles.noAchievementsIcon}>🏆</Text>
          <Text style={styles.noAchievementsText}>
            Пока нет достижений. Проходите уроки и решайте задачи, чтобы открыть первые награды.
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing && !leaderboard && achievements.length === 0) {
    return (
      <View style={styles.containerLight}>
        <Header title="Achievements" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.statusText}>Загрузка достижений и рейтинга...</Text>
        </View>
        <Footer activeTab={activeTab} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.containerLight}>
        <Header title="Achievements" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAchievements}>
            <Text style={styles.retryButtonText}>Попробовать снова</Text>
          </TouchableOpacity>
        </View>
        <Footer activeTab={activeTab} />
      </View>
    );
  }

  return (
    <View style={styles.containerLight}>
      <Header title="Achievements" />

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.achievementsContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {renderProgressSection()}
          {renderLeaderboardSection()}
          {renderAchievementsSection()}
        </ScrollView>
      </View>

      <Footer activeTab={activeTab} />
    </View>
  );
}
