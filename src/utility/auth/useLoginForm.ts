// utility/auth/useLoginForm.ts
import React from "react";
import { useLogin } from "@refinedev/core";

interface LoginVariables {
  email: string;
  password: string;
}

interface UseLoginFormResult {
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const useLoginForm = (): UseLoginFormResult => {
  const {
    mutate: loginMutation,
    isLoading,
    error: hookError,
    data: loginData,
  } = useLogin();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [hasAttempted, setHasAttempted] = React.useState(false);

  // ✅ KLUCZOWA ZMIANA: Sprawdzamy zarówno hookError jak i loginData z success: false
  React.useEffect(() => {
    console.log("🔍 useLogin state:", { hookError, loginData, isLoading });
  }, [hookError, loginData, isLoading]);

  // Funkcja parsująca błędy
  const getErrorMessage = React.useCallback((error: any): string => {
    console.log("🔧 Parsing error:", error);

    if (!error) return "Wystąpił nieoczekiwany błąd.";

    if (typeof error === "string") {
      return error;
    }

    // ✅ Obsługa AuthApiError z Supabase
    if (
      error.name === "AuthApiError" ||
      error.constructor?.name === "AuthApiError"
    ) {
      const message = error.message || "";

      if (message.includes("Invalid login credentials")) {
        return "Nieprawidłowe dane logowania. Sprawdź email i hasło.";
      }

      if (message.includes("Email not confirmed")) {
        return "Konto nie zostało potwierdzone. Sprawdź swoją skrzynkę email i kliknij link aktywacyjny.";
      }

      if (message.includes("Too many requests")) {
        return "Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.";
      }

      if (message.includes("User not found")) {
        return "Nie znaleziono użytkownika z tym adresem email.";
      }

      // Zwróć oryginalną wiadomość jeśli nie pasuje do żadnego wzorca
      return message || "Błąd uwierzytelniania.";
    }

    // Inne formaty błędów
    if (error.message) {
      const message = error.message;

      if (message.includes("Invalid login credentials")) {
        return "Nieprawidłowe dane logowania. Sprawdź email i hasło.";
      }

      if (message.includes("Email not confirmed")) {
        return "Konto nie zostało potwierdzone. Sprawdź swoją skrzynkę email.";
      }

      return message;
    }

    // Fallback
    return "Wystąpił błąd logowania. Spróbuj ponownie.";
  }, []);

  // ✅ POPRAWIONE: Sprawdzamy błędy z obu źródeł
  const errorMessage = React.useMemo(() => {
    if (!hasAttempted) return null;

    // 1. Sprawdź hookError (rzeczywiste błędy HTTP/sieci)
    if (hookError) {
      console.log("📍 Using hookError");
      return getErrorMessage(hookError);
    }

    // 2. ✅ KLUCZOWE: Sprawdź loginData z success: false
    if (loginData?.success === false && loginData.error) {
      console.log("📍 Using loginData.error");
      return getErrorMessage(loginData.error);
    }

    return null;
  }, [hookError, loginData, hasAttempted, getErrorMessage]);

  // ✅ Sprawdzamy czy logowanie się udało
  const isLoginSuccessful = React.useMemo(() => {
    return loginData?.success === true;
  }, [loginData]);

  // ✅ Effect do przekierowania po udanym logowaniu
  React.useEffect(() => {
    if (isLoginSuccessful) {
      console.log("✅ Login successful, clearing form");
      setEmail("");
      setPassword("");
      // Tutaj możesz dodać przekierowanie jeśli potrzebne
    }
  }, [isLoginSuccessful]);

  // Funkcja logowania
  const login = React.useCallback(() => {
    console.log("🚀 Login attempt:", {
      email,
      password: password ? "***" : "",
    });

    if (!email.trim() || !password.trim()) {
      console.log("❌ Login blocked - empty fields");
      return;
    }

    setHasAttempted(true);

    const loginVariables: LoginVariables = {
      email: email.trim(),
      password: password,
    };

    loginMutation(loginVariables, {
      onSuccess: (data) => {
        console.log("✅ Login onSuccess:", data);
        // Nie czyścimy formularza tutaj - robimy to w useEffect po sprawdzeniu success
      },
      onError: (error) => {
        console.error("❌ Login onError:", error);
      },
    });
  }, [email, password, loginMutation]);

  // Handler dla formularza
  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      console.log("📝 Form submitted");
      login();
    },
    [login]
  );

  return {
    email,
    password,
    setEmail,
    setPassword,
    isLoading,
    error: errorMessage,
    login,
    handleSubmit,
  };
};
