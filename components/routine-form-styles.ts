import { Platform, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

type ThemeKey = 'light' | 'dark';

export function getRoutineFormStyles(theme: ThemeKey = 'light') {
  const colors = Colors[theme];
  const TEXT_COLOR = colors.text;
  const INPUT_BG = colors.background;

  return StyleSheet.create({
    screen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
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
    sheet: {
      backgroundColor: colors.card,
      borderRadius: 36,
    },
    content: {
      paddingHorizontal: 22,
      paddingVertical: 20,
      paddingBottom: 40,
    },
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
      color: TEXT_COLOR,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: TEXT_COLOR,
      marginBottom: 8,
      marginTop: 20,
    },
    smallLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: TEXT_COLOR,
      marginBottom: 6,
      flex: 1,
      textAlign: 'left',
    },
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
    inputContainer: {
      flex: 1,
      backgroundColor: INPUT_BG,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
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
      borderColor: colors.border,
    },
    pickerContainer: {
      backgroundColor: INPUT_BG,
      borderRadius: 12,
      height: 50,
      overflow: 'hidden',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    picker: {
      width: '100%',
      backgroundColor: 'transparent',
      color: TEXT_COLOR,
      ...Platform.select({
        ios: { height: 50 },
        android: { height: 50 },
      }),
    },
    textInput: {
      fontSize: 15,
      color: TEXT_COLOR,
      padding: 0,
    },
    addIconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderWidth: 0,
    },
    timeBox: {
      flex: 1,
      backgroundColor: INPUT_BG,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
    },
    timeText: {
      color: TEXT_COLOR,
      fontSize: 15,
      fontWeight: '500',
      textAlign: 'center',
    },
    dateInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: INPUT_BG,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      height: 50,
      justifyContent: 'space-between',
    },
    dateText: {
      color: TEXT_COLOR,
      fontSize: 15,
      flex: 1,
      padding: 0,
    },
    createBtn: {
      marginTop: 35,
      marginBottom: 10,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    createBtnText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
    routineInputWrapper: {},
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    iosPickerContainer: {
      backgroundColor: colors.card,
      paddingBottom: 40,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    doneButton: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 17,
    },
  });
}

// Backward-compatible static export
export const routineFormStyles = getRoutineFormStyles('light');
