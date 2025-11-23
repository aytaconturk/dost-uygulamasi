import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStepContext } from '../../contexts/StepContext';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { updateStudentProgressStep, awardPoints } from '../../lib/supabase';
import { calculatePointsForLevel } from '../../lib/points';

const completionText = 'Metnin görselini inceleme, Metnin başlığını inceleme, Metnin içindeki cümlelerden bazılarını okuma ve tahminde bulunma, okuma amacı görevlerini gerçekleştirerek 1. Seviyemizi tamamladık seni tebrik ediyorum.';

export default function Step5() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { storyId, onStepCompleted } = useStepContext();
  const student = useSelector((state: RootState) => state.user.student);
  const finalStoryId = storyId || Number(searchParams.get('storyId')) || 1;
  const [isCompleting, setIsCompleting] = useState(false);

  const confettiPieces = useMemo(() => {
    const lefts = [2,8,14,20,26,32,38,44,50,56,62,68,74,80,86,92];
    const durations = ['confetti-dur-3','confetti-dur-4','confetti-dur-5','confetti-dur-6'];
    const delays = ['confetti-delay-0','confetti-delay-2','confetti-delay-4','confetti-delay-6','confetti-delay-8'];
    const colors = ['bg-red-500','bg-yellow-400','bg-green-500','bg-blue-500','bg-pink-500','bg-purple-500'];
    const arr: { cls: string }[] = [];
    for (let i = 0; i < 64; i++) {
      const l = lefts[i % lefts.length];
      const c = colors[i % colors.length];
      const d = durations[i % durations.length];
      const de = delays[i % delays.length];
      arr.push({ cls: `confetti-piece confetti-l-${l} ${c} ${d} ${de}` });
    }
    return arr;
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-0 confetti pointer-events-none" aria-hidden>
        {confettiPieces.map((p, i) => (
          <div key={i} className={p.cls}></div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center text-center bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 md:p-12 max-w-3xl mx-auto mt-6">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-3xl font-extrabold text-purple-800 mb-2">Tebrikler!</h3>
        <p className="text-lg text-gray-700 mb-1">1. Seviye başarıyla tamamlandı.</p>
        <p className="text-base text-gray-600 max-w-2xl">{completionText}</p>
        <div className="mt-6 flex gap-3">
          <button 
            onClick={async () => {
              if (!student) {
                alert('Öğrenci bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
                navigate('/');
                return;
              }

              if (isCompleting) return; // Prevent double click

              setIsCompleting(true);
              
              try {
                console.log('🎯 Starting level 1 completion...', { studentId: student.id, storyId: finalStoryId });

                // Mark step as completed
                if (onStepCompleted) {
                  console.log('📝 Marking step 5 as completed...');
                  await onStepCompleted({ level: 1, completed: true });
                  console.log('✅ Step 5 marked as completed');
                }

                // Award points and update progress in ONE operation to avoid race conditions
                const points = calculatePointsForLevel(1, 5);
                console.log('💰 Awarding points and updating progress...', { points });
                
                // First award points
                const pointsResult = await awardPoints(student.id, finalStoryId, points, 'Seviye 1 tamamlandı');
                
                if (pointsResult.error) {
                  console.error('❌ Points error:', pointsResult.error);
                  alert(`Puan verilirken hata oluştu: ${pointsResult.error.message || 'Bilinmeyen hata'}`);
                } else {
                  console.log('✅ Points awarded successfully:', pointsResult.data);
                }

                // Wait to ensure points are saved to database
                await new Promise(resolve => setTimeout(resolve, 300));

                // Now update progress to level 2 (this will preserve the points we just awarded)
                console.log('📊 Updating progress to level 2...');
                const progressResult = await updateStudentProgressStep(
                  student.id, 
                  finalStoryId, 
                  2, // currentLevel: move to level 2
                  1, // currentStep: start at step 1 of level 2
                  1  // completedLevel: mark level 1 as completed
                );
                
                if (progressResult.error) {
                  console.error('❌ Progress update error:', progressResult.error);
                  alert(`İlerleme güncellenirken hata oluştu: ${progressResult.error.message || 'Bilinmeyen hata'}`);
                } else {
                  console.log('✅ Progress updated successfully:', progressResult.data);
                  // Dispatch custom event to refresh progress data
                  window.dispatchEvent(new Event('progressUpdated'));
                }

                // Navigate to level 2 intro screen
                console.log('🚀 Navigating to level 2 intro...');
                navigate(`/level/2/intro?storyId=${finalStoryId}`);
              } catch (err: any) {
                console.error('❌ Error completing level 1:', err);
                alert(`Hata oluştu: ${err.message || 'Bilinmeyen hata'}. Lütfen tekrar deneyin.`);
                // Navigate anyway
                navigate('/');
              } finally {
                setIsCompleting(false);
              }
            }} 
            disabled={isCompleting}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold"
          >
            {isCompleting ? 'İşleniyor...' : '2. Seviyeye Geç'}
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}
