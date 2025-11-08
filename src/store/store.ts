import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import level2Reducer from './level2Slice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    level2: level2Reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
