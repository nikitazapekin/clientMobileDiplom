// screens/CoursesList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Course from '../Course';
import CourseService from '@/http/courses';
import type { CourseResponse, CourseStatus, CourseListResponse } from '@/http/types/course';
import { COLORS } from 'appStyles';

interface Filters {
  status?: CourseStatus;
  search?: string;
}

const CoursesList = () => {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({});
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>({});

  const loadCourses = useCallback(async (pageNum: number = 1, newFilters?: Filters) => {
    try {
      const currentFilters = newFilters !== undefined ? newFilters : filters;
      const response = await CourseService.getCourses({
        page: pageNum,
        limit: 10,
        ...currentFilters,
      });
      
      if (pageNum === 1) {
        setCourses(response.courses);
      } else {
        setCourses(prev => [...prev, ...response.courses]);
      }
      
      setTotalPages(response.pages);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCourses();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadCourses(1);
  }, [loadCourses]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadCourses(nextPage);
    }
  }, [page, totalPages, loading, loadCourses]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setPage(1);
    loadCourses(1, tempFilters);
    setIsFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    setTempFilters({});
    setFilters({});
    setPage(1);
    loadCourses(1, {});
    setIsFilterModalVisible(false);
  };

  const renderCourse = ({ item }: { item: CourseResponse }) => (
    <Course item={item} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TextInput
        style={styles.searchInput}
        placeholder="Поиск курсов..."
        value={tempFilters.search}
        onChangeText={(text) => setTempFilters(prev => ({ ...prev, search: text }))}
        onSubmitEditing={() => handleApplyFilters()}
      />
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setIsFilterModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>Фильтр</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing && courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={courses}
        renderItem={renderCourse}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator size="small" color="#0000ff" style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.centerContainer}>
              <Text>Курсы не найдены</Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Фильтры</Text>
            
            <Text style={styles.filterLabel}>Статус:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.status}
                onValueChange={(value) => 
                  setTempFilters(prev => ({ ...prev, status: value }))
                }
              >
                <Picker.Item label="Все" value={undefined} />
                <Picker.Item label="Черновик" value="draft" />
                <Picker.Item label="Опубликовано" value="published" />
                <Picker.Item label="В архиве" value="archived" />
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.clearButton]} 
                onPress={handleClearFilters}
              >
                <Text style={styles.clearButtonText}>Сбросить</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton]} 
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Применить</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: '#303027',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  footerLoader: {
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 8,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    color: '#222121',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor:  COLORS.ACCENT
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#d80909',
    fontSize: 16,
  },
});

export default CoursesList;