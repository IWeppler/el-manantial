"use client";

import { useState } from "react";
import { useField } from "formik";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CustomInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}

export const CustomInput = ({ label, ...props }: CustomInputProps) => {
  const [field, meta] = useField(props.name);
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Input {...props} {...field} id={props.name} />
      {meta.touched && meta.error ? (
        <p className="text-sm text-red-500 mt-1">{meta.error}</p>
      ) : null}
    </div>
  );
};

// --- PasswordInput ---

interface PasswordInputProps {
  name: string;
  label: string;
  placeholder?: string;
}

export const PasswordInput = ({ label, ...props }: PasswordInputProps) => {
  const [field, meta] = useField(props.name);
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <div className="relative">
        <Input
          {...props}
          {...field}
          id={props.name}
          type={showPassword ? "text" : "password"}
          className="pr-10" 
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={toggleVisibility}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          </span>
        </Button>
      </div>
      {meta.touched && meta.error ? (
        <p className="text-sm text-red-500 mt-1">{meta.error}</p>
      ) : null}
    </div>
  );
};