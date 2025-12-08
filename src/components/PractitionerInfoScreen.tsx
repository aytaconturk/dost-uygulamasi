import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onSkip: () => void;
  onContinue: (practitionerName: string) => void;
}

export default function PractitionerInfoScreen({ onSkip, onContinue }: Props) {
  const [practitionerName, setPractitionerName] = useState('');
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (practitionerName.trim()) {
      onContinue(practitionerName.trim());
    }
  };

  const handleSkip = () => {
    if (showSkipConfirm) {
      onSkip();
    } else {
      setShowSkipConfirm(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">DOST</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Uygulayıcı Bilgisi</h2>
        
        <p className="text-gray-600 mb-6">
          Öğrenciyi takip eden uygulayıcı bilgisini girebilirsiniz. Bu bilgi opsiyoneldir ve atlanabilir.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="practitionerName" className="block text-sm font-medium text-gray-700 mb-2">
              Uygulayıcı Adı
            </label>
            <input
              id="practitionerName"
              type="text"
              value={practitionerName}
              onChange={(e) => setPractitionerName(e.target.value)}
              placeholder="Uygulayıcı adını giriniz"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!practitionerName.trim()}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              Devam Et
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
            >
              {showSkipConfirm ? 'Emin misiniz?' : 'Atla'}
            </button>
          </div>

          {showSkipConfirm && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                Uygulayıcı bilgisini atlamak istediğinize emin misiniz?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSkip}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-2 px-3 rounded transition duration-200"
                >
                  Evet, Ayla
                </button>
                <button
                  type="button"
                  onClick={() => setShowSkipConfirm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-bold py-2 px-3 rounded transition duration-200"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}




