import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import StoryList from './components/StoryList';
import StoryIntro from './components/StoryIntro';
import ReadingScreen from './components/ReadingScreen';
import Header from './components/Header';
import TeacherLogin from './components/TeacherLogin';
import StudentSelector from './components/StudentSelector';
import AdminPanel from './components/AdminPanel';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import Level1Completion from './levels/level1/Completion';
import Level2Completion from './levels/level2/Completion';
import './index.css';
import LevelRouter from './levels/LevelRouter';
import { useEffect, useState } from 'react';
import { applyTypography } from './lib/settings';
import { setRole, setTeacher, setStudent } from './store/userSlice';
import type { RootState, AppDispatch } from './store/store';
import { getStories } from './lib/supabase';

type Story = {
  id: number;
  title: string;
  description: string;
  image: string;
  locked?: boolean;
};

function CompletionRouter() {
  const { level } = useParams<{ level: string }>();

  if (level === '2') {
    return <Level2Completion />;
  }
  return <Level1Completion />;
}

export default function App() {
    const dispatch = useDispatch<AppDispatch>();
    const role = useSelector((state: RootState) => state.user.role);
    const teacher = useSelector((state: RootState) => state.user.teacher);
    const student = useSelector((state: RootState) => state.user.student);
    const [showStudentSelector, setShowStudentSelector] = useState(false);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [stories, setStories] = useState<Story[]>([]);
    const [storiesLoading, setStoriesLoading] = useState(true);

    useEffect(() => { applyTypography(); }, []);

    // Fetch stories from Supabase
    useEffect(() => {
        const fetchStories = async () => {
            try {
                const { data, error } = await getStories();
                if (error) throw error;
                setStories(data || []);
            } catch (err) {
                console.error('Failed to fetch stories:', err);
                setStories([]);
            } finally {
                setStoriesLoading(false);
            }
        };
        fetchStories();
    }, []);

    // Restore session from localStorage on app mount
    useEffect(() => {
        const savedRole = localStorage.getItem('dost_role');
        const savedTeacher = localStorage.getItem('dost_teacher');
        const savedStudent = localStorage.getItem('dost_student');

        if (savedRole) {
            try {
                dispatch(setRole(JSON.parse(savedRole)));
            } catch (err) {
                console.error('Failed to restore role:', err);
                localStorage.removeItem('dost_role');
            }
        }

        if (savedTeacher) {
            try {
                dispatch(setTeacher(JSON.parse(savedTeacher)));
            } catch (err) {
                console.error('Failed to restore teacher session:', err);
                localStorage.removeItem('dost_teacher');
            }
        }

        if (savedStudent) {
            try {
                dispatch(setStudent(JSON.parse(savedStudent)));
            } catch (err) {
                console.error('Failed to restore student session:', err);
                localStorage.removeItem('dost_student');
            }
        }

        setSessionLoaded(true);
    }, [dispatch]);

    // Show diagnostics if user presses Ctrl+Shift+D
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setShowDiagnostics(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    if (showDiagnostics) {
        return <DiagnosticsPanel />;
    }

    if (!sessionLoaded || storiesLoading) {
        return null;
    }

    if (!role) {
        return <TeacherLogin onLoginSuccess={() => setShowStudentSelector(true)} />;
    }

    if (role === 'admin') {
        return <AdminPanel />;
    }

    if (!teacher) {
        return <TeacherLogin onLoginSuccess={() => setShowStudentSelector(true)} />;
    }

    if (!student) {
        return <StudentSelector onStudentSelected={() => {}} />;
    }

    return (
        <Router>
            <div className="space-background min-h-screen bg-cover bg-center relative">
                {/* Header */}
                <Header stories={stories} />

                {/* Routes */}
                <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-8 md:py-10">
                    <Routes>
                        <Route path="/" element={<StoryList stories={stories} />} />
                        <Route path="/story/:id" element={<StoryIntro stories={stories} />} />
                        <Route path="/level/:level/completion" element={<CompletionRouter />} />
                        <Route path="/level:level/step:step" element={<LevelRouter />} />
                        <Route path="/level/:level/step/:step" element={<LevelRouter />} />
                        <Route path="/story/:id/read" element={<ReadingScreen stories={stories} />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}
