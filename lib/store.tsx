import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { create, useStore } from "zustand";
import { FAKE_TASKS } from "./fake";
import type { TaskObj } from "./types";

export type TaskID = TaskObj["id"];
type Store = {
  tasks: TaskObj[];
  activeTaskID: TaskID | null;
  setActiveTaskID: (taskID: TaskID) => void;
  removeActiveTaskID: () => void;
  getRootTaskIDs: () => TaskID[];
  getTaskFromID: (taskID: TaskID) => TaskObj | null;
  getTaskChildrenIDs: (taskID: TaskID) => TaskID[];
};

export type TODOStoreAPI = ReturnType<typeof createTODOStore>;

export const TODOStoreContext = createContext<TODOStoreAPI | undefined>(
  undefined,
);

export const TODOStoreProvider = ({ children }: PropsWithChildren) => {
  const [store] = useState(() => createTODOStore(FAKE_TASKS));

  return (
    <TODOStoreContext.Provider value={store}>
      {children}
    </TODOStoreContext.Provider>
  );
};

export const createTODOStore = (tasks: TaskObj[]) =>
  create<Store>()((set,get) => ({
    tasks,
    activeTaskID: null,
    setActiveTaskID(taskID) {
      set({ activeTaskID: taskID });
    },
    removeActiveTaskID() {
      set({ activeTaskID: null });
    },
    getRootTaskIDs() {
      return get().tasks.filter(t => !t.parentId).map(t => t.id);
    },
    getTaskFromID(taskID) {
      return get().tasks.find(t => t.id === taskID) || null;
    },
    getTaskChildrenIDs(taskID) {
      return get().tasks.filter(t => t.parentId === taskID).map(t => t.id);
    },
  }));

export const useTODOStore = <T,>(selector: (store: Store) => T): T => {
  const todoStoreContext = useContext(TODOStoreContext);
  if (!todoStoreContext) {
    throw new Error(`useTODOStore must be used within TODOStoreProvider`);
  }

  return useStore(todoStoreContext, selector);
};
