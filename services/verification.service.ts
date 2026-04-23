import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { api } from './api';

export interface VerificationResponse {
  id: string;
  status: 'pending' | 'succeeded' | 'failed';
  failReason?: string;
  score?: number;
  verified?: boolean;
}

export const verificationService = {
  /**
   * 1. Get Signed URL for upload
   */
  async getSignedUrl(ext: string, mimeType: string): Promise<{ signedUrl: string; objectPath: string }> {
    const res = await api.post('/uploads/signed-url', { ext, mimeType });
    return res.data;
  },

  /**
   * 2. Upload photo to GCS
   */
  async uploadToGcs(signedUrl: string, fileUri: string, mimeType: string = 'image/jpeg'): Promise<void> {
    console.log('[VerificationService] Starting GCS upload via FileSystem...', {
      fileUri,
      mimeType,
      urlLength: signedUrl?.length
    });

    try {
      // Defensive: FileSystemUploadType can be undefined in some environments
      const BINARY_CONTENT = (FileSystemUploadType as any)?.BINARY_CONTENT ?? 0;

      const response = await uploadAsync(signedUrl, fileUri, {
        httpMethod: 'PUT',
        uploadType: BINARY_CONTENT,
        headers: {
          'Content-Type': mimeType,
        },
      });

      if (response.status < 200 || response.status >= 300) {
        console.error('[VerificationService] GCS upload failed:', {
          status: response.status,
          body: response.body
        });
        throw new Error(`Failed to upload to GCS: ${response.status}. ${response.body?.substring(0, 100)}`);
      }
      
      console.log('[VerificationService] GCS upload succeeded');
    } catch (error) {
      console.error('[VerificationService] GCS upload error:', error);
      throw error;
    }
  },

  /**
   * 3. Submit verification to backend queue (Unified endpoint)
   */
  async submitVerification(routineId: string, objectPath: string): Promise<VerificationResponse & { id?: string }> {
    const res = await api.post('/routines/verify', {
      routineId,
      routine_id: routineId, // Fallback for backend consistency
      objectPath,
    });
    
    console.log('[VerificationService] Backend Response:', JSON.stringify(res.data, null, 2));
    
    // Normalize response
    const raw = res.data.data || res.data.verification || res.data.result || res.data;
    
    // Determine status: if explicitly failed or (not verified AND not pending anymore)
    let status: 'pending' | 'succeeded' | 'failed' = 'pending';
    if (raw.status === 'succeeded' || raw.verified === true) {
      status = 'succeeded';
    } else if (raw.status === 'failed' || (raw.verified === false && raw.pending === false)) {
      status = 'failed';
    }

    // Support both immediate results and polling IDs
    return {
      id: String(raw.id || raw.verificationId || raw.verification_id || ''),
      status,
      score: raw.score,
      failReason: raw.failReason || raw.reason,
      verified: !!raw.verified,
    };
  },

  /**
   * 4. Poll for verification status
   */
  async getVerificationStatus(verificationId: string): Promise<VerificationResponse> {
    const res = await api.get(`/verify/${verificationId}`);
    // Extract data from response if it's wrapped
    return res.data.data || res.data;
  },
};
