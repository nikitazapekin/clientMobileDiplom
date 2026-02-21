// components/Course.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CourseResponse } from '@/http/types/course';
import { ROUTES } from '@/navigation/routes';
import type { RootStackNavigationProp } from '@/navigation/types';

const { width } = Dimensions.get('window');

interface CourseProps {
  item: CourseResponse;
  onPress?: () => void;
}

const getValidImageSrc = (logo: string): string | null => {
  if (!logo || typeof logo !== 'string' || !logo.trim()) return null;

  const trimmed = logo.trim();

  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  
  if (trimmed.startsWith('/')) {
    const baseUrl = 'https://your-api-domain.com'; 
    return `${baseUrl}${trimmed}`;
  }

  return null;
};

const Course: React.FC<CourseProps> = ({ item, onPress }) => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const imageSrc = getValidImageSrc(item.logo);

   const handlePress = () => {
    if (onPress) {
     
      onPress();
    } else {
      
      navigation.navigate(ROUTES.STACK.COURSE, { id: item.id });
    }
  };

  return (
    <TouchableOpacity style={styles.course} onPress={handlePress} activeOpacity={0.7}>
      
      <View style={styles.imageContainer}>
        {imageSrc ? (
          <Image
            source={{ uri: imageSrc }}
            style={styles.course__image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.course__image, styles.course__imagePlaceholder]} />
        )}
      </View>
      
      
      <View style={styles.course__preview}>
        <Text style={styles.course__title} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={styles.course__description} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.course__lesson}>
            <Text style={styles.course__count}>
              <Text style={styles.course__countBold}>Уроков:</Text> 0
            </Text>
          </View>

          <View style={styles.course__lesson}>
            <Text style={styles.course__count}>
              <Text style={styles.course__countBold}>Студентов:</Text> 12123
            </Text>
          </View>
        </View>

        <View style={styles.course__tags}>
          {item.tags?.map((tag, index) => (
            <View key={index} style={styles.course__tag}>
              <Text style={styles.course__tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  course: {
    width: '100%',
    backgroundColor: '#ffffff',
    marginBottom: 24,
    flexDirection: 'column',
    alignItems: 'center', 
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 9,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  course__image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  course__imagePlaceholder: {
    backgroundColor: '#f0f0f0',
  },
  course__preview: {
    width: '100%',
    alignItems: 'center', 
    paddingHorizontal: 8,
  },
  course__title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center', 
  },
  course__description: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 12,
    textAlign: 'center', 
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    gap: 24,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  course__lesson: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  course__count: {
    fontSize: 18,
    textAlign: 'center',
  },
  course__countBold: {
    fontWeight: 'bold',
  },
  course__tags: {
    flexDirection: 'row',
    justifyContent: 'center', 
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  course__tag: {
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  course__tagText: {
    fontSize: 14,
  },
});

export default Course;