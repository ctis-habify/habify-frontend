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
import { routineService } from '../../services/routine.service';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function CollaborativeCameraModal(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const routineIdRaw = params.routineId;
  const routineId = Array.isArray(routineIdRaw) ? routineIdRaw[0] : routineIdRaw;
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [facing, setFacing] = useState<CameraType>('back');

  // 1. Check Permissions
  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />; // Loading state
  }
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ textAlign: 'center', marginBottom: 20, color: colors.text, fontSize: 16, fontWeight: '600' }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={[styles.permissionBtn, { backgroundColor: colors.collaborativePrimary }]}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Take Picture
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: true,
        });
        setPhotoUri(photo?.uri || null);
      } catch (error) {
        console.error('Failed to take photo', error);
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const handleUpload = async () => {
    if (!photoUri || !routineId) {
      Alert.alert('Post Failed', 'Routine ID is missing.');
      return;
    }

    try {
      setIsUploading(true);
      setLoadingText('Validating photo...');

      // 0. Validate File
      const validation = await verificationService.validateFile(photoUri);
      if (!validation.valid) {
        setIsUploading(false);
        Alert.alert('Invalid Photo', validation.error || 'Please try taking the photo again.');
        return;
      }

      setLoadingText('Uploading to cloud...');

      // 1. Get Signed URL
      const { signedUrl, objectPath } = await verificationService.getSignedUrl('jpg', 'image/jpeg');

      // 2. Upload to GCS via PUT
      await verificationService.uploadToGcs(signedUrl, photoUri);

      // 4. Submit verification to Backend
      setLoadingText('Submitting to group...');
      
      const publicUrl = `https://storage.googleapis.com/habify-photo-uploads/${objectPath}`;
      
      // Submit to unified verification flow (Backend handles collaborative directly)
      await verificationService.submitVerification(routineId, objectPath);

      // 5. Success
      setIsUploading(false);
      
      // Notify chat to refresh and main list
      DeviceEventEmitter.emit('refreshCollaborativeRoutines');
      
      try {
          // Send the GCS object path or the public URL as a chat message
          await routineService.sendRoutineChatMessage(routineId, publicUrl);
      } catch {
          // ignore notification failure
      }

      Alert.alert('Success', 'Photo posted to group! Waiting for approvals.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      
    } catch (err: unknown) {
      console.error('Collaborative Verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      const responseMessage = (err as any)?.response?.data?.message;
      Alert.alert(
        'Post Failed',
        responseMessage || errorMessage
      );
      setIsUploading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // --- RENDER: PREVIEW MODE (Photo Taken) ---
  if (photoUri) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
        
        {isUploading && (
          <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.7)' }]}>
            <ActivityIndicator size="large" color={colors.collaborativePrimary} />
            <Text style={[styles.loadingText, { color: colors.white }]}>{loadingText}</Text>
          </View>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 }]}
            onPress={() => setPhotoUri(null)}
            disabled={isUploading}
          >
            <Text style={[styles.cancelText, { color: colors.white }]}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.uploadBtn, { backgroundColor: colors.collaborativePrimary }]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Ionicons name="send" size={20} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={[styles.btnText, { color: colors.white }]}>Post to Chat</Text>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconBtn}>
            <Ionicons name="camera-reverse" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Bottom Bar: Shutter */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
            <View style={[styles.shutterInner, { backgroundColor: colors.white }]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  cameraUi: { 
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between', 
    padding: 20,
    zIndex: 10,
  },
  permissionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 44,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 30,
  },
  bottomBar: {
    alignItems: 'center',
    marginBottom: 40,
  },
  shutterBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  previewImage: { flex: 1, resizeMode: 'contain' },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  btn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelBtn: {},
  cancelText: { fontWeight: '700' },
  uploadBtn: {},
  btnText: { fontWeight: '800', fontSize: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
