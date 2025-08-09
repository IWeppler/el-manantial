"use client";
import { useField } from "formik";

interface CustomSelectProps {
  label: string;
  name: string;
  children: React.ReactNode;
}

export const Select = ({ label, ...props }: CustomSelectProps) => {
  const [field, meta] = useField(props);

  return (
    <div>
      <label
        htmlFor={props.name}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <select
        {...field}
        {...props}
        className={`mt-1 block w-full bg-white rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-neutral-950 focus:outline-none focus:ring-neutral-950 sm:text-sm ${
          meta.touched && meta.error ? "border-red-500" : ""
        }`}
      >
        {props.children}
      </select>
      {meta.touched && meta.error ? (
        <p className="mt-2 text-sm text-red-600">{meta.error}</p>
      ) : null}
    </div>
  );
};
