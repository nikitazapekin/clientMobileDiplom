// components/CodeEditor/styles.ts
import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
  },
  webView: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
  },
  // Стили для простого редактора (запасной вариант)
  simpleContainer: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333",
    position: "relative",
  },
  simpleInput: {
    flex: 1,
    color: "#d4d4d4",
    fontSize: 13,
    lineHeight: 18,
    padding: 8,
    paddingTop: 8,
    textAlignVertical: "top",
    ...Platform.select({
      ios: {
        fontFamily: "Menlo",
      },
      android: {
        fontFamily: "monospace",
      },
    }),
  },
  simpleInputReadOnly: {
    opacity: 0.8,
    backgroundColor: "#2d2d2d",
  },
  simpleRunButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#2ea043",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  simpleRunButtonDisabled: {
    opacity: 0.7,
    backgroundColor: "#238636",
  },
  simpleRunIcon: {
    width: 0,
    height: 0,
    marginLeft: 2,
    borderStyle: "solid",
    borderWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#fff",
    borderRightColor: "transparent",
  },
  // Стили для модального редактора на весь экран
  modalContainer: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#2d2d2d",
    borderBottomWidth: 1,
    borderBottomColor: "#404040",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 18,
  },
  modalEditor: {
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#2d2d2d",
    borderTopWidth: 1,
    borderTopColor: "#404040",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: "#2ea043",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  modalButtonCancel: {
    backgroundColor: "#404040",
  },




   suggestionsContainer: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: '#252526',
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#3e3e42',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3e3e42',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionItemSelected: {
    backgroundColor: '#094771',
  },
  suggestionLabel: {
    color: '#d4d4d4',
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionDescription: {
    color: '#858585',
    fontSize: 12,
    marginLeft: 8,
  },
  suggestionCategoryText: {
    color: '#858585',
    fontSize: 11,
    fontStyle: 'italic',
  },

    languageBadge: {
    position: 'absolute',
    top: 8,
    left: 12,
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 5,
    borderWidth: 1,
    borderColor: '#404040',
  },
  languageBadgeText: {
    color: '#9cdcfe',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },




    topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  topBarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },



   highlightButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  highlightButtonActive: {
    backgroundColor: '#094771',
    borderColor: '#1e7ab9',
  },
  highlightButtonText: {
    color: '#d4d4d4',
    fontSize: 16,
  },

  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
 highlightContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    paddingTop: 44, // Увеличено для topBar
  },
});