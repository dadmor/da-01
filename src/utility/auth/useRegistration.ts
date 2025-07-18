// utility/auth/useRegistration.ts

import React from "react";
import { useRegister } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { useFormSchemaStore } from "@/utility/llmFormWizard";
import { AuthError } from "./authErrors";

interface RegisterVariables {
  email: string;
  password: string;
  role: string;
  operator_id?: string;
}

interface UseRegistrationResult {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  register: () => void;
  goBack: () => void;
  processData: any;
}

// Typy dla odpowiedzi z authProvider
interface RegisterSuccessResponse {
  success: true;
  user: any;
  session: any;
}

interface RegisterErrorResponse {
  success: false;
  error: AuthError;
}

export const useRegistration = (): UseRegistrationResult => {
  const navigate = useNavigate();
  const { getData, setData } = useFormSchemaStore();
  const [hasAttempted, setHasAttempted] = React.useState(false);

  const {
    mutate: registerMutation,
    isLoading,
    error: hookError,
    data: registerData,
  } = useRegister<RegisterVariables>();

  const processData = getData("registration");

  // Poprawna obsługa błędów z type guards
  const registrationError = React.useMemo(() => {
    if (!hasAttempted) return null;

    // Hook error od React Query
    if (hookError) {
      if (hookError instanceof Error) {
        return hookError.message;
      }
      return "Wystąpił błąd podczas rejestracji.";
    }

    // Błąd z odpowiedzi authProvider - używamy type guard
    if (registerData && isErrorResponse(registerData)) {
      return registerData.error.message;
    }

    return null;
  }, [hookError, registerData, hasAttempted]);

  // Type guard dla sprawdzenia typu odpowiedzi
  const isErrorResponse = (data: any): data is RegisterErrorResponse => {
    return data && data.success === false && data.error;
  };

  const isSuccessResponse = (data: any): data is RegisterSuccessResponse => {
    return data && data.success === true && data.user && data.session;
  };

  // Sprawdzenie sukcesu z type guard
  const isRegistrationSuccessful = React.useMemo(() => {
    return registerData && isSuccessResponse(registerData);
  }, [registerData]);

  // Przekierowanie po sukcesie
  React.useEffect(() => {
    if (
      isRegistrationSuccessful &&
      registerData &&
      isSuccessResponse(registerData)
    ) {
      if (!processData.registrationComplete) {
        setData("registration", {
          ...processData,
          registrationComplete: true,
          registrationDate: new Date().toISOString(),
          user: registerData.user,
          session: registerData.session,
          successData: registerData,
        });
      }

      const timer = setTimeout(() => {
        navigate("/register/step4");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isRegistrationSuccessful, registerData, navigate, processData, setData]);

  // Funkcja rejestracji
  const register = React.useCallback(() => {
    setHasAttempted(true);

    const registerVariables: RegisterVariables = {
      email: processData.email,
      password: processData.password,
      role: processData.role,
    };

    // Dodaj operator_id jeśli istnieje
    if (processData.operator_id) {
      registerVariables.operator_id = processData.operator_id;
    }

    registerMutation(registerVariables);
  }, [processData, registerMutation]);

  // Funkcja cofania
  const goBack = React.useCallback(() => {
    navigate("/register/step2");
  }, [navigate]);

  return {
    isLoading,
    isSuccess: isRegistrationSuccessful ?? false,
    error: registrationError,
    register,
    goBack,
    processData,
  };
};
