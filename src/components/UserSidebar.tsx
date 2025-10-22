import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearUser, setStudent } from '../store/userSlice';
import type { RootState, AppDispatch } from '../store/store';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UserSidebar({ open, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const teacher = useSelector((state: RootState) => state.user.teacher);
  const student = useSelector((state: RootState) => state.user.student);

  const handleLogout = () => {
    dispatch(clearUser());
    localStorage.removeItem('dost_teacher');
    localStorage.removeItem('dost_student');
    onClose();
    navigate('/');
  };

  const handleChangeStudent = () => {
    dispatch(setStudent(null));
    localStorage.removeItem('dost_student');
    onClose();
  };

  return open ? (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#512DA8]">Profil</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="space-y-6 flex-1">
          {teacher && (
            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Öğretmen</p>
              <h3 className="text-lg font-bold text-purple-800">{teacher.name}</h3>
              <p className="text-sm text-gray-600">{teacher.email}</p>
            </div>
          )}

          {student && (
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Öğrenci</p>
              <h3 className="text-lg font-bold text-blue-800">{student.first_name} {student.last_name}</h3>
              <p className="text-xs text-gray-500 mt-1">ID: {student.id}</p>
            </div>
          )}

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold mb-2">Oturum Bilgisi:</p>
            <ul className="space-y-1 text-xs">
              <li>🔒 Verileriniz Supabase'de güvenli şekilde saklanmaktadır</li>
              <li>📊 Tüm ilerleme ve okuma değerlendirmeleri otomatik kaydedilir</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={handleChangeStudent}
            className="w-full px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            Öğrenci Değiştir
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>
    </div>
  ) : null;
}
