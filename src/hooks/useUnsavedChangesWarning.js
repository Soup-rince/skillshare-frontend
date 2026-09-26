import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../contexts/ConfirmContext";

export function useUnsavedChangesWarning(isDirty, options = {}) {
  const confirm = useConfirm();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const handlePopState = async () => {
      const shouldLeave = await confirm({
        title: "Unsaved changes",
        message: options.message || "If you leave now, your edits will be lost.",
        confirmLabel: "Discard changes",
        cancelLabel: "Cancel",
        tone: "danger",
      });

      if (!shouldLeave) {
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handlePopState);

    const handleClick = async (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:")) return;
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;
      if (anchor.target === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (href === window.location.pathname) return;

      e.preventDefault();
      e.stopPropagation();

      const shouldLeave = await confirm({
        title: "Unsaved changes",
        message: options.message || "If you leave now, your edits will be lost.",
        confirmLabel: "Discard changes",
        cancelLabel: "Cancel",
        tone: "danger",
      });

      if (shouldLeave) {
        navigate(href);
      }
    };
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty, confirm, navigate, options.message]);
}