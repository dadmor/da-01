// pages/auth/RegisterStep2.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, KeyRound } from "lucide-react";
import { SchemaForm } from "@/components/SchemaForm";
import { NarrowCol } from "@/components/layout/NarrowCol";
import { Lead } from "@/components/reader";
import { useFormSchemaStore } from "@/utility/llmFormWizard"; // ✅ Dodano import

export const RegisterStep2: React.FC = () => {
  const navigate = useNavigate();
  const { setData } = useFormSchemaStore(); // ✅ Dodano setData

  const handleSubmit = (data: any) => {
    setData("registration", data);
    navigate("/register/step3");
  };

  const handleBack = () => {
    navigate("/register/step1");
  };

  return (
    <NarrowCol>
     
      <div className="flex items-start gap-5 ">
        <KeyRound className="mt-2 bg-white rounded-full p-2 w-12 h-12" />
        <Lead
          title={`Rejestracja`}
          description={`2 z 3 Ustaw hasło do konta`}
        />
      </div>
      <SchemaForm
        schemaPath="registration.step2"
        onSubmit={handleSubmit}
        submitLabel="Dalej"
      />

      <div className="mt-4 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wstecz
        </Button>
        <a href="/login" className="text-blue-600 hover:text-blue-500 text-sm">
          Masz już konto? Zaloguj się
        </a>
      </div>
    </NarrowCol>
  );
};