// RegisterStep1.tsx - POPRAWIONA WERSJA Z IMIENIEM I NAZWISKIEM
import { NarrowCol } from "@/components/layout/NarrowCol";
import { Lead } from "@/components/reader";
import { SchemaForm } from "@/components/SchemaForm";
import { useFormSchemaStore } from "@/utility/llmFormWizard";
import { UserPlus } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export const RegisterStep1: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useFormSchemaStore();

  useEffect(() => {
    register({
      id: "registration",
      title: "Proces rejestracji",
      schema: {
        step1: {
          title: "Dane podstawowe",
          type: "object",
          properties: {
            email: {
              type: "email",
              title: "Email",
              placeholder: "przykład@email.com",
            },
            name: {
              type: "text",
              title: "Imię i nazwisko",
              placeholder: "Jan Kowalski",
            },
          },
          required: ["email", "name"],
          validation: (data: any) => {
            if (data.name && data.name.trim().length < 3) {
              return "Imię i nazwisko musi mieć co najmniej 3 znaki";
            }
            if (data.name && !data.name.includes(" ")) {
              return "Podaj zarówno imię jak i nazwisko";
            }
            return null;
          },
        },
        step2: {
          title: "Hasło",
          type: "object",
          properties: {
            password: {
              type: "password",
              title: "Hasło",
              placeholder: "Minimum 6 znaków",
            },
            confirmPassword: {
              type: "password",
              title: "Potwierdź hasło",
              placeholder: "Powtórz hasło",
            },
          },
          required: ["password", "confirmPassword"],
          validation: (data: any) => {
            if (data.password && data.password.length < 6)
              return "Hasło musi mieć co najmniej 6 znaków";
            if (data.password !== data.confirmPassword)
              return "Hasła nie są identyczne";
            return null;
          },
        },
        step3: {
          title: "Podsumowanie",
          type: "object",
          properties: {},
        },
      },
    });
  }, [register]);

  const handleSubmit = (data: any) => {
    console.log("RegisterStep1 - Otrzymane dane z formularza:", data);
    // NIE NADPISUJ - dane są już zapisane przez SchemaForm
    navigate("/register/step2");
  };

  return (
    <NarrowCol>
      <div className="flex items-start gap-5 ">
        <UserPlus className="mt-2 bg-white rounded-full p-2 w-12 h-12" />
        <Lead
          title={`Rejestracja`}
          description={`1 z 3 Podaj podstawowe informacje`}
        />
      </div>

      <SchemaForm
        schemaPath="registration.step1"
        onSubmit={handleSubmit}
        submitLabel="Dalej"
      />

      <div className="mt-4 text-center">
        <Link to="/login" className="text-blue-600 hover:text-blue-500 text-sm">
          Masz już konto? Zaloguj się
        </Link>
      </div>
    </NarrowCol>
  );
};