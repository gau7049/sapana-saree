"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface SelectedImageValue {
  index: number;
  total: number;
  label: string | null;
  setSelected: (index: number, total: number, label: string | null) => void;
}

const SelectedImageContext = createContext<SelectedImageValue | null>(null);

export function SelectedImageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ index: number; total: number; label: string | null }>({
    index: 0,
    total: 1,
    label: null,
  });

  const value = useMemo<SelectedImageValue>(
    () => ({
      ...state,
      setSelected: (index, total, label) => setState({ index, total, label }),
    }),
    [state]
  );

  return (
    <SelectedImageContext.Provider value={value}>{children}</SelectedImageContext.Provider>
  );
}

export function useSelectedImage() {
  const ctx = useContext(SelectedImageContext);
  if (!ctx) {
    throw new Error("useSelectedImage must be used within a SelectedImageProvider");
  }
  return ctx;
}
