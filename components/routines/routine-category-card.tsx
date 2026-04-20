import { RoutineRow, RoutineRowProps } from '@/components/routines/routine-row';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type Props = {
  title: string;
  subtitle?: string;
  categoryName?: string;
  showWeekDays?: boolean;
  routines: RoutineRowProps[];
  onPressAddRoutine?: () => void;
  onRoutineToggle?: (index: number, value: boolean) => void;
  onItemPress?: (id: string) => void;
  onDeleteList?: () => void;
  onEditList?: () => void;
  accentColor?: string;
  variant?: 'light' | 'glass';
};
export function RoutineCategoryCard({
  title,
  categoryName,
  routines,
  onPressAddRoutine,
  onRoutineToggle,
  onItemPress,
  onDeleteList,
  onEditList,
  accentColor,
  variant,
}: Props): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const effectiveAccentColor = accentColor || colors.primary;
  const isGlass = variant === 'glass' || theme === 'dark';
  const [menuVisible, setMenuVisible] = useState(false);
  const optionsAvailable = !!onEditList || !!onDeleteList;


  return (
    <ThemedView 
      variant="card" 
      style={[
        styles.card, 
        { backgroundColor: colors.card, borderColor: colors.border },
        isGlass && styles.cardGlass,
        { zIndex: menuVisible ? 999 : 1, elevation: menuVisible ? 10 : 4 }
      ]}
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.textWrap}>
          <ThemedText type="default" style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {title}
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          {!!categoryName && (
            <View style={[styles.categoryBadge, { backgroundColor: `${effectiveAccentColor}15` }]}>
              <ThemedText style={[styles.categoryText, { color: effectiveAccentColor }]} numberOfLines={1}>
                {categoryName}
              </ThemedText>
            </View>
          )}
          {!!onPressAddRoutine && (
            <TouchableOpacity
              onPress={onPressAddRoutine}
              style={[styles.plusBtn, { backgroundColor: effectiveAccentColor }]}
              hitSlop={10}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color="#ffffff" />
            </TouchableOpacity>
          )}

          {optionsAvailable && (
            <View style={{ position: 'relative', zIndex: 100 }}>
              <TouchableOpacity
                onPress={() => setMenuVisible(!menuVisible)}
                style={styles.iconButton}
                hitSlop={10}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.icon} />
              </TouchableOpacity>

              {menuVisible && (
                <View style={[styles.menuContainer, { backgroundColor: colors.card, borderColor: colors.border, zIndex: 101 }]}>
                  {!!onEditList && (
                    <TouchableOpacity 
                      style={styles.menuItem} 
                      onPress={() => { setMenuVisible(false); onEditList(); }}
                    >
                      <Ionicons name="pencil-outline" size={16} color={colors.text} />
                      <ThemedText style={[styles.menuText, { color: colors.text }]}>Edit</ThemedText>
                    </TouchableOpacity>
                  )}
                  {!!onEditList && !!onDeleteList && <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />}
                  {!!onDeleteList && (
                    <TouchableOpacity 
                      style={styles.menuItem} 
                      onPress={() => { setMenuVisible(false); onDeleteList(); }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                      <ThemedText style={[styles.menuText, { color: colors.error }]}>Delete</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* RUTINLER */}
      {routines.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <ThemedText type="default" style={[styles.emptyListText, { color: colors.icon }]}>
            No routines in this list.
          </ThemedText>
        </View>
      ) : (
        routines.map((routine: RoutineRowProps, idx) => (
          <View key={`routine-${routine.id || 'new'}-${idx}`}>
            <RoutineRow
              {...routine}
              isDark={theme === 'dark'}
              onToggle={(val: boolean) => onRoutineToggle?.(idx, val)}
              onPress={() => onItemPress?.(routine.id)}
            />
            {idx !== routines.length - 1 && <View style={[styles.lightDivider, { backgroundColor: colors.border }]} />}
          </View>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    borderRadius: 24,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
  },
  cardGlass: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    marginBottom: 10,
    zIndex: 10,
  },
  
  textWrap: {
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    zIndex: 10,
    flexShrink: 0,
  },

  title: {
    fontSize: 18, 
    fontWeight: '400', 
    letterSpacing: 0.1, 
    lineHeight: 23,
  },

  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    maxWidth: 130,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  divider: { height: 4 },
  lightDivider: {
    height: 1,
    marginLeft: 66, 
    marginRight: 20,
  },
  emptyListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  iconButton: {
    padding: 4,
  },
  menuContainer: {
    position: 'absolute',
    top: 30,
    right: 0,
    borderRadius: 12,
    paddingVertical: 4,
    width: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 8,
  },
});
