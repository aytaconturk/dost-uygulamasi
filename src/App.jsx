import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import StoryList from './components/StoryList';
import StoryIntro from './components/StoryIntro';
import ReadingScreen from './components/ReadingScreen';
import Header from './components/Header';
import './index.css';
import Level1Steps from './components/Level1Steps';
import LevelRouter from './levels/LevelRouter';
const stories = [
    { id: 1, title: 'Oturum 1: Kırıntıların Kahramanları', description: 'Karıncalar hakkında', image: '/src/assets/images/story1.png', level: 1 },
    { id: 2, title: 'Çöl Gemisi', description: 'Develer hakkında', image: '/src/assets/images/story2.png', level: 2 },
    { id: 3, title: 'Fındık Canavarları', description: 'Sincaplar hakkında', image: '/src/assets/images/story3.png', level: 3 },
    { id: 4, title: 'Orman Macerası', description: 'Ayılar hakk��nda', image: '/src/assets/images/story4.png', level: 4, locked: true },
    { id: 5, title: 'Gökyüzü Yolcuları', description: 'Kuşlar hakkında', image: '/src/assets/images/story5.png', level: 5, locked: true },
    { id: 6, title: 'Deniz Altı Krallığı', description: 'Balıklar hakkında', image: '/src/assets/images/story6.png', level: 6, locked: true },
    { id: 7, title: 'Kayıp Ayakkabı', description: 'Fareler hakkında', image: '/src/assets/images/story7.png', level: 7, locked: true },
    { id: 8, title: 'Karlı Dağlar', description: 'Tilki ve geyikler hakkında', image: '/src/assets/images/story8.png', level: 8, locked: true },
    { id: 9, title: 'Uçan Bisiklet', description: 'Hayal gücüyle yolculuk', image: '/src/assets/images/story9.png', level: 9, locked: true },
    { id: 10, title: 'Zaman Makinesi', description: 'Geleceğe yolculuk', image: '/src/assets/images/story10.png', level: 10, locked: true }
];
// Global audio cleanup function
function stopAllAudio() {
    console.log('🌐 Global audio cleanup: Stopping all audio elements');

    // Stop all Audio elements in the document
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    });

    // Stop all video elements too
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
        if (!video.paused) {
            video.pause();
            video.currentTime = 0;
        }
    });
}

function AppContent() {
    const location = useLocation();

    // Stop all audio when route changes
    useEffect(() => {
        stopAllAudio();
    }, [location.pathname]);

    return (
        <div className="space-background min-h-screen bg-cover bg-center relative">
            {/* Header */}
            <Header stories={stories}/>

            {/* Routes */}
            <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-8 md:py-10">
                <Routes>
                    <Route path="/" element={<StoryList stories={stories}/>}/>
                    <Route path="/story/:id" element={<StoryIntro stories={stories}/>}/>
                    <Route path="/story/1/read" element={<Level1Steps />} />
                    <Route path="/level:level/step:step" element={<LevelRouter />} />
                    <Route path="/level/:level/step/:step" element={<LevelRouter />} />
                    <Route path="/story/:id/read" element={<ReadingScreen stories={stories}/>}/>
                </Routes>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}
