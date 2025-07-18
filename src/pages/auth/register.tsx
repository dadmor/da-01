// src/pages/auth/register.tsx
import React from 'react';
import { useRegister } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, User, Shield } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { mutate: register, isLoading, error } = useRegister();
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<string>('');
  const [formError, setFormError] = React.useState('');

  const roles = [
    {
      value: 'beneficiary',
      label: 'Beneficiary',
      description: 'Użytkownik końcowy systemu',
      icon: User
    },
    {
      value: 'auditor',
      label: 'Auditor',
      description: 'Audytor z uprawnieniami kontrolnymi',
      icon: Shield
    }
  ];

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Hasła nie są identyczne');
      return;
    }

    if (password.length < 6) {
      setFormError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = () => {
    if (!selectedRole) {
      setFormError('Wybierz rolę');
      return;
    }

    // Tutaj przekazujemy rolę do rejestracji
    register({ 
      email, 
      password,
      role: selectedRole
    });
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setFormError('');
  };

  const handleBack = () => {
    setStep(1);
    setFormError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {step === 1 ? (
          // Krok 1: Dane podstawowe
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Zarejestruj się</CardTitle>
              <CardDescription className="text-center">
                Krok 1/2: Podaj swoje dane
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1Submit} className="space-y-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="password">Hasło</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 znaków"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Powtórz hasło"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {formError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full">
                  Dalej
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <a href="/login" className="text-blue-600 hover:text-blue-500">
                  Masz już konto? Zaloguj się
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Krok 2: Wybór roli
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Wybierz rolę</CardTitle>
              <CardDescription className="text-center">
                Krok 2/2: Jaka jest Twoja rola w systemie?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div
                      key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                        selectedRole === role.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`h-6 w-6 mt-1 ${
                          selectedRole === role.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            selectedRole === role.value ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {role.label}
                          </h3>
                          <p className={`text-sm ${
                            selectedRole === role.value ? 'text-blue-700' : 'text-gray-500'
                          }`}>
                            {role.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {formError}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error?.message || 'Błąd rejestracji'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Wstecz
                </Button>
                
                <Button 
                  onClick={handleFinalSubmit}
                  className="flex-1"
                  disabled={isLoading || !selectedRole}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Zarejestruj się
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};