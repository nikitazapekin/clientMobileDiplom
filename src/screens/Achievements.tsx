import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TabName } from "../components/Footer";
import Footer from "../components/Footer";
import Header from "../components/Header";

import { AchievementsService } from "../http/achievements";
import type { Achievement, AchievementProgress } from "../http/types/achievements";

import { styles } from "./styles";
import { COLORS, FONTS } from "appStyles";

export default function AchievementsScreen() {
  const route = useRoute();
  const activeTab: TabName = route.name === "Achievements" ? "achievements" : "achievements";

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const auditoryId = await AsyncStorage.getItem("userId");

      if (!auditoryId) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      console.log("Loading achievements for auditoryId:", auditoryId);

      // Сначала проверяем и начисляем достижения
      try {
        console.log("Checking and awarding achievements...");
        const awarded = await AchievementsService.checkAndAwardAchievements(auditoryId);
        console.log("Awarded achievements:", awarded);
      } catch (awardError: any) {
        console.error("Error awarding achievements:", awardError?.response?.data || awardError?.message);
        // Не прерываем загрузку, если ошибка при начислении
      }

      // Затем загружаем актуальные достижения и прогресс
      console.log("Fetching achievements and progress...");
      const [achievementsData, progressData] = await Promise.all([
        AchievementsService.getAchievementsByAuditoryId(auditoryId),
        AchievementsService.getAchievementProgress(auditoryId),
      ]);

      console.log("Achievements loaded:", achievementsData);
      console.log("Progress loaded:", progressData);

      setAchievements(achievementsData);
      setProgress(progressData);
    } catch (err: any) {
      console.error("Error loading achievements:", err?.response?.data || err?.message);
      setError(err.message || "Failed to load achievements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Пересчитываем достижения при каждом фокусе экрана
  useFocusEffect(
    React.useCallback(() => {
      loadAchievements();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadAchievements();
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
      novice: "Novice",
      advanced: "Advanced",
      expert: "Expert",
      master: "Master",
      beginner: "Beginner",
      intermediate: "Intermediate",
      professional: "Professional",
      legendary: "Legendary",
    };

    return tierLabels[tier] || tier;
  };

  const renderProgressItem = (label: string, current: number, thresholds: { tier: string; required: number }[]) => {
    const nextThreshold = thresholds.find(t => t.required > current);
    const progress = nextThreshold ? (current / nextThreshold.required) * 100 : 100;

    return (
      <View style={styles.progressItem}>
        <Text style={styles.progressLabel}>{label}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progress, 100)}%` },
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
    if (!progress) return null;

    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Progress Towards Achievements</Text>

        {renderProgressItem(
          "Student Results (lessons with 2+ stars)",
          progress.studentResults.current,
          progress.studentResults.thresholds
        )}

        {renderProgressItem(
          "Solved Tasks",
          progress.solvedTasks.current,
          progress.solvedTasks.thresholds
        )}
      </View>
    );
  };

  const renderAchievementCard = ({ item }: { item: Achievement }) => (
    <View style={styles.achievementCard}>
      {item.image && item.image.startsWith("http") ? (
        <Image
          source={{ uri: item.image }}
          style={styles.achievementImage}
        />
      ) : (
        <View style={[styles.achievementImage, { backgroundColor: getTierColor(item.tier), justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ fontSize: 32 }}>🏆</Text>
        </View>
      )}

      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDescription}>{item.description}</Text>
        <Text style={[styles.achievementTier, { color: getTierColor(item.tier) }]}>
          {getTierLabel(item.tier)}
        </Text>
        <Text style={styles.achievementDate}>
          Earned: {new Date(item.earnedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.noAchievementsContainer}>
      <Text style={{ fontSize: 64 }}>🏆</Text>
      <Text style={styles.noAchievementsText}>
        No achievements yet.{"\n"}Complete lessons and solve tasks to earn achievements!
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <>
        <View style={styles.containerLight}>
          <Header title="Achievements" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={{ marginTop: 16, color: COLORS.GRAY_600 }}>Loading achievements...</Text>
          </View>
          <Footer activeTab={activeTab} />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <View style={styles.containerLight}>
          <Header title="Achievements" />
          <View style={styles.errorContainer}>
            <Text style={{ fontSize: 64 }}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAchievements}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
          <Footer activeTab={activeTab} />
        </View>
      </>
    );
  }

  return (
    <>
      <View style={styles.containerLight}>
        <Header title="Achievements" />

        <View style={styles.content}>
          <FlatList
            data={achievements}
            renderItem={renderAchievementCard}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderProgressSection()}
            ListEmptyComponent={renderEmptyList}
            contentContainerStyle={styles.achievementsContainer}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </View>

        <Footer activeTab={activeTab} />
      </View>
    </>
  );
}
