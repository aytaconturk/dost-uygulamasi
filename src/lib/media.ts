export const stopAllMedia = () => {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO'));
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      const audios = Array.from(document.querySelectorAll('audio')) as HTMLAudioElement[];
      audios.forEach((a) => {
        try {
          a.pause();
          a.currentTime = 0;
        } catch {}
      });
    }
  } catch {}
};
