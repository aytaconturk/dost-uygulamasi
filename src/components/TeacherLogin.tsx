import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setTeacher, setError, setLoading } from '../store/userSlice';
import { supabase } from '../lib/supabase';
import type { AppDispatch } from '../store/store';

type Props = {
  onLoginSuccess: () => void;
};

export default function TeacherLogin({ onLoginSuccess }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setLocalError] = useState('');

  const hashPassword = async (pwd: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(setLoading(true));

    try {
      if (!email || !password) {
        setLocalError('E-posta ve şifre gerekli');
        dispatch(setLoading(false));
        return;
      }

      console.log('[TeacherLogin] Starting login attempt for:', email);

      // Check if teacher exists
      const { data, error: queryError } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .single();

      console.log('[TeacherLogin] Query result:', { data, queryError });

      if (queryError && queryError.code !== 'PGRST116') {
        console.error('[TeacherLogin] Query error:', queryError);
        throw queryError;
      }

      if (data) {
        // Login existing teacher - verify password
        console.log('[TeacherLogin] Teacher found, verifying password');
        const hashedPassword = await hashPassword(password);

        if (hashedPassword === data.password) {
          console.log('[TeacherLogin] Password verified, logging in:', data);
          dispatch(setTeacher(data));
          onLoginSuccess();
        } else {
          setLocalError('E-posta veya şifre hatalı');
        }
      } else if (isSignUp) {
        // Create new teacher
        console.log('[TeacherLogin] Creating new teacher:', { name, email });
        const hashedPassword = await hashPassword(password);

        const { data: newTeacher, error: insertError } = await supabase
          .from('teachers')
          .insert({ name, email, password: hashedPassword })
          .select()
          .single();

        if (insertError) {
          console.error('[TeacherLogin] Insert error:', insertError);
          throw insertError;
        }

        console.log('[TeacherLogin] Teacher created:', newTeacher);
        dispatch(setTeacher(newTeacher));
        onLoginSuccess();
      } else {
        setLocalError('Öğretmen bulunamadı. Lütfen kaydolun veya e-posta adresini kontrol edin.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu';
      console.error('[TeacherLogin] Error:', err);
      setLocalError(message);
      dispatch(setError(message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">DOST</h1>
          <p className="text-gray-600">Öğretmen Girişi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Adınız"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="ornek@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Şifreniz"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {isSignUp ? 'Kaydol' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setLocalError('');
              setPassword('');
            }}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            {isSignUp
              ? 'Zaten hesabım var'
              : 'Hesabım yok, kaydol'}
          </button>
        </div>
      </div>
    </div>
  );
}
