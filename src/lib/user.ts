export type ChildUser = {
  firstName: string;
  lastName: string;
  teacher: string;
  userId: string;
  password: string;
};

const KEY = 'child_user_session';

export const generateUserId = () => {
  const base = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `U-${base}`.toUpperCase();
};

export const getUser = (): ChildUser | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ChildUser) : null;
  } catch {
    return null;
  }
};

export const setUser = (u: ChildUser) => {
  sessionStorage.setItem(KEY, JSON.stringify(u));
};

export const upsertUser = (partial: Partial<ChildUser>) => {
  const cur = getUser();
  const next: ChildUser = {
    firstName: cur?.firstName || '',
    lastName: cur?.lastName || '',
    teacher: cur?.teacher || '',
    userId: cur?.userId || generateUserId(),
    password: cur?.password || '',
    ...partial,
  };
  setUser(next);
  return next;
};
