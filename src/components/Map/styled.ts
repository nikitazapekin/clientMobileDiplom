import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  studentContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },

  mapContainer: {
    position: 'relative',
  },

  infoPanel: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1000,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#9F0FA7',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },

  // Стили для элементов карты
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  lessonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonActive: {
    backgroundColor: '#9F0FA7',
  },
  lessonCircleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  starsArc: {
    flexDirection: 'row',
    marginTop: 4,
  },
  star: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 2,
  },
  starFilled: {
    backgroundColor: '#FFD700',
  },
  lessonTitle: {
    fontSize: 10,
    color: '#333',
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkpointElement: {
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkpointInner: {
    width: '60%',
    height: '60%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  checkpointTitle: {
    fontSize: 10,
    color: '#333',
    marginTop: 4,
    maxWidth: 80,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});