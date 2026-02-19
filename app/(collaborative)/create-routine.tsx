import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { StepBasicInfo } from '@/components/routines/create/step-basic-info';
import { StepGamification } from '@/components/routines/create/step-gamification';
import { StepSchedule } from '@/components/routines/create/step-schedule';
import { WizardProgress } from '@/components/routines/create/wizard-progress';
import { useCreateRoutine } from '@/hooks/use-create-routine';

const GRADIENT_COLORS = ['#2e1065', '#581c87'] as const;
const BUTTON_GRADIENT = ['#e879f9', '#c026d3'] as const;
const ACCENT_COLOR = '#E879F9';

export default function CreateCollaborativeRoutineScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const categoryIdParam = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
    
    const { 
        step, 
        nextStep, 
        prevStep, 
        submit, 
        isSubmitting, 
        formState, 
        updateForm, 
        categories, 
        loadCategories, 
        loadingCategories 
    } = useCreateRoutine(categoryIdParam);

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Collaborative Routine</Text>
            <View style={{ width: 40 }} />
        </View>
    );

    return (
        <LinearGradient colors={GRADIENT_COLORS} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                
                {renderHeader()}
                <WizardProgress currentStep={step} steps={['Basics', 'Schedule', 'Rules']} />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {step === 0 && (
                        <StepBasicInfo 
                            formState={formState}
                            updateForm={updateForm}
                            categories={categories}
                            loadCategories={loadCategories}
                            loadingCategories={loadingCategories}
                        />
                    )}
                    {step === 1 && (
                        <StepSchedule formState={formState} updateForm={updateForm} />
                    )}
                    {step === 2 && (
                        <StepGamification formState={formState} updateForm={updateForm} />
                    )}
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                     {step > 0 && (
                         <TouchableOpacity onPress={prevStep} style={styles.backStepBtn}>
                             <Text style={styles.backStepText}>Back</Text>
                         </TouchableOpacity>
                     )}
                     
                     <TouchableOpacity 
                        onPress={step === 2 ? submit : nextStep} 
                        disabled={isSubmitting}
                        style={{ flex: 1, marginLeft: step > 0 ? 15 : 0 }}
                    >
                        <LinearGradient
                            colors={BUTTON_GRADIENT}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.nextStepBtnGradient}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.nextStepText}>{step === 2 ? 'Create Routine' : 'Next Step'}</Text>
                            )}
                            {!isSubmitting && step < 2 && <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />}
                        </LinearGradient>
                     </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff', fontSize: 18, fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24, // Safe area
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backStepBtn: {
        paddingVertical: 16, paddingHorizontal: 20,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        marginRight: 10,
    },
    backStepText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 14 },
    nextStepBtnGradient: {
        paddingVertical: 16, paddingHorizontal: 32,
        borderRadius: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        shadowColor: ACCENT_COLOR, 
        shadowOpacity: 0.5, 
        shadowRadius: 15,
        elevation: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    nextStepText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
});
