// utility/auth/useRegistration.ts

import React from "react";
import { useNavigate } from "react-router-dom";
import { useFormSchemaStore } from "@/utility/llmFormWizard";
import { authProvider } from "./authProvider";

interface UseRegistrationResult {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  register: () => void;
  goBack: () => void;
  processData: any;
}

export const useRegistration = (): UseRegistrationResult => {
  const navigate = useNavigate();
  const { getData, setData } = useFormSchemaStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const processData = getData("registration");

  // Funkcja rejestracji - bezpośrednie wywołanie authProvider
  const register = React.useCallback(async () => {
    if (!authProvider.register) {
      setError("Funkcja rejestracji nie jest dostępna");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authProvider.register({
        email: processData.email,
        password: processData.password,
        role: processData.role,
        ...(processData.operator_id && { operator_id: processData.operator_id })
      });

      console.log("Registration result:", result);

      if (result.success) {
        setIsSuccess(true);
        
        // Zapisz dane o udanej rejestracji
        setData("registration", {
          ...processData,
          registrationComplete: true,
          registrationDate: new Date().toISOString(),
          user: result.user
        });

        // Przekieruj po 1.5 sekundy
        setTimeout(() => {
          navigate("/register/step4");
        }, 1500);
      } else {
        setError(result.error?.message || "Rejestracja nie powiodła się");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  }, [processData, setData, navigate]);

  // Funkcja cofania
  const goBack = React.useCallback(() => {
    navigate("/register/step2");
  }, [navigate]);

  return {
    isLoading,
    isSuccess,
    error,
    register,
    goBack,
    processData,
  };
};