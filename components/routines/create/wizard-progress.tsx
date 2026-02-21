import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

const ACCENT_COLOR = '#E879F9';

interface Props {
  currentStep: number;
  steps: string[];
}

export function WizardProgress({ currentStep, steps }: Props) {
  return (
    <View style={styles.progressContainer}>
      {/* Track - Contains Background and Fill */}
      <View style={styles.progressTrackBackground}>
        <Animated.View style={[
          styles.progressTrackFill, 
          { width: `${(currentStep / (steps.length - 1)) * 100}%` }
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
                (isActive || isCompleted) && styles.progressNodeActiveGlass
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#000" />
                ) : (
                  <Text style={[
                    styles.stepNum, 
                    (isActive || isCompleted) && styles.stepNumActive
                  ]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                isActive && styles.stepLabelActive,
                isCompleted && styles.stepLabelCompleted
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 0,
    overflow: 'hidden',
  },
  progressTrackFill: {
    height: '100%',
    backgroundColor: ACCENT_COLOR,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  progressNodeActiveGlass: {
    backgroundColor: ACCENT_COLOR,
    borderColor: ACCENT_COLOR,
    shadowColor: ACCENT_COLOR,
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  stepNum: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 'bold' },
  stepNumActive: { color: '#000' },
  stepLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' },
  stepLabelActive: { color: '#fff', fontWeight: 'bold' },
  stepLabelCompleted: { color: ACCENT_COLOR },
});
