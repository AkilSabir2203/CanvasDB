"use client";

import { useCallback, useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";

import FormButton from "../FormButton";

interface ModalProps {
   isOpen?: boolean;
   onClose: () => void;
   onSubmit: () => void;
   title?: string;
   body?: React.ReactElement;
   footer?: React.ReactElement;
   actionLabel: string;
   disabled?: boolean;
   secondaryAction?: () => void;
   secondaryActionLabel?: string;
   // new visualize action (optional)
   onVisualize?: () => void;
   onVisualizeLabel?: string;
   // allow separately disabling secondary/visualize actions without tying to `disabled`
   secondaryDisabled?: boolean;
   visualizeDisabled?: boolean;
}

const Modal: React.FC<ModalProps> = ({
   isOpen,
   onClose,
   onSubmit,
   title,
   body,
   footer,
   actionLabel,
   disabled,
   secondaryAction,
   secondaryActionLabel,
   onVisualize,
   onVisualizeLabel,
   secondaryDisabled,
   visualizeDisabled,
}) => {
   const [showModal, setShowModal] = useState(isOpen);

   useEffect(() => {
      setShowModal(isOpen);

      return () => {};
   }, [isOpen]);

   useEffect(() => {
   const body = document.body;

   if (isOpen) body.classList.add("overflow-hidden");
   else body.classList.remove("overflow-hidden");

   return () => body.classList.remove("overflow-hidden");
   }, [isOpen]);

   const handleClose = useCallback(() => {
      if (disabled) {
         return;
      }

      setShowModal(false);
      setTimeout(() => {
         onClose();
      }, 300);
   }, [disabled, onClose]);

   const handleSubmit = useCallback(() => {
      if (disabled) {
         return;
      }

      onSubmit();
   }, [disabled, onSubmit]);

   const handleSecondayAction = useCallback(() => {
      if (disabled || secondaryDisabled || !secondaryAction) {
         return;
      }

      secondaryAction();
   }, [disabled, secondaryAction, secondaryDisabled]);

   // visualize action handler (independent of generation disabled state)
   const handleVisualizeAction = useCallback(() => {
      // allow visualize to be controlled separately by `visualizeDisabled` prop
      if (visualizeDisabled || !onVisualize) {
         return;
      }

      onVisualize();
   }, [onVisualize, visualizeDisabled]);

   if (!isOpen) {
      return null;
   }

   return (
      <>
         <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-[999] outline-none focus:outline-none bg-neutral-800/70">
            <div className="relative w-full md:w-4/6 lg:w-3/6 xl:w-2/5 my-6 mx-auto h-full lg:h-auto md:h-auto">
               {/* CONTENT */}
               <div
                  className={`translate duration-300 h-full 
                  ${showModal ? "translate-y-0" : "translate-y-full"}
                  ${showModal ? "opacity-100" : "opacity-0"}`}
               >
                  <div className="translate h-full lg:h-auto md:h-auto border-0 rounded-lg shadow-lg realtive flex flex-col w-full bg-white outline-none focus:outline-none">
                     {/* HEADER */}
                     <div className="flex items-center p-6 rounded-t justify-center relative border-b border-neutral-200 dark:text-neutral-800">
                        <button
                           onClick={handleClose}
                           className="p-1 border-0 hover:opacity-70 transition absolute right-9 "
                        >
                           <IoMdClose size={18} className="dark:text-neutral-800"/>
                        </button>
                        <div className="text-lg font font-semibold ">{title}</div>
                     </div>
                     {/* BODY */}
                     <div className="relative p-6 flex-auto dark:text-neutral-700">{body}</div>
                     {/* FOOTER */}
                     <div className="flex flex-col gap-2 p-6 ">
                        <div className="flex flex-row items-center gap-4 w-full">
                           {secondaryAction && secondaryActionLabel && (
                              <FormButton
                                 outline
                                 disabled={secondaryDisabled ?? disabled}
                                 label={secondaryActionLabel}
                                 onClick={handleSecondayAction}
                              />
                           )}

                           {/* visualize button (optional) */}
                           {onVisualize && onVisualizeLabel && (
                              <FormButton
                                 outline
                                 disabled={!!visualizeDisabled}
                                 label={onVisualizeLabel}
                                 onClick={handleVisualizeAction}
                              />
                           )}

                           <FormButton disabled={disabled} label={actionLabel} onClick={handleSubmit} />
                        </div>
                        {footer}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </>
   );
};
export default Modal;