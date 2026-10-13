import { useEffect } from "react";
import { setFaviconBadge } from "../utils/faviconBadge";

export function useNotificationBadge(count, baseTitle = "SkillShare") {
  useEffect(() => {
    setFaviconBadge(count);

    if (count > 0) {
      document.title = `(${count}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [count, baseTitle]);
}