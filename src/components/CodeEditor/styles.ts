 
import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";


const COLORS = {
  background: '#0D1117',
  surface: '#161B22',
  text: '#E6EDF3',
  keyword: '#FF79C6',
  string: '#A6E22E',
  number: '#E6DB74',
  comment: '#7E8C9A',
  function: '#66D9EF',
  type: '#A6E22E',
  operator: '#66D9EF',
  punctuation: '#E6EDF3',
  accent: '#FF79C6',
  selection: '#264F78',
  lineNumber: '#6E7681',
  autocompleteBg: '#1F2937',
  autocompleteBorder: '#374151',
  autocompleteSelected: '#2D3748',
};

const FONT_SIZE = 14;
const LINE_HEIGHT = 20;
const CURSOR_HEIGHT = 18;
const PADDING_VERTICAL = 8;
const PADDING_HORIZONTAL = 8;
const LINE_NUMBER_WIDTH = 40;
const CURSOR_SAMPLE = 'MMMMMMMMMM';

const LETTER_SPACING = Platform.select({
  ios: -0.3,
  android: -0.2,
  default: -0.2,
});
const FONT_FAMILY = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

export const  styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.autocompleteBorder,
  },
  languageText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsText: {
    color: COLORS.comment,
    fontSize: 12,
    fontFamily: FONT_FAMILY,
  },
  runButton: {
    backgroundColor: COLORS.string,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  runButtonDisabled: {
    opacity: 0.5,
  },
  runButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '600',
  },
  editorTouchable: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    position: 'relative',
  },
  horizontalScroll: {
    flex: 1,
  },
  horizontalContent: {
    minWidth: '100%',
  },
  editorCanvas: {
    flex: 1,
    position: 'relative',
  },
  highlightScroll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  highlightContent: {
    flexGrow: 1,
  },
  editor: {
    paddingVertical: PADDING_VERTICAL,
    position: 'relative',
  },
  lineContainer: {
    flexDirection: 'row',
    paddingHorizontal: PADDING_HORIZONTAL,
    minHeight: LINE_HEIGHT,
    alignItems: 'flex-start',
  },
  lineNumber: {
    width: LINE_NUMBER_WIDTH,
    color: COLORS.lineNumber,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    textAlign: 'right',
    paddingRight: 8,
  },
  lineContent: {
    flex: 1,
    minHeight: LINE_HEIGHT,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    alignItems: 'flex-start',
  },

  codeText: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    letterSpacing: LETTER_SPACING,
    fontWeight: '400',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: CURSOR_HEIGHT,
    backgroundColor: COLORS.text,
    zIndex: 3,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,

    padding: 0,
    margin: 0,
    borderWidth: 0,

    ...Platform.select({
      ios: {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        letterSpacing: LETTER_SPACING,
        fontWeight: '400',
        includeFontPadding: false,
        textAlignVertical: 'top',
      },
      android: {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        letterSpacing: LETTER_SPACING,
        fontWeight: '400',
        includeFontPadding: false,
        textAlignVertical: 'top',
      },
    }),

    paddingLeft: LINE_NUMBER_WIDTH + PADDING_HORIZONTAL,
    paddingTop: PADDING_VERTICAL,
    paddingBottom: PADDING_VERTICAL,
    paddingRight: PADDING_HORIZONTAL,

    color: 'transparent',

    backgroundColor: 'transparent',

    zIndex: 2,
    opacity: 0,

    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: 'transparent',
    elevation: 0,
  },
  measureText: {
    position: 'absolute',
    opacity: 0,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    letterSpacing: LETTER_SPACING,
    fontWeight: '400',
    includeFontPadding: false,
  },
  autocompleteContainer: {
    position: 'absolute',
    bottom: 8,
    left: LINE_NUMBER_WIDTH + PADDING_HORIZONTAL,
    right: 8,
    maxHeight: 200,
    backgroundColor: COLORS.autocompleteBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.autocompleteBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.autocompleteBorder,
  },
  suggestionItemSelected: {
    backgroundColor: COLORS.autocompleteSelected,
  },
  suggestionText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  suggestionTextSelected: {
    color: COLORS.accent,
  },
});
