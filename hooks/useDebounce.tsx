"use client";

import { useCallback, useRef } from "react";

const useDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunction = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(callback, delay);
  }, [callback, delay]);

  return debouncedFunction;
};

export default useDebounce;
