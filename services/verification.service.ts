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
  async uploadToGcs(signedUrl: string, fileBlob: Blob | any): Promise<void> {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: fileBlob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!response.ok) {
      console.error('[VerificationService] GCS upload failed:', response.status);
      throw new Error(`Failed to upload to GCS: ${response.statusText}`);
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
