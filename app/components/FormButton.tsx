"use client";

import { IconType } from "react-icons";

interface FormButtonProps {
   label: string;
   onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
   disabled?: boolean;
   outline?: boolean;
   small?: boolean;
   icon?: IconType;
}
const FormButton: React.FC<FormButtonProps> = ({
   label,
   onClick,
   disabled,
   outline,
   small,
   icon: Icon,
}) => {
   return (
      <button
         onClick={onClick}
         disabled={disabled}
         className={`
    relative
    disabled:opacity-70
    disabled:cursor-not-allowed
    rounded-lg
    hover:opacity-80
    transition
    w-full
    ${outline ? "bg-white border-black text-black" : "bg-purple-500 border-purple-500 text-white"}
    ${small ? "py-1 text-sm font-light border-b" : "py-3 text-md font-semibold border-2"}
   `}
      >
         {label}
         {Icon && <Icon size={24} className="absolute right-4 top-3" />}
      </button>
   );
};
export default FormButton;