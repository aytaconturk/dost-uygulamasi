import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import StoryList from './components/StoryList';
import StoryIntro from './components/StoryIntro';
import ReadingScreen from './components/ReadingScreen';
import Header from './components/Header';
import TeacherLogin from './components/TeacherLogin';
import StudentSelector from './components/StudentSelector';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import Completion from './levels/level1/Completion';
import './index.css';
import LevelRouter from './levels/LevelRouter';
import { useEffect, useState } from 'react';
import { applyTypography } from './lib/settings';
import { setTeacher, setStudent } from './store/userSlice';
import type { RootState, AppDispatch } from './store/store';

const stories = [
    { id: 1, title: 'Kırıntıların Kahramanları', description: 'Karıncalar hakkında', image: '/src/assets/images/story1.png', level: 1 },
    { id: 2, title: 'Avcumun İçindeki Akıllı Kutu', description: 'Akıllı telefonlar hakkında', image: '/src/assets/images/story2.png', level: 2 },
    { id: 3, title: 'Çöl Şekerlemesi', description: 'Hurma ağacı hakkında', image: '/src/assets/images/story3.png', level: 3 },
    { id: 4, title: 'Turizmin İncisi', description: 'Akdeniz Bölgesi hakkında', image: '/src/assets/images/story4.png', level: 4 },
    { id: 5, title: 'Çöl Gemisi', description: 'Develer hakkında', image: '/src/assets/images/story5.png', level: 5 },
    { id: 6, title: 'Deniz Altı Krallığı', description: 'Balıklar hakkında', image: '/src/assets/images/story6.png', level: 6, locked: true },
    { id: 7, title: 'Kayıp Ayakkabı', description: 'Fareler hakkında', image: '/src/assets/images/story7.png', level: 7, locked: true },
    { id: 8, title: 'Karlı Dağlar', description: 'Tilki ve geyikler hakkında', image: '/src/assets/images/story8.png', level: 8, locked: true },
    { id: 9, title: 'Uçan Bisiklet', description: 'Hayal gücüyle yolculuk', image: '/src/assets/images/story9.png', level: 9, locked: true },
    { id: 10, title: 'Zaman Makinesi', description: 'Geleceğe yolculuk', image: '/src/assets/images/story10.png', level: 10, locked: true }
];

export default function App() {
    const dispatch = useDispatch<AppDispatch>();
    const teacher = useSelector((state: RootState) => state.user.teacher);
    const student = useSelector((state: RootState) => state.user.student);
    const [showStudentSelector, setShowStudentSelector] = useState(false);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);

    useEffect(() => { applyTypography(); }, []);

    // Restore session from localStorage on app mount
    useEffect(() => {
        const savedTeacher = localStorage.getItem('dost_teacher');
        const savedStudent = localStorage.getItem('dost_student');

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

    if (!sessionLoaded) {
        return null;
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
                        <Route path="/level/:level/completion" element={<Completion />} />
                        <Route path="/level:level/step:step" element={<LevelRouter />} />
                        <Route path="/level/:level/step/:step" element={<LevelRouter />} />
                        <Route path="/story/:id/read" element={<ReadingScreen stories={stories} />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}
