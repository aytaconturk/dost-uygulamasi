/**
 * Level 5 Step 2 - Reward Image Generation API
 * Uses n8n webhook for Whisper (STT) + DALL-E 3 (Image Gen)
 */

import { API_ENDPOINTS } from './config';

/**
 * Complete flow: Audio → n8n → Whisper → DALL-E 3 → Image URL
 */
export async function generateRewardImage(
  audioBlob: Blob,
  onProgress?: (stage: 'transcribing' | 'generating' | 'complete') => void
): Promise<{ imageUrl: string; promptText: string }> {
  try {
    onProgress?.('transcribing');

    // Send audio to n8n webhook
    const formData = new FormData();
    formData.append('data', audioBlob, 'audio.webm');

    console.log('[Level5] Sending audio to n8n, size:', audioBlob.size);

    onProgress?.('generating');

    const response = await fetch(API_ENDPOINTS.createImage, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Level5] Error:', response.status, errorText);
      throw new Error('Görsel oluşturulamadı');
    }

    const data = await response.json();
    console.log('[Level5] Response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Görsel oluşturulamadı');
    }

    onProgress?.('complete');
    
    return {
      imageUrl: data.imageUrl,
      promptText: data.promptText,
    };
  } catch (error) {
    console.error('[Level5] Reward generation error:', error);
    throw error;
  }
}
