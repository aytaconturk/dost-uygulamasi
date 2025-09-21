import React, { useEffect, useState } from 'react';
import { applyTypography, setFontKey, setSizeStep, SIZE_STEPS_PX, type FontKey } from '../lib/settings';

export default function TypographySettings() {
  const [fontKey, setFontKeyState] = useState<FontKey>(() => {
    try { return (sessionStorage.getItem('ui_font_family') as FontKey) || 'fredoka'; } catch { return 'fredoka'; }
  });
  const [sizeStep, setSizeStepState] = useState<number>(() => {
    try { const v = Number(sessionStorage.getItem('ui_font_size_step')); return Number.isFinite(v) ? v : 1; } catch { return 1; }
  });

  useEffect(() => { applyTypography(); }, []);

  const onFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value as FontKey;
    setFontKeyState(key);
    setFontKey(key);
  };

  const inc = () => {
    const next = Math.min(sizeStep + 1, SIZE_STEPS_PX.length - 1);
    setSizeStepState(next);
    setSizeStep(next);
  };
  const dec = () => {
    const next = Math.max(sizeStep - 1, 0);
    setSizeStepState(next);
    setSizeStep(next);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Yazı Biçimi</h3>
      <label className="block text-xs text-gray-600 mb-1">Font</label>
      <select value={fontKey} onChange={onFontChange} className="w-full border border-gray-300 rounded-lg p-2 mb-3">
        <option value="fredoka">Fredoka</option>
        <option value="comic">Comic Neue</option>
        <option value="nunito">Nunito</option>
        <option value="quicksand">Quicksand</option>
      </select>

      <label className="block text-xs text-gray-600 mb-1">Yazı Boyutu</label>
      <div className="flex items-center gap-2">
        <button onClick={dec} className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-3 py-2">−</button>
        <div className="text-sm text-gray-700">Adım: {sizeStep + 1} (≈{SIZE_STEPS_PX[sizeStep]}px)</div>
        <button onClick={inc} className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg px-3 py-2">+</button>
      </div>
      <div className="mt-2 text-xs text-gray-600">Örnek: <span className="font-semibold">Aa Bb Çç Ğğ İi Şş</span></div>
    </div>
  );
}
