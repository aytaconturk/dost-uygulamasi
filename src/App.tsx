import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import StoryList from './components/StoryList';
import StoryIntro from './components/StoryIntro';
import ReadingScreen from './components/ReadingScreen';
import Header from './components/Header';
import TeacherLogin from './components/TeacherLogin';
import StudentSelector from './components/StudentSelector';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import Level1Completion from './levels/level1/Completion';
import Level2Completion from './levels/level2/Completion';
import './index.css';
import LevelRouter from './levels/LevelRouter';
import { useEffect, useState } from 'react';
import { applyTypography } from './lib/settings';
import { setTeacher, setStudent } from './store/userSlice';
import type { RootState, AppDispatch } from './store/store';

const stories = [
    { id: 1, title: 'Kırıntıların Kahramanları', description: '', image: '/src/assets/images/story1.png', level: 1 },
    { id: 2, title: 'Avucumun İçindeki Akıllı Kutu', description: '', image: '/src/assets/images/story2.png', level: 2 },
    { id: 3, title: 'Çöl Şekerlemesi', description: '', image: '/src/assets/images/story3.png', level: 3 },
    { id: 4, title: 'Turizmin İncisi', description: '', image: '/src/assets/images/story4.png', level: 4 },
    { id: 5, title: 'Çöl Gemisi', description: '', image: '/src/assets/images/story5.png', level: 5 },
    { id: 6, title: 'Hayal Gibi Gerçek', description: '', image: '/src/assets/images/story6.png', level: 1, locked: true },
    { id: 7, title: 'Kaktüslerin Dikenli Yaşamı', description: '', image: '/src/assets/images/story7.png', level: 2, locked: true },
    { id: 8, title: 'Dağların Diyarı', description: '', image: '/src/assets/images/story8.png', level: 3, locked: true },
    { id: 9, title: 'Fındık Canavarları', description: '', image: '/src/assets/images/story9.png', level: 4, locked: true },
    { id: 10, title: 'Kolumuzdaki Süper Kahraman', description: '', image: '/src/assets/images/story10.png', level: 5, locked: true },
    { id: 11, title: 'Kırmızı Tatlı Boncuklar', description: '', image: '/src/assets/images/story11.png', level: 1, locked: true },
    { id: 12, title: 'Ekonominin Kalbi', description: '', image: '/src/assets/images/story12.png', level: 2, locked: true },
    { id: 13, title: 'Uzun Bacaklı Gezgin Kuş', description: '', image: '/src/assets/images/story13.png', level: 3, locked: true },
    { id: 14, title: 'Metal Dostlar', description: '', image: '/src/assets/images/story14.png', level: 4, locked: true },
    { id: 15, title: 'Küçük Avcılar', description: '', image: '/src/assets/images/story15.png', level: 5, locked: true },
    { id: 16, title: 'Güzel Sahiller Diyarı', description: '', image: '/src/assets/images/story16.png', level: 1, locked: true },
    { id: 17, title: 'Ormanların Akrobatı', description: '', image: '/src/assets/images/story17.png', level: 2, locked: true },
    { id: 18, title: 'Hayal Et, Gerçekleştir', description: '', image: '/src/assets/images/story18.png', level: 3, locked: true },
    { id: 19, title: 'Kırmızı Lezzetli Kalpler', description: '', image: '/src/assets/images/story19.png', level: 4, locked: true },
    { id: 20, title: 'Hirçın Dalgalar', description: '', image: '/src/assets/images/story20.png', level: 5, locked: true },
    { id: 21, title: 'Sekiz Kollu Balon Kafa', description: '', image: '/src/assets/images/story21.png', level: 1, locked: true },
    { id: 22, title: 'Dokundukça Başlayan Maceralar', description: '', image: '/src/assets/images/story22.png', level: 2, locked: true },
    { id: 23, title: 'Yaz Meyvelerinin Kralı', description: '', image: '/src/assets/images/story23.png', level: 3, locked: true },
    { id: 24, title: 'Lezzet Diyarı', description: '', image: '/src/assets/images/story24.png', level: 4, locked: true }
];

function CompletionRouter() {
  const { level } = useParams<{ level: string }>();

  if (level === '2') {
    return <Level2Completion />;
  }
  return <Level1Completion />;
}

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
