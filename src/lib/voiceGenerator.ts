// Voice Generator API client

export interface VoiceGeneratorRequest {
  text: string;
  voice?: string; // Optional voice type
}

export interface VoiceGeneratorResponse {
  audioBase64: string;
  success: boolean;
  error?: string;
}

/**
 * Generate audio from text using DOST voice generator API
 */
export async function generateVoice(
  text: string,
  voice?: string
): Promise<VoiceGeneratorResponse> {
  try {
    // Use the same API endpoint as playTts.ts
    const apiUrl = "https://arge.aquateknoloji.com/webhook/dost/voice-generator";
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: voice || 'default',
      }),
    });

    if (!response.ok) {
      throw new Error(`Voice generator API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      audioBase64: data.audioBase64 || data.audio || '',
      success: true,
    };
  } catch (error) {
    console.error('Error generating voice:', error);
    return {
      audioBase64: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert base64 audio to blob and upload to Supabase Storage
 */
export async function uploadAudioToSupabase(
  base64Audio: string,
  fileName: string,
  folder: string = 'question-audios'
): Promise<string | null> {
  try {
    const { supabase } = await import('./supabase');
    
    // Convert base64 to blob
    const base64Data = base64Audio.includes('data:') 
      ? base64Audio.split(',')[1] 
      : base64Audio;
    
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/mpeg' });

    // Upload to Supabase Storage
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('audios')
      .upload(filePath, blob, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading audio to Supabase:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audios')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadAudioToSupabase:', error);
    return null;
  }
}

