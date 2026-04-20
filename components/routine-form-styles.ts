import { Platform, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

type ThemeKey = 'light' | 'dark';

export function getRoutineFormStyles(theme: ThemeKey = 'light') {
  const colors = Colors[theme];
  const TEXT_COLOR = colors.text;
  const INPUT_BG = colors.card;

  return StyleSheet.create({
    screen: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    outerWrapper: {
      width: '90%',
      maxWidth: 400,
      shadowColor: colors.primary || '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 25,
      elevation: 10,
      borderRadius: 36,
    },
    sheet: {
      backgroundColor: colors.card,
      borderRadius: 36,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      letterSpacing: -0.5,
      fontWeight: '700',
      color: colors.primary,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#8B5CF6',
    },
    smallLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#8B5CF6',
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
      marginBottom: 1,
      marginTop: 25,
    },
    inputContainer: {
      flex: 1,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F5F3FF',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#EDE9FE',
      paddingHorizontal: 16,
      paddingVertical: 14,
      justifyContent: 'center',
      minHeight: 56,
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
    errorText: {
      marginTop: 6,
      marginLeft: 4,
      color: colors.error,
      fontSize: 12,
      fontWeight: '500',
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
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F5F3FF',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#EDE9FE',
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
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
      marginTop: 32,
      marginBottom: 8,
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 18,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 15,
      elevation: 8,
    },
    createBtnText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    detailLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
      marginTop: 24,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    routineInputWrapper: {},
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    iosPickerContainer: {
      backgroundColor: colors.card,
      paddingBottom: 40,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: theme === 'dark' ? colors.card : '#F8F9FA',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    doneButton: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 17,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    flexOneMarRight: {
      flex: 1,
      marginRight: 10,
    },
    categoryActionButtons: {
      flexDirection: 'row',
      gap: 10,
    },
    marginTopTen: {
      marginTop: 10,
    },
    paddingHorTwelve: {
      paddingHorizontal: 12,
    },
  });
}

// Backward-compatible static export
export const routineFormStyles = getRoutineFormStyles('light');
