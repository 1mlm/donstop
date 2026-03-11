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
  intervalID?: ReturnType<typeof setInterval>;
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
  create<Store>()((set, get) => ({
    tasks,
    activeTaskID: null,
    setActiveTaskID(taskID) {
      const previousActiveTaskID = get().activeTaskID;
      if (previousActiveTaskID) {
        clearInterval(get().intervalID);
        set({ intervalID: undefined });
      }

      set({
        activeTaskID: taskID,
      });

      const intervalID = setInterval(() => {
        const activeTaskID = get().activeTaskID;
        if (!activeTaskID) return;

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === activeTaskID ? { ...t, time: t.time + 1 } : t,
          ),
        }));
      }, 1000);

      console.log(intervalID);

      set({ intervalID });
    },
    removeActiveTaskID() {
      const intervalID = get().intervalID;
      if (intervalID) {
        clearInterval(intervalID);
        set({ activeTaskID: null, intervalID: undefined });
      } else {
        set({ activeTaskID: null });
      }
    },
    getRootTaskIDs() {
      return get()
        .tasks.filter((t) => !t.parentId)
        .map((t) => t.id);
    },
    getTaskFromID(taskID) {
      return get().tasks.find((t) => t.id === taskID) || null;
    },
    getTaskChildrenIDs(taskID) {
      return get()
        .tasks.filter((t) => t.parentId === taskID)
        .map((t) => t.id);
    },
  }));

export const useTODOStore = <T,>(selector: (store: Store) => T): T => {
  const todoStoreContext = useContext(TODOStoreContext);
  if (!todoStoreContext) {
    throw new Error(`useTODOStore must be used within TODOStoreProvider`);
  }

  return useStore(todoStoreContext, selector);
};
