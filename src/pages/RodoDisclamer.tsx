import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

const RodoDisclaimer = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [hasSeenDisclaimer, setHasSeenDisclaimer] = useState(false);

  useEffect(() => {
    // Sprawdź czy użytkownik już widział disclaimer
    try {
      const seen = localStorage.getItem('rodoDisclaimerSeen');
      if (!seen) {
        setShowPopup(true);
      } else {
        setHasSeenDisclaimer(true);
      }
    } catch (error) {
      // Jeśli localStorage nie jest dostępny, pokaż popup
      setShowPopup(true);
    }
  }, []);

  const handleAccept = () => {
    setShowPopup(false);
    setHasSeenDisclaimer(true);
    
    // Zapisz w localStorage że użytkownik już widział disclaimer
    try {
      localStorage.setItem('rodoDisclaimerSeen', 'true');
    } catch (error) {
      console.log('localStorage nie jest dostępny');
    }
  };

  const handleReject = () => {
    // Przekieruj do Google
    window.location.href = 'https://www.google.com';
  };

  return (
    <>
      {/* DYSKRETNY PASEK INFORMACYJNY */}
      <div 
        className="fixed z-40 bottom-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 cursor-pointer hover:bg-blue-700 transition-colors" 
        onClick={() => setShowPopup(true)}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <Info className="w-4 h-4" />
          <span className="text-sm">
            Informacja o przetwarzaniu danych osobowych
          </span>
        </div>
      </div>

      {/* POPUP */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Nagłówek z przyciskiem zamknięcia */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  <Info className="inline-block mr-2 mb-1" size={24} />
                  Informacja o danych osobowych
                </h2>
                <button 
                  onClick={handleReject}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  aria-label="Zamknij - nie akceptuję"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Informacja o charakterze demonstracyjnym */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-2">System demonstracyjno-biznesowy</h3>
                  <p className="text-gray-700 mb-2">
                    Zalecamy używanie danych fikcyjnych:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 text-sm">
                    <li>Email: np. demo@example.com</li>
                    <li>Imię/Pseudonim: wymyślone</li>
                    <li>Miasto: fikcyjne</li>
                    <li>Wiek i wzrost: dowolne liczby</li>
                  </ul>
                </div>

                {/* Główna informacja */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Jakie dane zbieramy?</h3>
                  <p className="text-gray-700 mb-2">
                    W ramach tego systemu przechowujemy następujące informacje:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                    <li>Adres email</li>
                    <li>Miasto zamieszkania</li>
                    <li>Imię i nazwisko lub pseudonim</li>
                    <li>Wiek</li>
                    <li>Wzrost</li>
                  </ul>
                </div>

                {/* Informacje o bezpieczeństwie */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Bezpieczeństwo danych</h3>
                  <p className="text-gray-700">
                    System został zabezpieczony zgodnie z najlepszymi praktykami. 
                    Twoje dane są przechowywane w bezpieczny sposób i wykorzystywane 
                    wyłącznie do celów funkcjonowania aplikacji.
                  </p>
                </div>

                {/* Cel przetwarzania */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Cel przetwarzania</h3>
                  <p className="text-gray-600 text-sm">
                    Dane są wykorzystywane do personalizacji doświadczeń użytkownika, 
                    umożliwienia komunikacji oraz zapewnienia prawidłowego funkcjonowania 
                    systemu. Nie udostępniamy danych osobom trzecim bez Twojej zgody.
                  </p>
                </div>

                {/* Prawa użytkownika */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Twoje prawa</h3>
                  <p className="text-gray-600 text-sm">
                    Masz prawo do dostępu, modyfikacji oraz usunięcia swoich danych osobowych. 
                    W przypadku pytań dotyczących przetwarzania danych, skontaktuj się z administratorem systemu.
                  </p>
                </div>

                {/* Wyłączenie odpowiedzialności */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">Wyłączenie odpowiedzialności</h3>
                  <p className="text-gray-700 text-sm">
                    Jako system demonstracyjno-biznesowy, <strong>nie ponosimy odpowiedzialności</strong> za 
                    jakiekolwiek skutki wynikające z używania prawdziwych danych osobowych. 
                    Użytkownik korzysta z systemu na własną odpowiedzialność.
                  </p>
                </div>

                {/* Informacja o pierwszym uruchomieniu */}
                {!hasSeenDisclaimer && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Uwaga:</strong> Ten komunikat pojawia się przy pierwszym 
                      uruchomieniu aplikacji. Możesz go ponownie otworzyć klikając 
                      na pasek informacyjny u dołu strony.
                    </p>
                  </div>
                )}

                {/* Przyciski */}
                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={handleAccept}
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Rozumiem i akceptuję
                  </button>
                  <button 
                    onClick={handleReject}
                    className="flex-1 bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Nie akceptuję
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RodoDisclaimer;