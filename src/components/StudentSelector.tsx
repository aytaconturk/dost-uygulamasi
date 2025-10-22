import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setStudent, setError, setLoading, clearUser } from '../store/userSlice';
import { supabase, type Student } from '../lib/supabase';
import type { RootState, AppDispatch } from '../store/store';

type Props = {
  onStudentSelected: () => void;
};

export default function StudentSelector({ onStudentSelected }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const teacher = useSelector((state: RootState) => state.user.teacher);
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setLocalError] = useState('');
  const [loading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (!teacher) return;

    const fetchStudents = async () => {
      setLocalLoading(true);
      try {
        console.log('[StudentSelector] Fetching students for teacher:', teacher.id);
        const { data, error: queryError } = await supabase
          .from('students')
          .select('*')
          .eq('teacher_id', teacher.id);

        console.log('[StudentSelector] Query result:', { data, queryError });

        if (queryError) throw queryError;
        setStudents(data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Öğrenciler yüklenemedi';
        console.error('[StudentSelector] Error:', err);
        setLocalError(message);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchStudents();
  }, [teacher]);

  const handleSelectStudent = (student: Student) => {
    dispatch(setStudent(student));
    localStorage.setItem('dost_student', JSON.stringify(student));
    onStudentSelected();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !newStudentFirstName || !newStudentLastName) return;

    setLocalLoading(true);
    try {
      console.log('[StudentSelector] Adding new student:', { newStudentFirstName, newStudentLastName });
      const { data, error: insertError } = await supabase
        .from('students')
        .insert({
          teacher_id: teacher.id,
          first_name: newStudentFirstName,
          last_name: newStudentLastName,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('[StudentSelector] Student added:', data);
      setStudents([...students, data]);
      setNewStudentFirstName('');
      setNewStudentLastName('');
      setShowAddForm(false);
      setLocalError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Öğrenci eklenemedi';
      console.error('[StudentSelector] Error adding student:', err);
      setLocalError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">DOST</h1>
            <p className="text-gray-600">Hoşgeldiniz, {teacher?.name}</p>
          </div>
          <button
            onClick={() => {
              dispatch(clearUser());
              localStorage.removeItem('dost_teacher');
              localStorage.removeItem('dost_student');
            }}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Çıkış Yap
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Öğrenci Seç</h2>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6">Henüz öğrenci eklenmemiş</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition duration-200 text-left"
              >
                <h3 className="font-bold text-gray-800 text-lg">{student.first_name} {student.last_name}</h3>
              </button>
            ))}
          </div>
        )}

        <div className="border-t pt-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              + Yeni Öğrenci Ekle
            </button>
          ) : (
            <form onSubmit={handleAddStudent} className="space-y-4">
              <h3 className="font-bold text-gray-800">Yeni Öğrenci Ekle</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad
                </label>
                <input
                  type="text"
                  value={newStudentFirstName}
                  onChange={(e) => setNewStudentFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Adı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad
                </label>
                <input
                  type="text"
                  value={newStudentLastName}
                  onChange={(e) => setNewStudentLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Soyadı"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewStudentFirstName('');
                    setNewStudentLastName('');
                    setLocalError('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
