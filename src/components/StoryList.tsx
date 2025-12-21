import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { getAppMode } from '../lib/api';
import { getStoryImageUrl } from '../lib/image-utils';

interface Story {
    id: number;
    title: string;
    description: string;
    image: string;
    locked?: boolean;
}

export default function StoryList({ stories }: { stories: Story[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showPrev, setShowPrev] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const location = useLocation();
    const { getCurrentLevel, isStoryCompleted, refresh } = useReadingProgress();
    
    // Refresh progress when navigating back to dashboard
    useEffect(() => {
        if (location.pathname === '/') {
            refresh();
        }
    }, [location.pathname, refresh]);

    // Check if a story should be locked based on previous story completion
    // Only in prod mode - dev mode allows all stories to be unlocked
    const isStoryLocked = (storyId: number): boolean => {
        const appMode = getAppMode();
        
        // In dev mode, all stories are unlocked
        if (appMode === 'dev') return false;
        
        // First story (id: 1) is always unlocked
        if (storyId === 1) return false;
        
        // Check if previous story is completed
        const previousStoryId = storyId - 1;
        const previousStoryCompleted = isStoryCompleted(previousStoryId);
        
        // Lock if previous story is not completed (only in prod mode)
        return !previousStoryCompleted;
    };

    useEffect(() => {
        const checkScroll = () => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                setShowPrev(scrollLeft > 0);
                setShowNext(scrollLeft + clientWidth < scrollWidth);
            }
        };
        checkScroll();
        scrollRef.current?.addEventListener('scroll', checkScroll);
        return () => scrollRef.current?.removeEventListener('scroll', checkScroll);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.offsetWidth / 4;
            const { scrollLeft } = scrollRef.current;
            scrollRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="text-white relative">
            <h2 className="text-2xl text-black font-semibold mb-4">Senin İçin</h2>
            {showPrev && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-purple-500 hover:bg-purple-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10"
                >
                    <ChevronLeft size={24} />
                </button>
            )}
            {showNext && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-purple-500 hover:bg-purple-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10"
                >
                    <ChevronRight size={24} />
                </button>
            )}

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 px-12 scroll-smooth [&::-webkit-scrollbar]:hidden scrollbar-hide"
            >
                {stories.map((story) => {
                    // Check if story should be locked (either from DB or sequential lock)
                    const shouldBeLocked = story.locked || isStoryLocked(story.id);
                    
                    return shouldBeLocked ? (
                        <div
                            key={story.id}
                            className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 min-w-[240px] max-w-[280px] bg-white text-black rounded-xl shadow-md opacity-80 blur-[1px]"
                        >
                            <div className="w-full h-40 overflow-hidden rounded-t-xl relative">
                                <img
                                    src={getStoryImageUrl(story.image || `/images/story${story.id}.png`)}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-white bg-opacity-70 p-1 rounded-full">
                                    <Lock size={16} className="text-gray-600" />
                                </div>
                            </div>
                            <div className="p-3 text-gray-400">
                                <h3 className="font-bold text-md">{story.title}</h3>
                                <p className="text-sm">{story.description}</p>
                            </div>
                        </div>
                    ) : (
                        <Link
                            key={story.id}
                            to={isStoryCompleted(story.id) 
                                ? `/story/${story.id}/completion`
                                : `/level/${getCurrentLevel(story.id)}/intro?storyId=${story.id}`
                            }
                            className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 min-w-[240px] max-w-[280px] bg-white text-black rounded-xl shadow-md hover:scale-105 transition-transform"
                        >
                            <div className="w-full h-40 overflow-hidden rounded-t-xl relative">
                                <img
                                    src={getStoryImageUrl(story.image || `/images/story${story.id}.png`)}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                />
                                {isStoryCompleted(story.id) ? (
                                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2 shadow-lg">
                                        <span className="text-2xl">⭐</span>
                                    </div>
                                ) : (
                                    getCurrentLevel(story.id) < 5 && (
                                        <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[40px] border-l-[40px] border-b-[#7986CB] border-l-transparent">
                                            <div className="absolute -bottom-[28px] right-[2px] text-white text-xs font-bold leading-none">
                                                {Math.min(getCurrentLevel(story.id), 5)}/5
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-md text-[#512DA8]">{story.title}</h3>
                                <p className="text-sm text-gray-600">{story.description}</p>
                                {isStoryCompleted(story.id) ? (
                                    <p className="text-xs text-green-600 mt-1 font-semibold">
                                        ✅ Tamamlandı
                                    </p>
                                ) : (
                                    <p className="text-xs text-purple-600 mt-1 font-semibold">
                                        Seviye {getCurrentLevel(story.id)}/5
                                    </p>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
