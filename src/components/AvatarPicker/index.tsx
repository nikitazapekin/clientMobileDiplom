// components/AvatarPicker.tsx

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { ProfileService } from '../../http/profile';

interface AvatarPickerProps {
  visible: boolean;
  onClose: () => void;
  auditoryId: string;
  onAvatarUploaded: (avatarUrl: string) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  visible,
  onClose,
  auditoryId,
  onAvatarUploaded,
}) => {
  const [loading, setLoading] = useState(false);

  // Запрос разрешений для галереи
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Нужно разрешение',
        'Разрешите доступ к галерее в настройках',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Настройки',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );

      return false;
    }

    return true;
  };

  // Запрос разрешений для камеры
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Нужно разрешение',
        'Разрешите доступ к камере в настройках',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Настройки',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );

      return false;
    }

    return true;
  };

  const handleSelectFromGallery = async () => {
    try {
      // Проверяем разрешения
      const hasPermission = await requestGalleryPermission();

      if (!hasPermission) return;

      console.log('Opening gallery...');

      // Открываем галерею
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
        allowsMultipleSelection: false,
      });

      console.log('Gallery result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        setLoading(true);

        // Создаем файл для загрузки
        const file = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `avatar_${Date.now()}.jpg`,
        };

        console.log('Uploading file:', file);

        // Загружаем на сервер
        const uploadResponse = await ProfileService.uploadAvatar(auditoryId, file);

        if (uploadResponse && uploadResponse.imageUrl) {
          onAvatarUploaded(uploadResponse.imageUrl);
          Alert.alert('Успех', 'Аватар успешно загружен!');
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Gallery error:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось выбрать изображение');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Проверяем разрешения
      const hasPermission = await requestCameraPermission();

      if (!hasPermission) return;

      console.log('Opening camera...');

      // Открываем камеру
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
        cameraType: ImagePicker.CameraType.front,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        setLoading(true);

        // Создаем файл для загрузки
        const file = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
        };

        console.log('Uploading file:', file);

        // Загружаем на сервер
        const uploadResponse = await ProfileService.uploadAvatar(auditoryId, file);

        if (uploadResponse && uploadResponse.imageUrl) {
          onAvatarUploaded(uploadResponse.imageUrl);
          Alert.alert('Успех', 'Фото успешно загружено!');
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось сделать фото');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      'Удалить аватар',
      'Вы уверены, что хотите удалить аватар?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ProfileService.deleteAvatarByAuditoryId(auditoryId);
              onAvatarUploaded('');
              Alert.alert('Успех', 'Аватар успешно удален!');
              onClose();
            } catch (error: any) {
              console.error('Remove error:', error);
              Alert.alert('Ошибка', error.message || 'Не удалось удалить аватар');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Аватар профиля</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Загрузка...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleSelectFromGallery}
              >
                <Text style={styles.optionIcon}>🖼️</Text>
                <Text style={styles.optionText}>Выбрать из галереи</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleTakePhoto}
              >
                <Text style={styles.optionIcon}>📷</Text>
                <Text style={styles.optionText}>Сделать фото</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, styles.removeButton]}
                onPress={handleRemoveAvatar}
              >
                <Text style={styles.optionIcon}>🗑️</Text>
                <Text style={[styles.optionText, styles.removeText]}>
                  Удалить аватар
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#ffebee',
  },
  removeText: {
    color: '#f44336',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#999',
  },
});

export default AvatarPicker;
