import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCreateRoutine } from '@/hooks/use-create-routine';

export default function CreateCollaborativeRoutineScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useColorScheme() ?? 'light';
    const isDark = theme === 'dark';
    const screenGradient = getBackgroundGradient(theme, 'collaborative');
    const collaborativePrimary = Colors[theme].collaborativePrimary;
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
            <TouchableOpacity 
                onPress={() => router.back()} 
                style={[styles.backBtn, { backgroundColor: Colors[theme].surface }]}
            >
                <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>Create Collaborative Routine</Text>
            <View style={{ width: 40 }} />
        </View>
    );

    return (
        <LinearGradient colors={screenGradient} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                
                {renderHeader()}
                <WizardProgress currentStep={step} steps={['Basics', 'Schedule', 'Rules']} />

                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                >
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
                         <TouchableOpacity onPress={prevStep} style={[styles.backStepBtn, { backgroundColor: Colors[theme].surface, borderColor: Colors[theme].border }]}>
                             <Text style={[styles.backStepText, { color: Colors[theme].textSecondary }]}>Back</Text>
                         </TouchableOpacity>
                     )}
                     
                     <TouchableOpacity 
                        onPress={step === 2 ? submit : nextStep} 
                        disabled={isSubmitting}
                        style={{ flex: 1, marginLeft: step > 0 ? 15 : 0 }}
                    >
                        <View
                            style={[styles.nextStepBtn, { backgroundColor: collaborativePrimary, borderColor: collaborativePrimary }]}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.nextStepText}>{step === 2 ? 'Create Routine' : 'Next Step'}</Text>
                            )}
                            {!isSubmitting && step < 2 && <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />}
                        </View>
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
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18, fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 150,
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
        borderWidth: 1,
        marginRight: 10,
    },
    backStepText: { fontWeight: '600', fontSize: 14 },
    nextStepBtn: {
        paddingVertical: 16, paddingHorizontal: 32,
        borderRadius: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        shadowOpacity: 0.3, 
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1, 
    },
    nextStepText: { fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
});
