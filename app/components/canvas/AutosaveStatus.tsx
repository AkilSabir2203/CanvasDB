import React, { useEffect, useState } from "react";
import { Check, AlertCircle } from "lucide-react";

interface AutosaveStatusProps {
  isSaving?: boolean;
  onSave?: () => void;
  onError?: (error: string) => void;
}

export const AutosaveStatus: React.FC<AutosaveStatusProps> = ({
  isSaving = false,
  onSave,
  onError,
}) => {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  useEffect(() => {
    if (isSaving) {
      setStatus("saving");
      setErrorMessage("");
    }
  }, [isSaving]);

  // Simulate save completion (in real scenario, parent component would handle this)
  useEffect(() => {
    if (status === "saving" && !isSaving) {
      setStatus("saved");
      setShowSavedIndicator(true);

      const timer = setTimeout(() => {
        setShowSavedIndicator(false);
        setStatus("idle");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, isSaving]);

  if (status === "idle" && !showSavedIndicator) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {status === "saving" && (
        <>
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Autosaving...
          </span>
        </>
      )}

      {status === "saved" && showSavedIndicator && (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Saved
          </span>
        </>
      )}

      {status === "error" && errorMessage && (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </span>
        </>
      )}
    </div>
  );
};
