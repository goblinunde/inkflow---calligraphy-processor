import { useCallback, useEffect, useRef, useState } from 'react';

export const useTimedStatus = <T,>(durationMs: number = 3000) => {
  const [status, setStatus] = useState<T | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearStatus = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatus(null);
  }, []);

  const showStatus = useCallback((nextStatus: T) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setStatus(nextStatus);
    timeoutRef.current = window.setTimeout(() => {
      setStatus(null);
      timeoutRef.current = null;
    }, durationMs);
  }, [durationMs]);

  useEffect(() => clearStatus, [clearStatus]);

  return {
    status,
    showStatus,
    clearStatus
  };
};
