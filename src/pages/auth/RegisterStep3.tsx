// pages/auth/RegisterStep3.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Check, Mail, User, AlertTriangle, UserCheck } from "lucide-react";
import { NarrowCol } from "@/components/layout/NarrowCol";
import { Lead } from "@/components/reader";
import { useRegistration } from "@/utility/auth/useRegistration"; // Import custom hook

export const RegisterStep3: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    isSuccess,
    error,
    register,
    goBack,
    processData
  } = useRegistration();

  // Check if data exists
  if (!processData || !processData.email) {
    return (
      <NarrowCol>
        <Lead title="Rejestracja" description="Błąd - brak danych" />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Brak danych rejestracji. Rozpocznij proces od początku.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/register/step1")} className="mt-4">
          Wróć do kroku 1
        </Button>
      </NarrowCol>
    );
  }

  return (
    <NarrowCol>
      <div className="flex items-start gap-5 ">
        <UserCheck className="mt-2 bg-white rounded-full p-2 w-12 h-12" />
        <Lead title={`Rejestracja`} description={`3 z 4 Potwierdzenie danych`} />
      </div>

      {isSuccess && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Rejestracja udana!</strong> Za chwilę zostaniesz przekierowany...
          </AlertDescription>
        </Alert>
      )}

      {error && !isSuccess && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Rejestracja nieudana:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Check className="mr-2 h-5 w-5 text-blue-600" />
            Podsumowanie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              Co się stanie:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Konto zostanie utworzone</li>
              <li>• Otrzymasz email z potwierdzeniem</li>
              <li>• Po aktywacji będziesz mógł się zalogować</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">{processData.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Imię i nazwisko</p>
                <p className="text-sm text-gray-600">{processData.name}</p>
              </div>
            </div>
          </div>

          {error && !isSuccess && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 font-medium">
                Wskazówki w przypadku problemów:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• Sprawdź czy email ma prawidłowy format</li>
                <li>• Upewnij się że hasło spełnia wymagania (6-72 znaków)</li>
                <li>• Jeśli masz już konto, przejdź do logowania</li>
                <li>• W przypadku dalszych problemów skontaktuj się z pomocą</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-between">
        <Button 
          variant="outline" 
          onClick={goBack} 
          disabled={isLoading || isSuccess}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wstecz
        </Button>

        <Button 
          onClick={register} 
          disabled={isLoading || isSuccess}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Rejestruję..." : 
           isSuccess ? "Udane!" :
           error ? "Spróbuj ponownie" : "Zarejestruj się"}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <a
          href="/login"
          className="text-blue-600 hover:text-blue-500 text-sm"
        >
          Masz już konto? Zaloguj się
        </a>
      </div>
    </NarrowCol>
  );
};