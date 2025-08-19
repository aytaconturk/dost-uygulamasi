import { useLocation } from 'react-router-dom';
export default function Header({ stories }) {
    const location = useLocation();
    const match = location.pathname.match(/^\/story\/(\d+)\/read$/);
    const storyId = match ? parseInt(match[1]) : null;
    const story = stories.find(s => s.id === storyId);
    return (<header className="flex items-center justify-between p-4 bg-[#9575CD] text-white shadow-md">
            <div className="flex items-center gap-2">
                <button className="text-2xl font-bold">☰</button>
                <span className="text-xl font-semibold">DOST</span>
            </div>

            {story && (<div className="text-md font-semibold text-gray-800 text-center">
                    {story.title}
                </div>)}


            <div>
                <button className="w-10 h-10 rounded-full bg-white text-green-600 font-bold flex items-center justify-center">
                    👤
                </button>
            </div>
        </header>);
}
