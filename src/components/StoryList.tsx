import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, CheckCircle } from 'lucide-react';
import { useReadingProgress } from '../hooks/useReadingProgress';

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
    const { getCurrentLevel, isStoryCompleted } = useReadingProgress();

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
                {stories.map((story) => (
                    story.locked ? (
                        <div
                            key={story.id}
                            className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 min-w-[240px] max-w-[280px] bg-white text-black rounded-xl shadow-md opacity-80 blur-[1px]"
                        >
                            <div className="w-full h-40 overflow-hidden rounded-t-xl relative">
                                <img
                                    src={story.image}
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
                            to={getCurrentLevel(story.id) === 1 ? `/story/${story.id}` : `/level/${getCurrentLevel(story.id)}/step/1`}
                            className="relative w-full sm:w-1/2 md:w-1/3 lg:w-1/4 min-w-[240px] max-w-[280px] bg-white text-black rounded-xl shadow-md hover:scale-105 transition-transform"
                        >
                            <div className="w-full h-40 overflow-hidden rounded-t-xl relative">
                                <img
                                    src={story.image}
                                    alt={story.title}
                                    className="w-full h-full object-cover"
                                />
                                {isStoryCompleted(story.id) ? (
                                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                                        <CheckCircle size={24} className="text-white" />
                                    </div>
                                ) : (
                                    <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[40px] border-l-[40px] border-b-[#7986CB] border-l-transparent">
                                        <div className="absolute -bottom-[28px] right-[2px] text-white text-xs font-bold leading-none">
                                            {Math.min(getCurrentLevel(story.id), 5)}/5
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-md text-[#512DA8]">{story.title}</h3>
                                <p className="text-sm text-gray-600">{story.description}</p>
                                {!isStoryCompleted(story.id) && (
                                    <p className="text-xs text-purple-600 mt-1 font-semibold">
                                        Seviye {getCurrentLevel(story.id)}/5
                                    </p>
                                )}
                            </div>
                        </Link>
                    )
                ))}
            </div>
        </div>
    );
}
