import { useEffect, useState } from 'react';
import { getApiBase, getApiEnv, setApiEnv, getAppMode, setAppMode, type ApiEnv, type AppMode } from '../lib/api';
import TypographySettings from './SidebarSettingsTypography';

const RECORDING_DURATION_KEY = 'voice_recording_duration_ms';
const PLAYBACK_RATE_KEY = 'audio_playback_rate';

export function getRecordingDuration(): number {
  try {
    const stored = localStorage.getItem(RECORDING_DURATION_KEY);
    return stored ? parseInt(stored, 10) : 10000;
  } catch {
    return 10000;
  }
}

export function setRecordingDuration(ms: number): void {
  try {
    localStorage.setItem(RECORDING_DURATION_KEY, String(ms));
  } catch {}
}

export function getPlaybackRate(): number {
  try {
    const stored = localStorage.getItem(PLAYBACK_RATE_KEY);
    return stored ? parseFloat(stored) : 1.0;
  } catch {
    return 1.0;
  }
}

export function setPlaybackRate(rate: number): void {
  try {
    localStorage.setItem(PLAYBACK_RATE_KEY, String(rate));
    // Apply to all audio elements on the page
    const audioElements = document.querySelectorAll('audio');
    let count = 0;
    audioElements.forEach((audio) => {
      (audio as HTMLAudioElement).playbackRate = rate;
      count++;
    });
    console.log(`🎵 ${count} audio elementine ${rate}x hızı uygulandı`);
    // Dispatch custom event to notify hooks
    window.dispatchEvent(new Event('playbackRateChanged'));
  } catch (err) {
    console.error('❌ Seslendirme hızı ayarlanırken hata:', err);
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SidebarSettings({ open, onClose }: Props) {
  const [env, setEnv] = useState<ApiEnv>(getApiEnv());
  const [appMode, setAppModeState] = useState<AppMode>(getAppMode());
  const [recordingDuration, setRecordingDurationState] = useState<number>(getRecordingDuration());
  const [playbackRate, setPlaybackRateState] = useState<number>(getPlaybackRate());

  useEffect(() => {
    setEnv(getApiEnv());
    setAppModeState(getAppMode());
    setRecordingDurationState(getRecordingDuration());
    setPlaybackRateState(getPlaybackRate());
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = (e.target.value as ApiEnv);
    setEnv(next);
    setApiEnv(next);
  };

  const handleAppModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = (e.target.value as AppMode);
    setAppModeState(next);
    setAppMode(next);
  };

  const handleRecordingDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = parseInt(e.target.value, 10);
    setRecordingDurationState(ms);
    setRecordingDuration(ms);
  };

  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rate = parseFloat(e.target.value);
    console.log('🎵 Seslendirme hızı değiştiriliyor:', rate + 'x');
    setPlaybackRateState(rate);
    setPlaybackRate(rate);
    console.log('✅ Seslendirme hızı güncellendi:', rate + 'x');
  };

  // Format playback rate to match option values (e.g., 5.0 -> "5.0", 1.0 -> "1.0")
  const formatPlaybackRateForSelect = (rate: number): string => {
    // Convert to string with one decimal place to match option values
    return rate.toFixed(1);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 p-4 flex flex-col overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#512DA8]">Ayarlar</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">API Ortamı</label>
              <select value={env} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2">
                <option value="test">Test (root/webhook-test)</option>
                <option value="product">Product (root/webhook)</option>
              </select>
              <div className="mt-3 text-xs text-gray-600 break-words">
                Aktif temel adres: <span className="font-semibold text-[#512DA8] break-all">{getApiBase()}</span>
              </div>
            </div>

            <hr className="my-4" />

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Çalışma Modu</label>
              <select value={appMode} onChange={handleAppModeChange} className="w-full border border-gray-300 rounded-lg p-2">
                <option value="dev">Dev (Hızlı Test Modu)</option>
                <option value="prod">Prod (Normal Çalışma)</option>
              </select>
              <div className="mt-2 text-xs text-gray-600">
                {appMode === 'dev' ? '🔧 Dev: Sesleri atlayabilir, adımları hızlı geçebilirsiniz' : '📚 Prod: Normal ders akışı, tüm sesler oynatılır'}
              </div>
            </div>

            <hr className="my-4" />

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ses Kaydı Süresi (saniye)</label>
              <input
                type="number"
                min="3"
                max="60"
                step="1"
                value={recordingDuration / 1000}
                onChange={(e) => handleRecordingDurationChange({ ...e, target: { ...e.target, value: String(parseInt(e.target.value, 10) * 1000) } } as any)}
                className="w-full border border-gray-300 rounded-lg p-2"
              />
              <p className="mt-2 text-xs text-gray-600">
                Ses kaydı {recordingDuration / 1000} saniye sonra otomatik olarak gönderilir.
              </p>
            </div>

            <hr className="my-4" />

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Seslendirme Hızı</label>
              <select 
                value={formatPlaybackRateForSelect(playbackRate)} 
                onChange={handlePlaybackRateChange} 
                className="w-full border border-gray-300 rounded-lg p-2 bg-white"
              >
                <option value="0.5">0.5x (Yavaş)</option>
                <option value="0.75">0.75x</option>
                <option value="1.0">1x (Normal)</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2.0">2x</option>
                <option value="2.5">2.5x</option>
                <option value="3.0">3x</option>
                <option value="4.0">4x</option>
                <option value="5.0">5x</option>
                <option value="10.0">10x (Çok Hızlı)</option>
              </select>
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800 font-medium">
                  ✅ Aktif: {playbackRate}x hızında çalışıyor
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Tüm seslendirmeler bu hızda oynatılacak. Hem Dev hem Prod modunda çalışır.
                </p>
              </div>
            </div>

            <hr className="my-4" />

            <TypographySettings />
          </aside>
        </div>
      )}
    </>
  );
}
