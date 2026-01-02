import { Platform, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

const TEXT_DARK = Colors.light.text;
const INPUT_BG = Colors.light.background; 

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
    backgroundColor: Colors.light.card,
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
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    height: 50,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    height: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pickerContainer: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    height: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  picker: {
    width: '100%',
    backgroundColor: 'transparent',
    color: TEXT_DARK,
    ...Platform.select({
      ios: { height: 50 },
      android: { height: 50 },
    }),
  },
  textInput: {
    fontSize: 15,
    color: TEXT_DARK,
    padding: 0,
  },
  // Buttons
  addIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderWidth: 0,
  },
  // Time inputs
  timeBox: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  timeText: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Date input
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'space-between',
  },
  dateText: {
    color: TEXT_DARK,
    fontSize: 15,
    flex: 1,
    padding: 0,
  },
  // Create button
  createBtn: {
    marginTop: 35,
    marginBottom: 10,
    backgroundColor: Colors.light.primary,
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
  // iOS Picker Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPickerContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 40, // Safe area padding
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  doneButton: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 17,
  },
});

