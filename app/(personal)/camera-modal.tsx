import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { verificationService } from '../../services/verification.service';

export default function CameraModal(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const routineId = params.routineId as string;
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingText, setLoadingText] = useState('Verifying with AI...');
  const [facing, setFacing] = useState<CameraType>('back');

  // 1. Check Permissions
  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContent}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="camera" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Needed</Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            We need your permission to show the camera so you can verify your habits.
          </Text>
          <TouchableOpacity 
            onPress={requestPermission} 
            style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.btnText, { color: colors.white }]}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. Take Picture
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7, // Basic compression
          skipProcessing: true, // Faster capture
        });
        setPhotoUri(photo?.uri || null);
      } catch (error) {
        console.error('Failed to take photo', error);
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  // ... (handleUpload logic unchanged) ...
  const handleUpload = async () => {
    if (!photoUri) return;

    try {
      setIsUploading(true);
      setLoadingText('Uploading to cloud...');

      // 1. Get Signed URL

      const { signedUrl, objectPath } = await verificationService.getSignedUrl('jpg', 'image/jpeg');




      // 2. Upload to GCS via PUT
      await verificationService.uploadToGcs(signedUrl, photoUri);


      // 4. Submit verification to Backend
      setLoadingText('Submitting to AI...');

      const result = await verificationService.submitVerification(
        routineId,
        objectPath
      );

      // 5. Check if already verified or need polling
      if (result.status === 'succeeded' || result.verified) {
        setIsUploading(false);
        DeviceEventEmitter.emit('refreshPersonalRoutines');
        DeviceEventEmitter.emit('PERSONAL_ROUTINE_COMPLETED');
        Alert.alert('Success', 'AI verified your routine! Great job!', [
          { text: 'Awesome', onPress: () => router.back() },
        ]);
      } else if (result.status === 'failed') {
        setIsUploading(false);
        Alert.alert(
          'Verification Failed',
          result.failReason || 'AI could not verify. Please try again.',
          [{ text: 'OK' }]
        );
      } else if (result.id) {
        setLoadingText('AI is verifying...');
        await pollVerificationStatus(result.id);
      } else {
        setIsUploading(false);
        Alert.alert('Verification Failed', 'Please try taking the photo again.');
      }
    } catch (err: unknown) {
      console.error('Full Verification error object:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setIsUploading(false);
      Alert.alert('Verification Failed', errorMessage);
    }
  };

  const pollVerificationStatus = async (verificationId: string) => {
    try {
      const result = await verificationService.getVerificationStatus(verificationId);

      if (result.status === 'succeeded' || result.verified) {
        setIsUploading(false);
        DeviceEventEmitter.emit('refreshPersonalRoutines');
        DeviceEventEmitter.emit('PERSONAL_ROUTINE_COMPLETED');
        Alert.alert('Success', 'AI verified your routine! Great job!', [
          { text: 'Awesome', onPress: () => router.back() },
        ]);
      } else if (result.status === 'failed') {
        setIsUploading(false);
        Alert.alert(
          'Verification Failed',
          result.failReason || 'AI could not verify this action. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        // Still pending
        setTimeout(() => pollVerificationStatus(verificationId), 2000);
      }
    } catch (err: unknown) {
      console.error('Polling error:', err instanceof Error ? err.message : String(err));
      setIsUploading(false);
      Alert.alert('Error', 'Failed to get verification status. Please check your internet.');
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // --- RENDER: PREVIEW MODE (Photo Taken) ---
  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} />

        
        {isUploading && (
          <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.7)' }]}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={[styles.loadingText, { color: colors.white }]}>{loadingText}</Text>
          </View>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn, { backgroundColor: `${colors.white}22`, borderColor: `${colors.white}33`, borderWidth: 1 }]}
            onPress={() => setPhotoUri(null)}
            disabled={isUploading}
          >
            <Text style={[styles.cancelText, { color: colors.white }]}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.uploadBtn, { backgroundColor: colors.primary }]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Ionicons name="cloud-upload" size={20} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={[styles.btnText, { color: colors.white }]}>Upload & Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- RENDER: CAMERA MODE ---
  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing={facing} ref={cameraRef} />
      
      {/* UI Overlay */}
      <View style={styles.cameraUi}>
        {/* Top Bar: Close & Flip */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.45)' }]}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCameraFacing} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.45)' }]}>
            <Ionicons name="camera-reverse" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Bottom Bar: Shutter */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },

  cameraUi: { 
    ...StyleSheet.absoluteFillObject, // Overlay on top
    justifyContent: 'space-between', 
    padding: 24,
    zIndex: 10,
  },
  
  permissionContent: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  permissionBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 40, 
  },
  iconBtn: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  shutterBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
  },

  previewImage: { flex: 1, resizeMode: 'cover' },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cancelBtn: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  cancelText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  uploadBtn: {},
  btnText: { fontWeight: '800', fontSize: 16 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});