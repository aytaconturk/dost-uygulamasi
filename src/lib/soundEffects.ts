// Sound effects utility
// Audio files are in public/audios/sfx/

import { getAssetUrl } from './image-utils';

export const playSoundEffect = async (effect: 'whoosh' | 'pop' | 'success' | 'error' | 'transition') => {
  const audio = new Audio();
  
  // Map effect names to file paths (use getAssetUrl for GitHub Pages compatibility)
  const soundMap: Record<string, string> = {
    whoosh: getAssetUrl('audios/sfx/whoosh.mp3'),
    pop: getAssetUrl('audios/sfx/pop.mp3'),
    success: getAssetUrl('audios/sfx/success.mp3'),
    error: getAssetUrl('audios/sfx/error.mp3'),
    transition: getAssetUrl('audios/sfx/transition.mp3'),
  };

  const soundPath = soundMap[effect];
  if (!soundPath) {
    console.warn(`Sound effect "${effect}" not found`);
    return;
  }

  try {
    audio.src = soundPath;
    audio.volume = 0.5; // 50% volume for sound effects
    await audio.play();
  } catch (err) {
    // Silently fail if audio file doesn't exist
    console.debug(`Could not play sound effect: ${effect}`, err);
  }
};



