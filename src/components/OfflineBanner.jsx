import { useState, useEffect } from "react";
import { FaWifi } from "react-icons/fa";

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <FaWifi aria-hidden="true" />
      <span>You're offline. Showing cached data.</span>
    </div>
  );
}

export default OfflineBanner;