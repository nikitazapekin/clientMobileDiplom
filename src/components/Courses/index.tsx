// screens/CoursesList.tsx
import React, { useCallback, useEffect, useRef,useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from 'appStyles';

import Course from '../Course';

import CourseService from '@/http/courses';
import type { CourseListResponse,CourseResponse, CourseStatus } from '@/http/types/course';

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
  const [searchText, setSearchText] = useState('');

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

  const handleSearch = useCallback(() => {
    setTempFilters(prev => ({ ...prev, search: searchText }));
    setFilters(prev => ({ ...prev, search: searchText }));
    setPage(1);
    loadCourses(1, { ...filters, search: searchText });
  }, [searchText, filters, loadCourses]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setPage(1);
    loadCourses(1, tempFilters);
    setIsFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    setTempFilters({});
    setFilters({});
    setSearchText('');
    setPage(1);
    loadCourses(1, {});
    setIsFilterModalVisible(false);
  };

  const renderCourse = ({ item }: { item: CourseResponse }) => (
    <Course item={item} />
  );

  // Фиксированная панель поиска и фильтров
  const renderFixedHeader = () => (
    <View style={styles.fixedHeader}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск курсов..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchText('');
                setFilters(prev => {
                  const newFilters = { ...prev };

                  delete newFilters.search;

                  return newFilters;
                });
                setPage(1);
                loadCourses(1, { ...filters, search: undefined });
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, filters.status && styles.filterButtonActive]}
          onPress={() => {
            setTempFilters(filters);
            setIsFilterModalVisible(true);
          }}
        >
          <Text style={styles.filterButtonText}>
            Фильтр {filters.status ? '✓' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Отображение активных фильтров */}
      {filters.status && (
        <View style={styles.activeFilters}>
          <View style={styles.activeFilterTag}>
            <Text style={styles.activeFilterText}>
              Статус: {filters.status === 'draft' ? 'Черновик' :
                filters.status === 'published' ? 'Опубликовано' : 'В архиве'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setFilters(prev => {
                  const newFilters = { ...prev };

                  delete newFilters.status;

                  return newFilters;
                });
                setPage(1);
                loadCourses(1, { ...filters, status: undefined });
              }}
            >
              <Text style={styles.removeFilterText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing && courses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Фиксированная панель поиска */}
        {renderFixedHeader()}

        {/* Список курсов */}
        <FlatList
          data={courses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.ACCENT}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator size="small" color={COLORS.ACCENT} style={styles.footerLoader} />
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Курсы не найдены</Text>
                {(filters.status || filters.search) && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleClearFilters}
                  >
                    <Text style={styles.resetButtonText}>Сбросить фильтры</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterModalVisible(false)}
        >
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
                <Text style={styles.clearButtonText}>Сбросить все</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Применить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flexContainer: {
    flex: 1,
  },
  fixedHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 1000,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resetButtonText: {
    color: COLORS.ACCENT,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#d8d8d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: '#303027',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.ACCENT,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  activeFilters: {
    flexDirection: 'row',
    marginTop: 8,
    paddingBottom: 4,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  activeFilterText: {
    fontSize: 13,
    color: '#555',
  },
  removeFilterText: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
    marginLeft: 4,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
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
    backgroundColor: '#f8f8f8',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  applyButton: {
    backgroundColor: COLORS.ACCENT,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CoursesList;
