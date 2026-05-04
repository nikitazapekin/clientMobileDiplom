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
import { styles } from './styles';
import { ProfileService } from '../../http/profile';

interface AvatarPickerProps {
  visible: boolean;
  onClose: () => void;
  auditoryId: string;
  hasAvatar: boolean;
  onAvatarUploaded: (avatarUrl: string) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  visible,
  onClose,
  auditoryId,
  hasAvatar,
  onAvatarUploaded,
}) => {
  const [loading, setLoading] = useState(false);

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
                void Linking.openURL('app-settings:');
              } else {
                void Linking.openSettings();
              }
            },
          },
        ]
      );

      return false;
    }

    return true;
  };
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
                void Linking.openURL('app-settings:');
              } else {
                void Linking.openSettings();
              }
            },
          },
        ]
      );

      return false;
    }

    return true;
  };

  const handleSelectFromGallery = async () => {
    try {
      const hasPermission = await requestGalleryPermission();

      if (!hasPermission) return;

      console.log('Opening gallery...');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
        allowsMultipleSelection: false,
      });

      console.log('Gallery result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        setLoading(true);

        if (!asset.base64) {
          throw new Error('Не удалось получить изображение');
        }

        const mimeType = asset.mimeType || asset.type || 'image/jpeg';

        console.log('Uploading avatar as base64:', {
          mimeType,
          base64Length: asset.base64.length,
        });

        const uploadResponse = await ProfileService.uploadAvatarBase64(
          auditoryId,
          asset.base64,
          mimeType
        );

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
      const hasPermission = await requestCameraPermission();

      if (!hasPermission) return;

      console.log('Opening camera...');

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
        cameraType: ImagePicker.CameraType.front,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        setLoading(true);

        if (!asset.base64) {
          throw new Error('Не удалось получить изображение');
        }

        const mimeType = asset.mimeType || asset.type || 'image/jpeg';

        console.log('Uploading photo as base64:', {
          mimeType,
          base64Length: asset.base64.length,
        });

        const uploadResponse = await ProfileService.uploadAvatarBase64(
          auditoryId,
          asset.base64,
          mimeType
        );

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
                <Text style={styles.optionText}>Выбрать из галереи</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleTakePhoto}
              >
                <Text style={styles.optionText}>Сделать фото</Text>
              </TouchableOpacity>

              {hasAvatar && (
                <TouchableOpacity
                  style={[styles.optionButton, styles.removeButton]}
                  onPress={handleRemoveAvatar}
                >
                  <Text style={[styles.optionText, styles.removeText]}>
                    Удалить аватар
                  </Text>
                </TouchableOpacity>
              )}

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
 
export default AvatarPicker;
