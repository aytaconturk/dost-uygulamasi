import { useEffect, useState } from 'react';
import type { ChildUser } from '../lib/user';
import { generateUserId, getUser, setUser } from '../lib/user';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UserSidebar({ open, onClose }: Props) {
  const [form, setForm] = useState<ChildUser>({ firstName: '', lastName: '', teacher: '', userId: '', password: '' });

  useEffect(() => {
    if (open) {
      const u = getUser();
      if (u) setForm(u);
    }
  }, [open]);

  const setField = (k: keyof ChildUser, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    const userId = form.userId || generateUserId();
    const next: ChildUser = { ...form, userId };
    setUser(next);
    onClose();
  };

  const ensureId = () => {
    if (!form.userId) setField('userId', generateUserId());
  };

  return open ? (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#512DA8]">Kullanıcı</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Ad</label>
            <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Soyad</label>
            <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Öğretmen</label>
            <input value={form.teacher} onChange={(e) => setField('teacher', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">User ID</label>
            <div className="flex gap-2">
              <input value={form.userId} onChange={(e) => setField('userId', e.target.value)} className="flex-1 border border-gray-300 rounded-lg p-2" />
              <button onClick={ensureId} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Üret</button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Şifre</label>
            <input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2" />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Vazgeç</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white">Kaydet</button>
        </div>

        <div className="mt-4 text-xs text-gray-600">
          Kaydedilen bilgiler bu oturumda saklanır.
        </div>
      </aside>
    </div>
  ) : null;
}
