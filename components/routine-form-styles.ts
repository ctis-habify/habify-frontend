import { Platform, StyleSheet } from 'react-native';
import { COLORS } from '../app/theme';

const INPUT_BLUE = COLORS.inputBlue;
const TEXT_DARK = COLORS.textDark;

export const routineFormStyles = StyleSheet.create({
  // Screen wrapper
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Outer wrapper for the form card
  outerWrapper: {
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    borderRadius: 36,
    overflow: 'hidden',
  },
  // Form card (white background)
  sheet: {
    backgroundColor: COLORS.formBackground,
    borderRadius: 36,
  },
  content: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  // Header row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  // Labels
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
    marginTop: 20,
  },
  smallLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 6,
    flex: 1,
    textAlign: 'left',
  },
  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  // Input styles
  inputContainer: {
    flex: 1,
    backgroundColor: INPUT_BLUE,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    height: 50,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: INPUT_BLUE,
    borderRadius: 8,
    height: 50,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  pickerContainer: {
    backgroundColor: INPUT_BLUE,
    borderRadius: 8,
    height: 50,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    backgroundColor: 'transparent',
    color: '#ffffff',
    ...Platform.select({
      ios: { height: 50 },
      android: { height: 50 },
    }),
  },
  textInput: {
    fontSize: 15,
    color: '#ffffff',
    padding: 0,
  },
  // Buttons
  addIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INPUT_BLUE,
    borderWidth: 0,
  },
  // Time inputs
  timeBox: {
    flex: 1,
    backgroundColor: INPUT_BLUE,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Date input
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BLUE,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'space-between',
  },
  dateText: {
    color: '#ffffff',
    fontSize: 15,
    flex: 1,
    padding: 0,
  },
  // Create button
  createBtn: {
    marginTop: 35,
    marginBottom: 10,
    backgroundColor: '#00163a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  routineInputWrapper: {
    // Additional wrapper for routine input if needed
  },
});

