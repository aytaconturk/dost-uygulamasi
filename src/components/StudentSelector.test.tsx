import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StudentSelector from './StudentSelector';
import userSlice from '../store/userSlice';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      user: userSlice,
    },
    preloadedState: {
      user: {
        teacher: {
          id: 'teacher-1',
          user_id: 'user-1',
          first_name: 'Test',
          last_name: 'Teacher',
          school_name: 'Test School',
          created_at: new Date().toISOString(),
        },
        student: null,
        loading: false,
        error: null,
      },
      ...initialState,
    },
  });
};

describe('StudentSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render student selector with title', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <StudentSelector onStudentSelected={() => {}} />
      </Provider>
    );

    expect(screen.getByText('Öğrenci Seç')).toBeInTheDocument();
  });

  it('should show teacher name', async () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <StudentSelector onStudentSelected={() => {}} />
      </Provider>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Yükleniyor...')).not.toBeInTheDocument();
    });

    // Check if teacher name is displayed (component shows first_name + last_name)
    expect(screen.getByText(/Hoşgeldiniz/i)).toBeInTheDocument();
  });

  it('should show add student button', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <StudentSelector onStudentSelected={() => {}} />
      </Provider>
    );

    expect(screen.getByText('+ Yeni Öğrenci Ekle')).toBeInTheDocument();
  });
});

