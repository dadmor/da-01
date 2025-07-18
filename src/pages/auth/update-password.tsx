// src/pages/auth/update-password.tsx
import React from 'react';
import { useUpdatePassword } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Key, AlertTriangle, Info } from 'lucide-react';
import { NarrowCol } from '@/components/layout/NarrowCol';
import { supabaseClient } from '@/utility';


export const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: updatePassword, isLoading, error } = useUpdatePassword();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [isValidSession, setIsValidSession] = React.useState(true);
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [updateSuccess, setUpdateSuccess] = React.useState(false);

  // Sprawdź czy sesja jest typu recovery
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabaseClient.auth.getSession();
        
        // Sprawdź w URL czy to recovery
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        
        // Sprawdź czy mamy sesję i czy to sesja recovery
        if (!data.session && type !== 'recovery') {
          console.log('No valid recovery session found');
          setIsValidSession(false);
          setTimeout(() => {
            navigate('/forgot-password');
          }, 3000);
        } else {
          console.log('Valid session found');
          setIsValidSession(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Walidacja
    if (password !== confirmPassword) {
      setFormError('Hasła nie są identyczne');
      return;
    }

    if (password.length < 6) {
      setFormError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    if (password.length > 72) {
      setFormError('Hasło nie może być dłuższe niż 72 znaki');
      return;
    }

    // Aktualizuj hasło
    updatePassword(
      { password },
      {
        onSuccess: () => {
          setUpdateSuccess(true);
          // Po 3 sekundach przekieruj do logowania
          setTimeout(() => {
            navigate('/login?passwordChanged=true');
          }, 3000);
        },
        onError: (error: any) => {
          console.error('Password update error:', error);
          setFormError(error?.message || 'Błąd aktualizacji hasła');
        }
      }
    );
  };

  // Pokazuj loader podczas sprawdzania sesji
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Weryfikacja sesji...</p>
        </div>
      </div>
    );
  }

  // Jeśli sesja jest nieprawidłowa
  if (!isValidSession) {
    return (
      <NarrowCol>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Nieprawidłowa lub wygasła sesja.</strong>
                <br />
                Link do resetowania hasła mógł wygasnąć. Za chwilę zostaniesz przekierowany do strony resetowania hasła...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </NarrowCol>
    );
  }

  // Jeśli aktualizacja się powiodła
  if (updateSuccess) {
    return (
      <NarrowCol>
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Hasło zmienione!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Twoje hasło zostało pomyślnie zmienione. Za chwilę zostaniesz przekierowany do strony logowania...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </NarrowCol>
    );
  }

  // Formularz zmiany hasła
  return (
    <NarrowCol>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Key className="h-6 w-6" />
            Nowe hasło
          </CardTitle>
          <CardDescription className="text-center">
            Wprowadź nowe hasło dla swojego konta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nowe hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 znaków"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Powtórz nowe hasło"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Wskazówki dotyczące hasła */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Wymagania hasła:</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Minimum 6 znaków</li>
                  <li>Maksimum 72 znaki</li>
                  <li>Zalecane użycie liter, cyfr i znaków specjalnych</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Błędy */}
            {(error || formError) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {formError || error?.message || 'Błąd aktualizacji hasła'}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Aktualizowanie..." : "Zaktualizuj hasło"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pamiętasz hasło?{' '}
              <a 
                href="/login" 
                className="text-blue-600 hover:text-blue-500"
              >
                Wróć do logowania
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </NarrowCol>
  );
};