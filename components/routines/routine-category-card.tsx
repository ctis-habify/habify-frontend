import { RoutineRow, RoutineRowProps } from '@/components/routines/routine-row';
import { Colors } from '@/constants/theme';
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
  accentColor = Colors.light.primary,
  variant = 'light',
}: Props): React.ReactElement {

  const isGlass = variant === 'glass';
  const [menuVisible, setMenuVisible] = useState(false);
  const optionsAvailable = !!onEditList || !!onDeleteList;


  return (
    <ThemedView 
      variant="card" 
      style={[
        styles.card, 
        isGlass && styles.cardGlass,
        { zIndex: menuVisible ? 999 : 1, elevation: menuVisible ? 10 : 4 }
      ]}
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.textWrap}>
          <ThemedText type="default" style={[styles.title, isGlass && { color: '#fff' }]} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          {!!categoryName && (
            <View style={[styles.categoryBadge, isGlass ? { backgroundColor: 'rgba(255,255,255,0.15)' } : { backgroundColor: `${accentColor}15` }]}>
              <ThemedText style={[styles.categoryText, isGlass ? { color: '#ffffff' } : { color: accentColor }]}>
                {categoryName}
              </ThemedText>
            </View>
          )}
          {!!onPressAddRoutine && (
            <TouchableOpacity
              onPress={onPressAddRoutine}
              style={[styles.plusBtn, { backgroundColor: accentColor }]}
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
                <Ionicons name="ellipsis-vertical" size={20} color={Colors.light.icon} />
              </TouchableOpacity>

              {menuVisible && (
                <View style={[styles.menuContainer, { zIndex: 101 }]}>
                  {!!onEditList && (
                    <TouchableOpacity 
                      style={styles.menuItem} 
                      onPress={() => { setMenuVisible(false); onEditList(); }}
                    >
                      <Ionicons name="pencil-outline" size={16} color={isGlass ? '#fff' : Colors.light.text} />
                      <ThemedText style={[styles.menuText, isGlass && { color: '#fff' }]}>Edit</ThemedText>
                    </TouchableOpacity>
                  )}
                  {!!onEditList && !!onDeleteList && <View style={[styles.menuDivider, isGlass && { backgroundColor: 'rgba(255,255,255,0.1)' }]} />}
                  {!!onDeleteList && (
                    <TouchableOpacity 
                      style={styles.menuItem} 
                      onPress={() => { setMenuVisible(false); onDeleteList(); }}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.light.error} />
                      <ThemedText style={[styles.menuText, { color: Colors.light.error }]}>Delete</ThemedText>
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
          <ThemedText type="default" style={styles.emptyListText}>
            No routines in this list.
          </ThemedText>
        </View>
      ) : (
        routines.map((routine: RoutineRowProps, idx) => (
          <View key={`routine-${routine.id || 'new'}-${idx}`}>
            <RoutineRow
              {...routine}
              isDark={isGlass}
              onToggle={(val: boolean) => onRoutineToggle?.(idx, val)}
              onPress={() => onItemPress?.(routine.id)}
            />
            {idx !== routines.length - 1 && <View style={[styles.lightDivider, isGlass && { backgroundColor: 'rgba(255,255,255,0.05)' }]} />}
          </View>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 18,
    // Stronger Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardGlass: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0, // Glow handles it if needed
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 14,
    zIndex: 10,
  },
  
  textWrap: {
    flex: 1,
    paddingRight: 16,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
    zIndex: 10,
  },



  title: {
    color: '#111827', 
    fontSize: 22, 
    fontWeight: '400', 
    letterSpacing: 0.1, 
  },

  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  divider: { height: 4 },
  lightDivider: {
    height: 1,
    backgroundColor: '#f3f4f6', // Ultra light
    marginLeft: 66, 
    marginRight: 20,
  },
  emptyListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    color: '#9ca3af',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    width: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    backgroundColor: '#f3f4f6',
    marginHorizontal: 8,
  },
});
