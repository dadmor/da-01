// pages/auth/RegisterStep4.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Mail, 
  ArrowRight, 
  RefreshCw,
  User,
  Clock
} from "lucide-react";
import { NarrowCol } from "@/components/layout/NarrowCol";
import { Lead } from "@/components/reader";
import { useFormSchemaStore } from "@/utility/llmFormWizard";

export const RegisterStep4: React.FC = () => {
  const navigate = useNavigate();
  const { getData, unregister } = useFormSchemaStore();
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);

  const processData = getData("registration");
  const email = processData?.email || "user@example.com";
  const name = processData?.name || "Użytkownik";

  // ✅ Wyczyść dane po 30 sekundach lub gdy użytkownik przejdzie do logowania
  React.useEffect(() => {
    const timer = setTimeout(() => {
      unregister("registration", "data");
    }, 30000); // 30 sekund

    return () => clearTimeout(timer);
  }, [unregister]);

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      // Tutaj wywołanie API do ponownego wysłania maila
      await new Promise(resolve => setTimeout(resolve, 2000)); // Symulacja
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error) {
      console.error("Błąd wysyłania maila:", error);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoToLogin = () => {
    // ✅ Wyczyść dane przy przejściu do logowania
    unregister("registration", "data");
    navigate("/login");
  };

  return (
    <NarrowCol>
      <Lead 
        title="Rejestracja zakończona!" 
        description="4 z 4 Sprawdź swoją skrzynkę mailową" 
      />

      {/* Sukces */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <CheckCircle className="mr-2 h-6 w-6 text-green-600" />
            Konto zostało utworzone!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-green-700">
            <p className="font-medium">Gratulacje! Twoje konto zostało pomyślnie utworzone.</p>
            <p className="text-sm mt-1">
              Wysłaliśmy email z potwierdzeniem na adres <strong>{email}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Podsumowanie konta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Podsumowanie konta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Adres email</p>
              <p className="text-sm text-gray-600">{email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Imię i nazwisko</p>
              <p className="text-sm text-gray-600">{name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instrukcje email */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Mail className="mr-2 h-5 w-5 text-blue-600" />
            Co dalej?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Sprawdź swoją skrzynkę mailową</p>
                <p className="text-gray-600">
                  Email potwierdzający został wysłany na adres <strong>{email}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Kliknij link w emailu</p>
                <p className="text-gray-600">
                  Aktywuj swoje konto klikając w link potwierdzający
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Zaloguj się do systemu</p>
                <p className="text-gray-600">
                  Po aktywacji możesz się zalogować używając swojego emailu i hasła
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Ważne:</strong> Email może dotrzeć w ciągu kilku minut. 
              Sprawdź także folder SPAM/Niechciane.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Ponowne wysłanie emaila */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Nie otrzymałeś emaila?
            </p>
            
            {resendSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Email został wysłany ponownie!
                </AlertDescription>
              </Alert>
            )}

            <Button 
              variant="outline" 
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="w-full sm:w-auto"
            >
              {resendLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {resendLoading ? "Wysyłanie..." : "Wyślij email ponownie"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Akcje */}
      <div className="mt-6 space-y-4">
        <Button 
          onClick={handleGoToLogin} 
          className="w-full"
          size="lg"
        >
          Przejdź do logowania
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <div className="text-center">
          <a 
            href="/help" 
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            Potrzebujesz pomocy? Skontaktuj się z nami
          </a>
        </div>
      </div>
    </NarrowCol>
  );
};