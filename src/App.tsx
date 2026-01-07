import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import StoryList from './components/StoryList';
import LevelIntro from './components/LevelIntro';
import ReadingScreen from './components/ReadingScreen';
import Header from './components/Header';
import TeacherLogin from './components/TeacherLogin';
import StudentSelector from './components/StudentSelector';
import AdminPanel from './components/AdminPanel';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import PractitionerInfoScreen from './components/PractitionerInfoScreen';
import Level1Completion from './levels/level1/Completion';
import Level2Completion from './levels/level2/Completion';
import Level3Completion from './levels/level3/Completion';
import './index.css';
import LevelRouter from './levels/LevelRouter';
import StoryCompletion from './components/StoryCompletion';
import MaskotTest from './pages/MaskotTest';
import { useEffect, useState } from 'react';
import { applyTypography } from './lib/settings';
import { setRole, setTeacher, setStudent } from './store/userSlice';
import type { RootState, AppDispatch } from './store/store';
import { getStories } from './lib/supabase';
import story1Image from './assets/images/story1.png';
import story2Image from './assets/images/story2.png';
import story3Image from './assets/images/story3.png';
import story4Image from './assets/images/story4.png';
import story5Image from './assets/images/story5.png';

// Map story IDs to their imported images
const STORY_IMAGES: Record<number, string> = {
  1: story1Image,
  2: story2Image,
  3: story3Image,
  4: story4Image,
  5: story5Image,
};

type Story = {
  id: number;
  title: string;
  description: string;
  image: string;
  locked?: boolean;
};

// Fallback stories when Supabase is not available
const FALLBACK_STORIES: Story[] = [
  {
    id: 1,
    title: 'Kırıntıların Kahramanları',
    description: 'Karıncaların yaşamı, fiziksel özellikleri ve çevreye etkileri hakkında bilgi edinin.',
    image: story1Image,
    locked: false
  },
  {
    id: 2,
    title: 'Avucumun İçindeki Akıllı Kutu',
    description: 'Akıllı telefonların kullanım amaçları, çalışma prensipleri ve üretim süreçleri.',
    image: story2Image,
    locked: false
  },
  {
    id: 3,
    title: 'Hurma Ağacı',
    description: 'Hurma ağacının yetişme koşulları, görünümü ve çevreye etkileri hakkında bilgiler.',
    image: story3Image,
    locked: false
  },
  {
    id: 4,
    title: 'Akdeniz Bölgesi',
    description: 'Akdeniz Bölgesi\'nin iklimi, bitki örtüsü, yeryüzü şekilleri ve ekonomik faaliyetleri.',
    image: story4Image,
    locked: false
  },
  {
    id: 5,
    title: 'Çöl Gemisi',
    description: 'Develerin yaşam koşulları, fiziksel özellikleri, beslenme ve çoğalma şekilleri.',
    image: story5Image,
    locked: false
  }
];

function CompletionRouter() {
  const { level } = useParams<{ level: string }>();

  if (level === '2') {
    return <Level2Completion />;
  }
  if (level === '3') {
    return <Level3Completion />;
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
    const [showPractitionerInfo, setShowPractitionerInfo] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [stories, setStories] = useState<Story[]>([]);
    const [storiesLoading, setStoriesLoading] = useState(true);

    // Uygulama başladığında test audio global key'ini temizle - checkbox her zaman tiksiz başlasın
    useEffect(() => {
        localStorage.removeItem('use_test_audio_global');
        console.log('🔄 App başlatıldı - test audio sıfırlandı');
    }, []);

    useEffect(() => { applyTypography(); }, []);

    // Fetch stories from Supabase
    useEffect(() => {
        const fetchStories = async () => {
            try {
                const { data, error } = await getStories();
                if (error) throw error;
                // If we got data from Supabase, use it with proper images
                if (data && data.length > 0) {
                    // Override images with locally imported ones (Supabase may have old paths)
                    const storiesWithImages = data.map((story: Story) => ({
                        ...story,
                        image: STORY_IMAGES[story.id] || story.image
                    }));
                    setStories(storiesWithImages);
                } else {
                    // If no data from Supabase, use fallback
                    console.warn('No stories from Supabase, using fallback data');
                    setStories(FALLBACK_STORIES);
                }
            } catch (err) {
                console.error('Failed to fetch stories from Supabase, using fallback data:', err);
                // Use fallback stories when Supabase is not available
                setStories(FALLBACK_STORIES);
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
        return <StudentSelector onStudentSelected={() => setShowPractitionerInfo(true)} />;
    }

    // Show practitioner info screen if not skipped
    if (showPractitionerInfo) {
        const handlePractitionerContinue = (practitionerName: string) => {
            // Save practitioner info (can be saved to Supabase later)
            localStorage.setItem('dost_practitioner', practitionerName);
            setShowPractitionerInfo(false);
        };

        const handlePractitionerSkip = () => {
            localStorage.removeItem('dost_practitioner');
            setShowPractitionerInfo(false);
        };

        return (
            <PractitionerInfoScreen
                onContinue={handlePractitionerContinue}
                onSkip={handlePractitionerSkip}
            />
        );
    }

    return (
        <Router basename={import.meta.env.BASE_URL}>
            <div className="space-background min-h-screen bg-cover bg-center relative">
                {/* Header */}
                <Header stories={stories} />

                {/* Routes */}
                <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-8 md:py-10">
                    <Routes>
                        <Route path="/" element={<StoryList stories={stories} />} />
                        <Route path="/maskot_test" element={<MaskotTest />} />
                        <Route path="/level/:level/intro" element={<LevelIntro />} />
                        <Route path="/level/:level/completion" element={<CompletionRouter />} />
                        <Route path="/level:level/step:step" element={<LevelRouter />} />
                        <Route path="/level/:level/step/:step" element={<LevelRouter />} />
                        <Route path="/story/:id/read" element={<ReadingScreen stories={stories} />} />
                        <Route path="/story/:id/completion" element={<StoryCompletion />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}
