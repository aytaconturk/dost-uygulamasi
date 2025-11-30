import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useReadingProgress } from './useReadingProgress';
import userSlice from '../store/userSlice';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'progress-1',
                student_id: 'student-1',
                story_id: 1,
                current_level: 2,
                completed_levels: [1],
              },
              error: null,
            })
          ),
        })),
      })),
    })),
  },
  getStudentProgressByStory: vi.fn(() =>
    Promise.resolve({
      data: {
        id: 'progress-1',
        student_id: 'student-1',
        story_id: 1,
        current_level: 2,
        completed_levels: [1],
      },
      error: null,
    })
  ),
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      user: userSlice,
    },
    preloadedState: {
      user: {
        teacher: null,
        student: {
          id: 'student-1',
          teacher_id: 'teacher-1',
          first_name: 'Test',
          last_name: 'Student',
          created_at: new Date().toISOString(),
        },
        loading: false,
        error: null,
      },
    },
  });
};

describe('useReadingProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current level for a story', async () => {
    const store = createMockStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useReadingProgress(), { wrapper });

    await waitFor(() => {
      expect(result.current.getCurrentLevel(1)).toBe(2);
    });
  });

  it('should check if story is completed', async () => {
    const store = createMockStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useReadingProgress(), { wrapper });

    await waitFor(() => {
      // Story is not completed (current_level is 2, not 5)
      expect(result.current.isStoryCompleted(1)).toBe(false);
    });
  });
});



