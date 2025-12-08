// Sound effects utility
// Placeholder audio files - these should be added to public/audios/sfx/

export const playSoundEffect = async (effect: 'whoosh' | 'pop' | 'success' | 'error' | 'transition') => {
  const audio = new Audio();
  
  // Map effect names to file paths
  const soundMap: Record<string, string> = {
    whoosh: '/audios/sfx/whoosh.mp3',
    pop: '/audios/sfx/pop.mp3',
    success: '/audios/sfx/success.mp3',
    error: '/audios/sfx/error.mp3',
    transition: '/audios/sfx/transition.mp3',
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


