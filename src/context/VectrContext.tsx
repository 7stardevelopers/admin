import React, { createContext, useContext, useMemo, useState } from 'react';

export type VectrMode = 'login' | 'ambient';

interface VectrContextValue {
  mode: VectrMode;
  setMode: (m: VectrMode) => void;
}

const VectrContext = createContext<VectrContextValue>({
  mode: 'ambient',
  setMode: () => {},
});

export function VectrProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<VectrMode>('ambient');
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <VectrContext.Provider value={value}>{children}</VectrContext.Provider>;
}

export function useVectr() {
  return useContext(VectrContext);
}
