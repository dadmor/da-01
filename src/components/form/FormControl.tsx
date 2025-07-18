// components/FormControl.tsx

import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  children: ReactNode;
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export const FormControl = ({ 
  children, 
  label,
  htmlFor,
  error,
  required = false,
  className = ""
}: FormFieldProps) => {
  const baseClasses = "space-y-2";
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;
  
  // Funkcja do dodawania gwiazdki do label
  const renderLabel = () => {
    if (!label) return null;

    // Jeśli label jest stringiem, dodaj gwiazdkę bezpośrednio
    if (typeof label === 'string') {
      return (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      );
    }

    // Jeśli label jest ReactNode (np. FlexBox z ikoną), 
    // owijamy w Label i dodajemy gwiazdkę na zewnątrz
    return (
      <Label htmlFor={htmlFor} className="flex items-center">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
    );
  };
  
  return (
    <div className={combinedClasses}>
      {renderLabel()}
      {children}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};