export type FontKey = 'fredoka' | 'comic' | 'nunito' | 'quicksand';

const SESSION_FONT = 'ui_font_family';
const SESSION_SIZE_STEP = 'ui_font_size_step';

export const FONT_STACKS: Record<FontKey, string> = {
  fredoka: "'Fredoka', sans-serif",
  comic: "'Comic Neue', 'Comic Sans MS', 'Comic Sans', cursive",
  nunito: "'Nunito', 'Segoe UI', Roboto, Arial, sans-serif",
  quicksand: "'Quicksand', 'Segoe UI', Roboto, Arial, sans-serif",
};

export const SIZE_STEPS_PX = [14, 16, 18, 20];

export const getFontKey = (): FontKey => {
  const v = sessionStorage.getItem(SESSION_FONT) as FontKey | null;
  return (v && FONT_STACKS[v]) ? v : 'fredoka';
};

export const setFontKey = (key: FontKey) => {
  sessionStorage.setItem(SESSION_FONT, key);
  applyTypography();
};

export const getSizeStep = (): number => {
  const raw = sessionStorage.getItem(SESSION_SIZE_STEP);
  const n = raw ? parseInt(raw, 10) : 1; // default 16px
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), SIZE_STEPS_PX.length - 1) : 1;
};

export const setSizeStep = (step: number) => {
  const clamped = Math.min(Math.max(step, 0), SIZE_STEPS_PX.length - 1);
  sessionStorage.setItem(SESSION_SIZE_STEP, String(clamped));
  applyTypography();
};

export const applyTypography = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const fontVar = FONT_STACKS[getFontKey()];
  const sizePx = SIZE_STEPS_PX[getSizeStep()];
  root.style.setProperty('--app-font', fontVar);
  root.style.setProperty('--app-font-size', `${sizePx}px`);
};
