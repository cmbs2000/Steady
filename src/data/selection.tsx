import { createContext, useContext, useState, type ReactNode } from 'react';

interface SelectionValue {
  selectedSponseeId: string | null;
  setSelectedSponseeId: (id: string) => void;
}

const SelectionContext = createContext<SelectionValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedSponseeId, setSelectedSponseeId] = useState<string | null>(null);

  return (
    <SelectionContext.Provider value={{ selectedSponseeId, setSelectedSponseeId }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within a SelectionProvider');
  return ctx;
}
