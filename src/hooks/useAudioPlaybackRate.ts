import { useEffect, useRef } from 'react';
import { getPlaybackRate } from '../components/SidebarSettings';

/**
 * Hook to automatically apply playback rate to an audio element
 * @param audioRef - Ref to the audio element
 */
export function useAudioPlaybackRate(audioRef: React.RefObject<HTMLAudioElement | null>) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Apply initial playback rate
    audio.playbackRate = getPlaybackRate();

    // Listen for playback rate changes
    const handleStorageChange = () => {
      if (audioRef.current) {
        audioRef.current.playbackRate = getPlaybackRate();
      }
    };

    // Listen to custom event for playback rate changes
    window.addEventListener('playbackRateChanged', handleStorageChange);
    
    // Also listen to storage events (if changed in another tab)
    window.addEventListener('storage', (e) => {
      if (e.key === 'audio_playback_rate') {
        handleStorageChange();
      }
    });

    return () => {
      window.removeEventListener('playbackRateChanged', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [audioRef]);
}

/**
 * Apply playback rate to an audio element immediately
 * @param audio - Audio element
 */
export function applyPlaybackRate(audio: HTMLAudioElement | null) {
  if (audio) {
    audio.playbackRate = getPlaybackRate();
  }
}

/**
 * Apply playback rate to an Audio object (for dynamically created audio)
 * @param audio - Audio object
 */
export function applyPlaybackRateToAudio(audio: HTMLAudioElement | Audio) {
  if (audio) {
    audio.playbackRate = getPlaybackRate();
  }
}

