import { type MutableRefObject, type RefObject, useEffect } from "react";
import type { TaskID } from "@/lib/store";

const expandedBeforeSelfDrag = new Map<TaskID, boolean>();

export function useTaskAutoExpandOnChildrenEffect({
  childrenCount,
  expanded,
  setExpanded,
  prevChildrenCountRef,
}: {
  childrenCount: number;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  prevChildrenCountRef: MutableRefObject<number>;
}) {
  useEffect(() => {
    if (childrenCount > prevChildrenCountRef.current && !expanded) {
      setExpanded(true);
    }

    prevChildrenCountRef.current = childrenCount;
  }, [childrenCount, expanded, setExpanded, prevChildrenCountRef]);
}

export function useTaskCollapseWhileDraggingEffect({
  draggingTaskID,
  taskID,
  expanded,
  setExpanded,
}: {
  draggingTaskID: TaskID | null;
  taskID: TaskID;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}) {
  useEffect(() => {
    if (draggingTaskID === taskID) {
      if (!expandedBeforeSelfDrag.has(taskID)) {
        expandedBeforeSelfDrag.set(taskID, expanded);
      }

      if (expanded) {
        setExpanded(false);
      }

      return;
    }

    const wasExpandedBeforeDrag = expandedBeforeSelfDrag.get(taskID);
    if (wasExpandedBeforeDrag && !expanded) {
      setExpanded(true);
    }

    if (wasExpandedBeforeDrag !== undefined) {
      expandedBeforeSelfDrag.delete(taskID);
    }
  }, [draggingTaskID, expanded, taskID, setExpanded]);
}

export function useTaskEditValueSyncEffect({
  taskLabel,
  setEditValue,
}: {
  taskLabel: string;
  setEditValue: (value: string) => void;
}) {
  useEffect(() => {
    setEditValue(taskLabel);
  }, [taskLabel, setEditValue]);
}

export function useTaskEditableFocusEffect({
  isEditing,
  taskLabel,
  editInputRef,
}: {
  isEditing: boolean;
  taskLabel: string;
  editInputRef: RefObject<HTMLSpanElement | null>;
}) {
  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const editableEl = editInputRef.current;
    if (!editableEl) {
      return;
    }

    // Keep contentEditable uncontrolled during typing to avoid caret jumps.
    editableEl.textContent = taskLabel;

    editableEl.focus();
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editableEl);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [isEditing, taskLabel, editInputRef]);
}

export function useTaskTimeoutCleanupEffect(
  timeoutRefs: Array<MutableRefObject<number | null>>,
) {
  useEffect(() => {
    return () => {
      for (const timeoutRef of timeoutRefs) {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };
  }, [timeoutRefs]);
}

export function useActionsMenuViewportSyncEffect({
  actionsMenuOpen,
  updateActionsMenuPosition,
}: {
  actionsMenuOpen: boolean;
  updateActionsMenuPosition: () => void;
}) {
  useEffect(() => {
    if (!actionsMenuOpen) {
      return;
    }

    const handleViewportChange = () => {
      updateActionsMenuPosition();
    };

    handleViewportChange();
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [actionsMenuOpen, updateActionsMenuPosition]);
}
