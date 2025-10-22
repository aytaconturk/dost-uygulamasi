import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Teacher, Student } from '../lib/supabase';

export type UserState = {
  teacher: Teacher | null;
  student: Student | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: UserState = {
  teacher: null,
  student: null,
  isLoading: false,
  error: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setTeacher: (state, action: PayloadAction<Teacher | null>) => {
      state.teacher = action.payload;
      state.error = null;
    },
    setStudent: (state, action: PayloadAction<Student | null>) => {
      state.student = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearUser: (state) => {
      state.teacher = null;
      state.student = null;
      state.error = null;
    },
  },
});

export const { setTeacher, setStudent, setLoading, setError, clearUser } = userSlice.actions;
export default userSlice.reducer;
