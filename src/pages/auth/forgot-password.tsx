// src/pages/auth/forgot-password.tsx
import React from 'react';
import { useForgotPassword } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { NarrowCol } from '@/components/layout/NarrowCol';

export const ForgotPasswordPage: React.FC = () => {
  const { mutate: forgotPassword, isLoading, error, isSuccess } = useForgotPassword();
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword({ email });
  };

  if (isSuccess) {
    return (
      <NarrowCol>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Email wysłany
              </CardTitle>
              <CardDescription className="text-center">
                Sprawdź swoją skrzynkę odbiorczą
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Wysłaliśmy link do resetowania hasła na adres <strong>{email}</strong>. 
                  Sprawdź swoją skrzynkę odbiorczą i kliknij w link, aby zresetować hasło.
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <a href="/login" className="text-blue-600 hover:text-blue-500">
                  Powrót do logowania
                </a>
              </div>
            </CardContent>
          </Card>
      </NarrowCol>
    );
  }

  return (
    <NarrowCol>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Resetuj hasło</CardTitle>
            <CardDescription className="text-center">
              Wprowadź swój email, aby otrzymać link do resetowania hasła
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="przykład@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error.message || 'Błąd podczas wysyłania emaila'}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Wyślij link resetujący
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <a href="/login" className="text-blue-600 hover:text-blue-500">
                Powrót do logowania
              </a>
            </div>
          </CardContent>
        </Card>
      </NarrowCol>
  );
};