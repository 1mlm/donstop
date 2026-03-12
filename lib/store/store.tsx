"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useStore } from "zustand";
import type { TaskObj } from "../types";
import { createTODOStoreBase, type TODOStoreState } from "./store-create";

export type TODOStoreAPI = ReturnType<typeof createTODOStoreBase>;

export const TODOStoreContext = createContext<TODOStoreAPI | undefined>(
  undefined,
);

export const TODOStoreProvider = ({ children }: PropsWithChildren) => {
  const [store] = useState(() => createTODOStoreBase([]));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <TODOStoreContext.Provider value={store}>
      {children}
    </TODOStoreContext.Provider>
  );
};

export const createTODOStore = (tasks: TaskObj[]) => createTODOStoreBase(tasks);

export const useTODOStore = <T,>(selector: (store: TODOStoreState) => T): T => {
  const todoStoreContext = useContext(TODOStoreContext);

  if (!todoStoreContext) {
    throw new Error(`useTODOStore must be used within TODOStoreProvider`);
  }

  return useStore(todoStoreContext, selector);
};

export type { TaskID } from "./store-model";
