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

export default function CollaborativeCameraModal(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const routineIdRaw = params.routineId;
  const routineId = Array.isArray(routineIdRaw) ? routineIdRaw[0] : routineIdRaw;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [facing, setFacing] = useState<CameraType>('back');

  // 1. Check Permissions
  if (!permission) {
    return <View style={styles.container} />; // Loading state
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20, color: 'white' }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
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
      setLoadingText('Uploading to cloud...');

      // 1. Get Signed URL
      const { signedUrl, objectPath } = await verificationService.getSignedUrl('jpg', 'image/jpeg');

      // 2. Prepare file blob
      const photoResponse = await fetch(photoUri);
      const blob = await photoResponse.blob();

      // 3. Upload to GCS via PUT
      await verificationService.uploadToGcs(signedUrl, blob);

      // 4. Submit verification to Backend
      setLoadingText('Submitting to group...');
      
      const publicUrl = `https://storage.googleapis.com/habify-verification-photos/${objectPath}`;
      
      // Submit to unified verification flow (Backend handles collaborative directly)
      await verificationService.submitVerification(routineId, objectPath);

      // 5. Success
      setIsUploading(false);
      
      // Notify chat to refresh and main list
      DeviceEventEmitter.emit('refreshCollaborativeRoutines');
      
      try {
          await routineService.sendRoutineChatMessage(routineId, publicUrl);
      } catch {
          // ignore notification failure
      }

      Alert.alert('Success', 'Photo posted to group! Waiting for approvals.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      
    } catch (err: unknown) {
      console.error('Collaborative Verification error:', err);
      Alert.alert(
        'Post Failed',
        err.response?.data?.message || err.message || 'An unexpected error occurred'
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
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
        
        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        )}

        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => setPhotoUri(null)}
            disabled={isUploading}
          >
            <Text style={styles.cancelText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.uploadBtn]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>Post to Chat</Text>
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
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconBtn}>
            <Ionicons name="camera-reverse" size={28} color="white" />
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between', 
    padding: 20,
    zIndex: 10,
  },
  permissionBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40, 
  },
  iconBtn: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
  },
  bottomBar: {
    alignItems: 'center',
    marginBottom: 40,
  },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: 'white',
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
  cancelBtn: { backgroundColor: '#374151' },
  cancelText: { color: '#fff', fontWeight: '600' },
  uploadBtn: { backgroundColor: '#E879F9' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
});
