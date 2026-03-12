import { useEffect, type MutableRefObject, type RefObject } from "react";
import type { TaskID } from "@/lib/store";

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
  reopenAfterDragRef,
}: {
  draggingTaskID: TaskID | null;
  taskID: TaskID;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  reopenAfterDragRef: MutableRefObject<boolean>;
}) {
  useEffect(() => {
    if (draggingTaskID === taskID && expanded) {
      setExpanded(false);
      reopenAfterDragRef.current = true;
    }

    if (draggingTaskID !== taskID && reopenAfterDragRef.current) {
      setExpanded(true);
      reopenAfterDragRef.current = false;
    }
  }, [draggingTaskID, expanded, taskID, setExpanded, reopenAfterDragRef]);
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
