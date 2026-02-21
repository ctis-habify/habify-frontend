import { api } from './api';

export interface VerificationResponse {
  id: string;
  status: 'pending' | 'succeeded' | 'failed';
  failReason?: string;
  score?: number;
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
      throw new Error(`Failed to upload to GCS: ${response.statusText}`);
    }
  },

  /**
   * 3. Submit verification to backend queue (Unified endpoint)
   */
  async submitVerification(routineId: string, objectPath: string): Promise<{ id: string }> {
    const res = await api.post('/routines/verify', {
      routineId,
      objectPath,
    });
    return res.data;
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
