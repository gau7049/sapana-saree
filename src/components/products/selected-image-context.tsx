"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface SelectedImageState {
  id: string | null;
  url: string | null;
  index: number;
  total: number;
  label: string | null;
}

interface SelectedImageValue extends SelectedImageState {
  setSelected: (next: SelectedImageState) => void;
}

const SelectedImageContext = createContext<SelectedImageValue | null>(null);

export function SelectedImageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SelectedImageState>({
    id: null,
    url: null,
    index: 0,
    total: 1,
    label: null,
  });

  const value = useMemo<SelectedImageValue>(
    () => ({
      ...state,
      setSelected: setState,
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
