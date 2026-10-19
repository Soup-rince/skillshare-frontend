import { createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        title: options.title || "Are you sure?",
        message: options.message || "",
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        tone: options.tone || "danger",
        inputLabel: options.inputLabel,
        inputPlaceholder: options.inputPlaceholder,
        inputRequired: options.inputRequired || false,
        inputMinLength: options.inputMinLength || 0,
      });
    });
  }, []);

  const handleConfirm = (inputValue) => {
    if (resolverRef.current) {
      // Kung may input, ibalik yung text. Kung wala, true.
      resolverRef.current(inputValue !== undefined ? inputValue : true);
    }
    resolverRef.current = null;
    setDialogState(null);
  };

  const handleCancel = () => {
    if (resolverRef.current) resolverRef.current(false);
    resolverRef.current = null;
    setDialogState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={Boolean(dialogState)}
        title={dialogState?.title}
        message={dialogState?.message}
        confirmLabel={dialogState?.confirmLabel}
        cancelLabel={dialogState?.cancelLabel}
        tone={dialogState?.tone}
        inputLabel={dialogState?.inputLabel}
        inputPlaceholder={dialogState?.inputPlaceholder}
        inputRequired={dialogState?.inputRequired}
        inputMinLength={dialogState?.inputMinLength}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}