"use client";
import { useField } from "formik";
import clsx from "clsx";

interface CustomInputProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
}

export const CustomInput = ({ label, ...props }: CustomInputProps) => {
  const [field, meta] = useField(props);

  return (
    <div>
      <label
        htmlFor={props.name}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="mt-1">
        <input
          {...field}
          {...props}
          // 2. Usar clsx para construir las clases
          className={clsx(
            "block w-full px-2 py-3 rounded-md border bg-white sm:text-sm",
            {
              "border-red-700": meta.touched && meta.error,
              "border-gray-300": !(meta.touched && meta.error),
            }
          )}
        />
        {meta.touched && meta.error ? (
          <p className="mt-2 text-sm text-red-600">{meta.error}</p>
        ) : null}
      </div>
    </div>
  );
};