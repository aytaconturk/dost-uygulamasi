import React, { useEffect, useState } from 'react';
import { getApiBase, getApiEnv, setApiEnv, type ApiEnv } from '../lib/api';
import TypographySettings from './SidebarSettingsTypography';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SidebarSettings({ open, onClose }: Props) {
  const [env, setEnv] = useState<ApiEnv>(getApiEnv());

  useEffect(() => {
    setEnv(getApiEnv());
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = (e.target.value as ApiEnv);
    setEnv(next);
    setApiEnv(next);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 p-4 flex flex-col">
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
              <div className="mt-3 text-xs text-gray-600 break-all">
                Aktif temel adres: <span className="font-semibold text-[#512DA8]">{getApiBase()}</span>
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
