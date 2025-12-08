import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  supabase, 
  getStories, 
  createStory, 
  updateStory, 
  deleteStory,
  getComprehensionQuestionsByStory,
  createComprehensionQuestion,
  updateComprehensionQuestion,
  deleteComprehensionQuestion,
  type ComprehensionQuestion
} from '../lib/supabase';
import { generateVoice, uploadAudioToSupabase } from '../lib/voiceGenerator';
import type { Teacher, Student, ActivityLog } from '../lib/supabase-types';
import { signOut } from '../lib/auth';
import { clearUser } from '../store/userSlice';
import type { AppDispatch } from '../store/store';

type TabType = 'teachers' | 'students' | 'logs' | 'stories';

export default function AdminPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<TabType>('teachers');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeachers();
    } else if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'logs') {
      fetchActivityLogs();
    }
  }, [activeTab]);

  // Note: Stories tab has its own fetch logic within StoriesTab component

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*, users(email)')
        .order('created_at', { ascending: false });

      if (!error) {
        setTeachers(data || []);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, users(email), teachers(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (!error) {
        setStudents(data || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!error) {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }

    // Clear Redux state
    dispatch(clearUser());

    // Clear localStorage
    localStorage.removeItem('dost_role');
    localStorage.removeItem('dost_teacher');
    localStorage.removeItem('dost_student');

    // Redirect to home
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Paneli</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex gap-8">
          {(['teachers', 'students', 'logs', 'stories'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-semibold transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              {tab === 'teachers' && 'Öğretmenler'}
              {tab === 'students' && 'Öğrenciler'}
              {tab === 'logs' && 'Aktivite Günlükleri'}
              {tab === 'stories' && 'Hikayeler'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        ) : activeTab === 'teachers' ? (
          <TeachersTab teachers={teachers} />
        ) : activeTab === 'students' ? (
          <StudentsTab students={students} />
        ) : activeTab === 'logs' ? (
          <LogsTab logs={logs} />
        ) : (
          <StoriesTab />
        )}
      </div>
    </div>
  );
}

function TeachersTab({ teachers }: { teachers: any[] }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ad Soyad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Okul
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Oluşturulma Tarihi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {teachers.map((teacher) => (
            <tr key={teacher.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {teacher.first_name} {teacher.last_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {teacher.users?.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {teacher.school_name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(teacher.created_at).toLocaleDateString('tr-TR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {teachers.length === 0 && (
        <div className="text-center py-8 text-gray-600">Öğretmen bulunamadı</div>
      )}
    </div>
  );
}

function StudentsTab({ students }: { students: any[] }) {
  const [showLevelEditor, setShowLevelEditor] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<string>('');
  const [newLevel, setNewLevel] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stories, setStories] = useState<any[]>([]);
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    if (showLevelEditor) {
      fetchStoriesForEditor();
    }
  }, [showLevelEditor]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentProgress();
    } else {
      setStudentProgress([]);
    }
  }, [selectedStudent]);

  const fetchStoriesForEditor = async () => {
    try {
      const { data, error: err } = await getStories();
      if (err) throw err;
      setStories(data || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Hikayeler yüklenemedi');
    }
  };

  const fetchStudentProgress = async () => {
    if (!selectedStudent) return;
    
    setLoadingProgress(true);
    try {
      const { data, error: err } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', selectedStudent)
        .order('story_id', { ascending: true });

      if (err) throw err;
      setStudentProgress(data || []);
    } catch (err) {
      console.error('Error fetching student progress:', err);
      setStudentProgress([]);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleUpdateLevel = async () => {
    if (!selectedStudent || !selectedStory || !newLevel) {
      setError('Lütfen tüm alanları doldurunuz');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Updating level:', {
        student_id: selectedStudent,
        story_id: parseInt(selectedStory),
        new_level: parseInt(newLevel)
      });

      const { data: existingProgress, error: fetchError } = await supabase
        .from('student_progress')
        .select('id, current_level')
        .eq('student_id', selectedStudent)
        .eq('story_id', parseInt(selectedStory))
        .single();

      console.log('Existing progress:', existingProgress, 'Error:', fetchError);

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      if (!existingProgress) {
        // Initialize progress if it doesn't exist
        const { error: initError } = await supabase
          .from('student_progress')
          .insert({
            student_id: selectedStudent,
            story_id: parseInt(selectedStory),
            current_level: parseInt(newLevel),
            current_step: 1,
            completed_levels: [],
            is_completed: false,
            points: 0,
          });

        if (initError) throw initError;
      } else {
        // Update existing progress
        const { error: updateError } = await supabase
          .from('student_progress')
          .update({
            current_level: parseInt(newLevel),
            current_step: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id)
          .select();

        if (updateError) throw updateError;
      }

      // Verify the update was successful
      const { data: verifyProgress, error: verifyError } = await supabase
        .from('student_progress')
        .select('current_level')
        .eq('student_id', selectedStudent)
        .eq('story_id', parseInt(selectedStory))
        .single();

      if (verifyError) {
        console.error('Verification error:', verifyError);
        throw new Error('Güncelleme doğrulanamadı');
      }

      if (verifyProgress?.current_level !== parseInt(newLevel)) {
        throw new Error('Güncelleme başarısız oldu - seviye değişmedi');
      }

      setSuccess(`Seviye başarıyla güncellendi: Seviye ${newLevel}. Lütfen öğrenci giriş yaptığında sayfayı yenilesin.`);
      console.log('Level update successful:', verifyProgress);
      
      // Refresh progress after update
      await fetchStudentProgress();
      
      // Clear form after a delay
      setTimeout(() => {
        setSelectedStory('');
        setNewLevel('1');
        setSuccess('');
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Güncelleme başarısız oldu';
      setError(message);
      console.error('Error updating level:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => setShowLevelEditor(!showLevelEditor)}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
      >
        {showLevelEditor ? 'İptal' : '⚙️ Seviye Düzenle'}
      </button>

      {showLevelEditor && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-800">Öğrenci Seviyesi Düzenle</h3>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              ✅ {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Seçiniz --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.users?.email})
                </option>
              ))}
            </select>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hikaye</label>
            <select
              value={selectedStory}
              onChange={(e) => {
                setSelectedStory(e.target.value);
                // Auto-fill current level when story is selected
                if (selectedStudent && e.target.value) {
                  const progress = studentProgress.find(
                    p => p.story_id === parseInt(e.target.value)
                  );
                  if (progress) {
                    setNewLevel(progress.current_level.toString());
                  } else {
                    setNewLevel('1');
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Seçiniz --</option>
              {stories.map((story) => {
                const progress = studentProgress.find(p => p.story_id === story.id);
                const currentLevel = progress ? progress.current_level : null;
                return (
                  <option key={story.id} value={story.id}>
                    {story.title} {currentLevel ? `(Mevcut: Seviye ${currentLevel})` : '(Başlanmamış)'}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedStory && selectedStudent && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-blue-800">
                {(() => {
                  const progress = studentProgress.find(
                    p => p.story_id === parseInt(selectedStory)
                  );
                  if (progress) {
                    return `Mevcut Seviye: ${progress.current_level}`;
                  }
                  return 'Bu hikayede henüz ilerleme kaydı yok.';
                })()}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Seviye</label>
            <select
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <button
            onClick={handleUpdateLevel}
            disabled={loading || !selectedStudent || !selectedStory}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? 'Güncelleniyor...' : 'Seviyeyi Güncelle'}
          </button>
        </div>
      )}

      {selectedStudent && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              {students.find(s => s.id === selectedStudent)?.first_name}{' '}
              {students.find(s => s.id === selectedStudent)?.last_name} - Mevcut Seviyeler
            </h3>
          </div>
          {loadingProgress ? (
            <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
          ) : studentProgress.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Bu öğrencinin henüz hiçbir hikayede ilerleme kaydı yok.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hikaye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mevcut Seviye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mevcut Adım
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tamamlanan Seviyeler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentProgress.map((progress) => {
                  const story = stories.find(s => s.id === progress.story_id);
                  return (
                    <tr key={progress.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {story?.title || `Hikaye ${progress.story_id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold">
                          Seviye {progress.current_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        Adım {progress.current_step}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {Array.isArray(progress.completed_levels) && progress.completed_levels.length > 0
                          ? progress.completed_levels.join(', ')
                          : 'Yok'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {progress.points || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {progress.is_completed ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            Tamamlandı
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                            Devam Ediyor
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ad Soyad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Öğretmen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oluşturulma Tarihi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.first_name} {student.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {student.users?.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {student.teachers?.first_name} {student.teachers?.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(student.created_at).toLocaleDateString('tr-TR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="text-center py-8 text-gray-600">Öğrenci bulunamadı</div>
        )}
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktivite Tipi
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hikaye
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Seviye
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Adım
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Zaman
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hata
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {log.activity_type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {log.story_id || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {log.level_id || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {log.step_number || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(log.timestamp).toLocaleString('tr-TR')}
              </td>
              <td className="px-6 py-4 text-sm text-red-600">
                {log.error_message ? (
                  <span className="truncate max-w-xs">{log.error_message}</span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <div className="text-center py-8 text-gray-600">Aktivite kaydı bulunamadı</div>
      )}
    </div>
  );
}

function StoriesTab() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    image: '',
    locked: false,
  });
  const [error, setError] = useState('');
  const [selectedStoryForQuestions, setSelectedStoryForQuestions] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionFormData, setQuestionFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D',
    question_order: 1,
  });
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await getStories();
      if (err) throw err;
      setStories(data || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Hikayeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (selectedStoryForQuestions) {
      fetchQuestions();
    }
  }, [selectedStoryForQuestions]);

  const fetchQuestions = async () => {
    if (!selectedStoryForQuestions) return;
    setLoadingQuestions(true);
    try {
      const { data, error: err } = await getComprehensionQuestionsByStory(selectedStoryForQuestions);
      if (err) throw err;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Sorular yüklenemedi');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await updateStory(editingId, {
          title: formData.title,
          description: formData.description,
          image: formData.image,
          locked: formData.locked,
        });
      } else {
        await createStory(
          parseInt(formData.id),
          formData.title,
          formData.description,
          formData.image,
          formData.locked
        );
      }

      setFormData({ id: '', title: '', description: '', image: '', locked: false });
      setShowForm(false);
      setEditingId(null);
      await fetchStories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'İşlem başarısız oldu';
      setError(message);
    }
  };

  const handleEdit = (story: any) => {
    setFormData({
      id: story.id.toString(),
      title: story.title,
      description: story.description || '',
      image: story.image || '',
      locked: story.locked || false,
    });
    setEditingId(story.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu hikayeyi silmek istediğinize emin misiniz?')) return;

    try {
      await deleteStory(id);
      await fetchStories();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Silme işlemi başarısız oldu';
      setError(message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          setFormData({ id: '', title: '', description: '', image: '', level: '1', locked: false });
          setError('');
        }}
        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
      >
        {showForm ? 'İptal' : '+ Yeni Hikaye Ekle'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-lg font-bold text-purple-800">
            {editingId ? 'Hikayeyi Düzenle' : 'Yeni Hikaye Ekle'}
          </h3>

          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hikaye ID
              </label>
              <input
                type="number"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>

          <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.locked}
                onChange={(e) => setFormData({ ...formData, locked: e.target.checked })}
              />
              <span className="text-sm font-medium text-gray-700">Kilitli</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {editingId ? 'Güncelle' : 'Ekle'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div key={story.id} className="bg-white rounded-lg shadow overflow-hidden">
            {story.image && (
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-purple-800 flex-1">{story.title}</h3>
                {story.locked && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Kilitli
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-3">{story.description}</p>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(story)}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                  >
                    Sil
                  </button>
                </div>
                <button
                  onClick={() => setSelectedStoryForQuestions(story.id)}
                  className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition-colors"
                >
                  📝 Soruları Yönet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Questions Management Modal */}
      {selectedStoryForQuestions && (
        <QuestionsModal
          storyId={selectedStoryForQuestions}
          storyTitle={stories.find(s => s.id === selectedStoryForQuestions)?.title || ''}
          questions={questions}
          loadingQuestions={loadingQuestions}
          onClose={() => {
            setSelectedStoryForQuestions(null);
            setShowQuestionForm(false);
            setEditingQuestionId(null);
            setQuestionFormData({
              question_text: '',
              option_a: '',
              option_b: '',
              option_c: '',
              option_d: '',
              correct_option: 'A',
              question_order: 1,
            });
          }}
          onRefresh={fetchQuestions}
        />
      )}
    </div>
  );
}

function QuestionsModal({
  storyId,
  storyTitle,
  questions,
  loadingQuestions,
  onClose,
  onRefresh,
}: {
  storyId: number;
  storyTitle: string;
  questions: ComprehensionQuestion[];
  loadingQuestions: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionFormData, setQuestionFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A' as 'A' | 'B' | 'C' | 'D',
    question_order: 1,
  });
  const [generatingAudio, setGeneratingAudio] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingQuestionId) {
        await updateComprehensionQuestion(editingQuestionId, questionFormData);
      } else {
        await createComprehensionQuestion(
          storyId,
          questionFormData.question_text,
          questionFormData.option_a,
          questionFormData.option_b,
          questionFormData.option_c,
          questionFormData.option_d,
          questionFormData.correct_option,
          questionFormData.question_order
        );
      }

      setQuestionFormData({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        question_order: questions.length + 1,
      });
      setShowQuestionForm(false);
      setEditingQuestionId(null);
      onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'İşlem başarısız oldu';
      setError(message);
    }
  };

  const handleEditQuestion = (question: ComprehensionQuestion) => {
    setQuestionFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      question_order: question.question_order,
    });
    setEditingQuestionId(question.id);
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;

    try {
      await deleteComprehensionQuestion(questionId);
      onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Silme işlemi başarısız oldu';
      setError(message);
    }
  };

  const handleGenerateAudio = async (
    questionId: string,
    type: 'question' | 'correct' | 'wrong',
    text: string
  ) => {
    if (!text.trim()) {
      setError('Seslendirme için metin gerekli');
      return;
    }

    setGeneratingAudio(`${questionId}-${type}`);
    setError('');

    try {
      // Generate audio
      const result = await generateVoice(text);
      if (!result.success || !result.audioBase64) {
        throw new Error(result.error || 'Ses oluşturulamadı');
      }

      // Upload to Supabase
      const fileName = `story-${storyId}-question-${questionId}-${type}.mp3`;
      const audioUrl = await uploadAudioToSupabase(result.audioBase64, fileName);

      if (!audioUrl) {
        throw new Error('Ses Supabase\'e yüklenemedi');
      }

      // Update question with audio URL
      const updateField = 
        type === 'question' ? 'question_audio_url' :
        type === 'correct' ? 'correct_answer_audio_url' :
        'wrong_answer_audio_url';

      await updateComprehensionQuestion(questionId, {
        [updateField]: audioUrl,
      });

      onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ses oluşturma başarısız oldu';
      setError(message);
    } finally {
      setGeneratingAudio(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-purple-800">
            Sorular - {storyTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={() => {
              setShowQuestionForm(!showQuestionForm);
              setEditingQuestionId(null);
              setQuestionFormData({
                question_text: '',
                option_a: '',
                option_b: '',
                option_c: '',
                option_d: '',
                correct_option: 'A',
                question_order: questions.length + 1,
              });
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            {showQuestionForm ? 'İptal' : '+ Yeni Soru Ekle'}
          </button>

          {showQuestionForm && (
            <form onSubmit={handleQuestionSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-purple-800">
                {editingQuestionId ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soru Metni</label>
                <textarea
                  required
                  value={questionFormData.question_text}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">A) Seçenek</label>
                  <input
                    type="text"
                    required
                    value={questionFormData.option_a}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, option_a: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">B) Seçenek</label>
                  <input
                    type="text"
                    required
                    value={questionFormData.option_b}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, option_b: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">C) Seçenek</label>
                  <input
                    type="text"
                    required
                    value={questionFormData.option_c}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, option_c: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">D) Seçenek</label>
                  <input
                    type="text"
                    required
                    value={questionFormData.option_d}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, option_d: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doğru Cevap</label>
                  <select
                    value={questionFormData.correct_option}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, correct_option: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıra</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={questionFormData.question_order}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, question_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {editingQuestionId ? 'Güncelle' : 'Ekle'}
              </button>
            </form>
          )}

          {loadingQuestions ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Henüz soru eklenmemiş</div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-semibold">
                          Soru {question.question_order}
                        </span>
                        <span className="text-sm text-gray-500">
                          Doğru: {question.correct_option}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 mb-3">{question.question_text}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={question.correct_option === 'A' ? 'text-green-600 font-semibold' : ''}>
                          A) {question.option_a}
                        </div>
                        <div className={question.correct_option === 'B' ? 'text-green-600 font-semibold' : ''}>
                          B) {question.option_b}
                        </div>
                        <div className={question.correct_option === 'C' ? 'text-green-600 font-semibold' : ''}>
                          C) {question.option_c}
                        </div>
                        <div className={question.correct_option === 'D' ? 'text-green-600 font-semibold' : ''}>
                          D) {question.option_d}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded"
                      >
                        Sil
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Seslendirmeler:</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleGenerateAudio(question.id, 'question', question.question_text)}
                        disabled={generatingAudio === `${question.id}-question`}
                        className={`px-3 py-1 text-xs rounded ${
                          question.question_audio_url
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {generatingAudio === `${question.id}-question` ? '⏳ Oluşturuluyor...' : 
                         question.question_audio_url ? '✓ Soru Seslendirmesi' : '🎤 Soru Seslendirmesi Oluştur'}
                      </button>
                      <button
                        onClick={() => {
                          const correctText = question[`option_${question.correct_option.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d'];
                          handleGenerateAudio(question.id, 'correct', correctText);
                        }}
                        disabled={generatingAudio === `${question.id}-correct`}
                        className={`px-3 py-1 text-xs rounded ${
                          question.correct_answer_audio_url
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {generatingAudio === `${question.id}-correct` ? '⏳ Oluşturuluyor...' : 
                         question.correct_answer_audio_url ? '✓ Doğru Cevap Seslendirmesi' : '🎤 Doğru Cevap Seslendirmesi Oluştur'}
                      </button>
                      <button
                        onClick={() => {
                          const wrongOptions = ['A', 'B', 'C', 'D'].filter(opt => opt !== question.correct_option);
                          const wrongText = question[`option_${wrongOptions[0].toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d'];
                          handleGenerateAudio(question.id, 'wrong', wrongText);
                        }}
                        disabled={generatingAudio === `${question.id}-wrong`}
                        className={`px-3 py-1 text-xs rounded ${
                          question.wrong_answer_audio_url
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {generatingAudio === `${question.id}-wrong` ? '⏳ Oluşturuluyor...' : 
                         question.wrong_answer_audio_url ? '✓ Yanlış Cevap Seslendirmesi' : '🎤 Yanlış Cevap Seslendirmesi Oluştur'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
