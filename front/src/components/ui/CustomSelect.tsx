import { useField } from "formik";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormikShadcnSelectProps {
  name: string;
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const CustomSelect = ({ label, options, placeholder, ...props }: FormikShadcnSelectProps) => {
  const [field, meta, helpers] = useField(props.name);
  const { setValue } = helpers;

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={props.name}>{label}</Label>
      <Select onValueChange={(value) => setValue(value)} value={field.value}>
        <SelectTrigger id={props.name}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {meta.touched && meta.error ? (
        <p className="text-sm text-red-500">{meta.error}</p>
      ) : null}
    </div>
  );
};