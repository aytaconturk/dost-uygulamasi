import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setTeacher, setError, setLoading } from '../store/userSlice';
import { signIn, signUp } from '../lib/auth';
import type { AppDispatch } from '../store/store';

type Props = {
  onLoginSuccess: () => void;
};

export default function TeacherLogin({ onLoginSuccess }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      if (!email || !password) {
        setLocalError('E-posta ve şifre gerekli');
        setIsLoading(false);
        dispatch(setLoading(false));
        return;
      }

      const { error: signInError, data: authUser } = await signIn(email, password);

      if (signInError) {
        setLocalError(signInError instanceof Error ? signInError.message : 'Giriş başarısız');
        setIsLoading(false);
        dispatch(setLoading(false));
        return;
      }

      if (authUser?.teacher) {
        dispatch(setTeacher(authUser.teacher));
        localStorage.setItem('dost_teacher', JSON.stringify(authUser.teacher));
        onLoginSuccess();
      } else {
        setLocalError('Öğretmen hesabı bulunamadı');
        setIsLoading(false);
        dispatch(setLoading(false));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu';
      setLocalError(message);
      dispatch(setError(message));
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      if (!email || !password || !firstName || !lastName) {
        setLocalError('Tüm alanlar gerekli');
        setIsLoading(false);
        dispatch(setLoading(false));
        return;
      }

      if (password.length < 6) {
        setLocalError('Şifre en az 6 karakter olmalı');
        setIsLoading(false);
        dispatch(setLoading(false));
        return;
      }

      const { error: signUpError } = await signUp(email, password, 'teacher', firstName, lastName, {
        schoolName: schoolName || undefined,
      });

      if (signUpError) {
        setLocalError(signUpError instanceof Error ? signUpError.message : 'Kayıt başarısız');
        setIsLoading(false);
        dispatch(setLoading(false));
        return;
      }

      // Now sign in
      const { error: signInError, data: authUser } = await signIn(email, password);

      if (signInError) {
        setLocalError(signInError instanceof Error ? signInError.message : 'Giriş başarısız');
        setIsLoading(false);
        dispatch(setLoading(false));
        return;
      }

      if (authUser?.teacher) {
        dispatch(setTeacher(authUser.teacher));
        localStorage.setItem('dost_teacher', JSON.stringify(authUser.teacher));
        onLoginSuccess();
      } else {
        setLocalError('Öğretmen hesabı oluşturulamadı');
        setIsLoading(false);
        dispatch(setLoading(false));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu';
      setLocalError(message);
      dispatch(setError(message));
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">DOST</h1>
          <p className="text-gray-600">{isSignUp ? 'Öğretmen Kaydı' : 'Öğretmen Girişi'}</p>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Adınız"
                  required={isSignUp}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Soyadınız"
                  required={isSignUp}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Okul Adı (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Okul adı"
                />
              </div>
            </>
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
              minLength={6}
            />
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {isLoading ? 'İşleniyor...' : isSignUp ? 'Kaydol' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setLocalError('');
              setPassword('');
              setEmail('');
              setFirstName('');
              setLastName('');
              setSchoolName('');
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
