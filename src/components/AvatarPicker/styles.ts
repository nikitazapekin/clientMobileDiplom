
import { COLORS, FONTS } from "appStyles";
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";



export const styles = StyleSheet.create({
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
