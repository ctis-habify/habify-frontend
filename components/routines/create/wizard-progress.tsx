import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

interface Props {
  currentStep: number;
  steps: string[];
}

export function WizardProgress({ currentStep, steps }: Props) {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];

  return (
    <View style={styles.progressContainer}>
      {/* Track - Contains Background and Fill */}
      <View style={[styles.progressTrackBackground, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <Animated.View style={[
          styles.progressTrackFill, 
          { 
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
            backgroundColor: colors.collaborativePrimary
          }
        ]} />
      </View>

      {/* Nodes */}
      <View style={styles.nodesContainer}>
        {steps.map((label, i) => {
          const isActive = currentStep === i;
          const isCompleted = currentStep > i;
          
          return (
            <View key={i} style={styles.nodeWrapper}>
              <View style={[
                styles.progressNode,
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                },
                (isActive || isCompleted) && [
                  styles.progressNodeActiveGlass, 
                  { 
                    backgroundColor: colors.collaborativePrimary, 
                    borderColor: colors.collaborativePrimary,
                    shadowColor: colors.collaborativePrimary
                  }
                ]
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color={isDark ? "#000" : "#fff"} />
                ) : (
                  <Text style={[
                    styles.stepNum, 
                    { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' },
                    (isActive || isCompleted) && [styles.stepNumActive, { color: isDark ? '#000' : '#fff' }]
                  ]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' },
                isActive && [styles.stepLabelActive, { color: colors.text }],
                isCompleted && [styles.stepLabelCompleted, { color: colors.collaborativePrimary }]
              ]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    marginBottom: 30,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  progressTrackBackground: {
    position: 'absolute',
    top: 20,
    left: 40, right: 40,
    height: 2,
    zIndex: 0,
    overflow: 'hidden',
  },
  progressTrackFill: {
    height: '100%',
  },
  nodesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  nodeWrapper: {
    alignItems: 'center',
    width: 80,
  },
  progressNode: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  progressNodeActiveGlass: {
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  stepNum: { fontSize: 14, fontWeight: 'bold' },
  stepNumActive: {},
  stepLabel: { fontSize: 12, fontWeight: '600' },
  stepLabelActive: { fontWeight: 'bold' },
  stepLabelCompleted: {},
});
