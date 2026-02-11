import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const routineId = params.routineId as string; // We will use this later for API

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingText, setLoadingText] = useState('Verifying with AI...');
  const [facing, setFacing] = useState<CameraType>('back');

  // 1. Check Permissions
  if (!permission) {
    return <View />; // Loading state
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
      console.log('Step 1: Requesting Signed URL...');
      const { signedUrl, objectPath } = await verificationService.getSignedUrl('jpg', 'image/jpeg');
      console.log('Signed URL received:', signedUrl);

      console.log('Object path:', objectPath);

      // 2. Prepare file blob
      console.log('Step 2: Preparing blob...');
      let blob;
      if (photoUri === 'mock-photo') {
        const asset = require('../../img/true.jpg');
        const assetSource = Image.resolveAssetSource(asset);
        console.log('Resolved asset URI (PASS):', assetSource.uri);
        const assetResponse = await fetch(assetSource.uri);
        blob = await assetResponse.blob();
      } else if (photoUri === 'mock-photo-fail') {
        const asset = require('../../img/false.png');
        const assetSource = Image.resolveAssetSource(asset);
        console.log('Resolved asset URI (FAIL):', assetSource.uri);
        const assetResponse = await fetch(assetSource.uri);
        blob = await assetResponse.blob();
      } else {
        const photoResponse = await fetch(photoUri);
        blob = await photoResponse.blob();
      }
      console.log('Blob prepared, size:', blob.size);

      // 3. Upload to GCS via PUT
      console.log('Step 3: Uploading to GCS...');
      await verificationService.uploadToGcs(signedUrl, blob);
      console.log('Upload successful');

      // 4. Submit verification to Backend
      setLoadingText('Submitting to AI...');
      console.log('Step 4: Submitting verification for routineId:', routineId);
      const { id: verificationId } = await verificationService.submitVerification(
        routineId,
        objectPath
      );
      console.log('Verification submitted, ID:', verificationId);

      // 5. Start Polling for Status
      setLoadingText('AI is verifying...');
      console.log('Step 5: Starting polling...');
      await pollVerificationStatus(verificationId);
    } catch (err: unknown) {
      console.error('Full Verification error object:', err);
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const anyErr = err as any;
        if (anyErr.response) {
            console.error('Error Status:', anyErr.response.status);
            console.error('Error Data:', JSON.stringify(anyErr.response.data, null, 2));
        }
        Alert.alert(
            'Verification Failed',
            anyErr.response?.data?.message || anyErr.message || 'An unexpected error occurred'
        );
      } else if (err instanceof Error) {
        Alert.alert('Verification Failed', err.message);
      } else {
        Alert.alert('Verification Failed', 'An unexpected error occurred');
      }
      setIsUploading(false);
    }

  };

  const pollVerificationStatus = async (verificationId: string) => {
    try {
      const result = await verificationService.getVerificationStatus(verificationId);

      if (result.status === 'succeeded') {
        setIsUploading(false);
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
    } catch (err) {
      console.error('Polling error:', err);
      setIsUploading(false);
      Alert.alert('Error', 'Failed to get verification status. Please check your internet.');
    }
  };



  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // --- RENDER: PREVIEW MODE (Photo Taken) ---
  if (photoUri) {
    const isMock = photoUri.startsWith('mock-photo');
    return (
      <View style={styles.container}>
        {(photoUri === 'mock-photo') ? (
          <Image source={require('../../img/true.jpg')} style={styles.previewImage} />
        ) : (photoUri === 'mock-photo-fail') ? (
          <Image source={require('../../img/false.png')} style={styles.previewImage} />
        ) : (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        )}
        
        {isMock && (
          <View style={{ position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8, zIndex: 20 }}>
          </View>
        )}

        
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
            <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>Upload & Verify</Text>
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
          <TouchableOpacity 
            onPress={() => setPhotoUri('mock-photo')} 
            style={[styles.iconBtn, { marginBottom: 10, backgroundColor: 'rgba(255,165,0,0.6)' }]}
          >
            <Ionicons name="bug" size={24} color="white" />
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>PASS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setPhotoUri('mock-photo-fail')} 
            style={[styles.iconBtn, { marginBottom: 20, backgroundColor: 'rgba(255,0,0,0.6)' }]}
          >
            <Ionicons name="bug" size={24} color="white" />
            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>FAIL</Text>
          </TouchableOpacity>

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
    padding: 20,
    zIndex: 10,
  },
  
  permissionBtn: {
    backgroundColor: '#2563eb', // Keep distinct blue for actions
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
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

  // Preview Styles
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
  uploadBtn: { backgroundColor: '#2563eb' },
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