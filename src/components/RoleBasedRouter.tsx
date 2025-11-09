import { useEffect, useState } from 'react';
import { getCurrentUser, onAuthStateChange, AuthUser } from '../lib/auth';
import TeacherLogin from './TeacherLogin';
import StudentSelector from './StudentSelector';
import AdminPanel from './AdminPanel';
import StoryList from './StoryList';
import Header from './Header';
import { useDispatch } from 'react-redux';
import { setTeacher, setStudent } from '../store/userSlice';
import type { AppDispatch } from '../store/store';

interface RoleBasedRouterProps {
  children: React.ReactNode;
}

export default function RoleBasedRouter({ children }: RoleBasedRouterProps) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const user = await getCurrentUser();
      setAuthUser(user);
      setLoading(false);

      if (user) {
        if (user.teacher) {
          dispatch(setTeacher(user.teacher));
        } else if (user.student) {
          dispatch(setStudent(user.student));
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data } = onAuthStateChange((user) => {
      setAuthUser(user);
      if (user) {
        if (user.teacher) {
          dispatch(setTeacher(user.teacher));
        } else if (user.student) {
          dispatch(setStudent(user.student));
        }
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
        <div className="text-white text-2xl">Yükleniyor...</div>
      </div>
    );
  }

  // Not logged in - show login
  if (!authUser) {
    return <TeacherLogin onLoginSuccess={() => {}} />;
  }

  // Admin role - show admin panel
  if (authUser.role === 'admin') {
    return <AdminPanel />;
  }

  // Teacher role - show teacher dashboard
  if (authUser.role === 'teacher' && authUser.teacher) {
    return (
      <div className="space-background min-h-screen bg-cover bg-center relative">
        <Header stories={[]} />
        <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </div>
    );
  }

  // User/Student role - show story selection and learning interface
  if (authUser.role === 'user' && authUser.student) {
    return (
      <div className="space-background min-h-screen bg-cover bg-center relative">
        <Header stories={[]} />
        <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </div>
    );
  }

  // Fallback
  return <TeacherLogin onLoginSuccess={() => {}} />;
}
