"use client";

import { createContext, useContext } from "react";
import type { WeightUnit } from "@/lib/utils/weight";

interface WeightUnitContextValue {
  weightUnit: WeightUnit;
}

const WeightUnitContext = createContext<WeightUnitContextValue>({
  weightUnit: "g",
});

interface WeightUnitProviderProps {
  weightUnit: WeightUnit;
  children: React.ReactNode;
}

export function WeightUnitProvider({ weightUnit, children }: WeightUnitProviderProps) {
  return (
    <WeightUnitContext.Provider value={{ weightUnit }}>
      {children}
    </WeightUnitContext.Provider>
  );
}

export function useWeightUnit(): WeightUnit {
  return useContext(WeightUnitContext).weightUnit;
}
