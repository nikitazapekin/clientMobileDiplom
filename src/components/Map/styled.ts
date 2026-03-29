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

 
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#9F0FA7',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    marginBottom: 20,
    maxHeight: 200,
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  navigateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#9F0FA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },


  lessonDisabled: {
  opacity: 0.5,
  backgroundColor: '#cccccc',
}, 


starsContainer: {
  flexDirection: 'row',
  marginTop: 4,
  justifyContent: 'center',
},


 
starText: {
  fontSize: 16,
  marginHorizontal: 2,
},
starFilledText: {
  color: '#FFD700',  
},
starEmptyText: {
  color: '#D3D3D3', 
},
 
 

certificateModalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  justifyContent: 'center',
  alignItems: 'center',
},

certificateModalContent: {
  width: '90%',
  maxWidth: 400,
  backgroundColor: '#fff',
  borderRadius: 20,
  padding: 24,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 8,
},

certificateTitle: {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#9F0FA7',
  textAlign: 'center',
  marginBottom: 8,
},

certificateSubtitle: {
  fontSize: 18,
  color: '#333',
  textAlign: 'center',
  marginBottom: 20,
},

certificateImage: {
  width: '100%',
  height: 200,
  marginBottom: 20,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: '#9F0FA7',
},

certificateActions: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  width: '100%',
  marginBottom: 16,
  gap: 8,
},

certificateButton: {
  flex: 1,
  paddingVertical: 10,
  paddingHorizontal: 8,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},

shareButton: {
  backgroundColor: '#4CAF50',
},

downloadButton: {
  backgroundColor: '#2196F3',
},

openButton: {
  backgroundColor: '#FF9800',
},

certificateButtonText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '600',
},

certificateCloseButton: {
  paddingVertical: 12,
  paddingHorizontal: 24,
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
  width: '100%',
  alignItems: 'center',
},

certificateCloseButtonText: {
  color: '#666',
  fontSize: 16,
  fontWeight: '600',
}
});
