import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
export default function StoryIntro({ stories }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const story = stories.find((s) => s.id === Number(id));
    if (!story)
        return <p>Hikaye bulunamadı</p>;
    return (<div className="max-w-5xl mx-auto mt-5 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white bg-opacity-90 rounded-xl p-6 shadow-xl">
      <img src={story.image} alt={story.title} className="w-full rounded-xl"/>
      <div>
        <h2 className="text-3xl font-bold mb-4">{story.title}</h2>
        <div className="flex flex-wrap gap-2 text-sm mb-4">
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Seviye 1</span>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Düzeyli Okuma</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">Yazar: DOST AI • Yayın: Yapay Zeka Kitaplığı</p>
        <button onClick={() => navigate(`/story/${story.id}/read`)} className="bg-green-500 cursor-pointer text-white py-2 px-6 rounded-full shadow hover:bg-green-600">
          Başla
        </button>
        <button onClick={() => navigate('/')} className="block cursor-pointer mt-4 text-sm underline text-gray-500">
          ← Geri dön
        </button>
      </div>
    </div>);
}
