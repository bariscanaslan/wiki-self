"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { FolderTreeNode } from "../../lib/types";

type ModalState =
  | { type: "createFolder"; parent: FolderTreeNode | null }
  | { type: "createDocument"; parent: FolderTreeNode }
  | { type: "rename"; folder: FolderTreeNode }
  | { type: "move"; folder: FolderTreeNode }
  | { type: "delete"; folder: FolderTreeNode }
  | { type: "icon"; folder: FolderTreeNode }
  | { type: "exportAll" }
  | null;

const EXPANDED_STORAGE_KEY = "wikiself.expandedFolders";

interface FolderTreeUIContextValue {
  modal: ModalState;
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
  collapseSignal: number;
  collapseAll: () => void;
  expandedState: Record<string, boolean>;
  setExpanded: (id: string, expanded: boolean) => void;
}

const FolderTreeUIContext = createContext<FolderTreeUIContextValue | undefined>(undefined);

export function FolderTreeUIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [collapseSignal, setCollapseSignal] = useState(0);
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Record<string, boolean>;
      // One-time hydrate from localStorage after mount (SSR has no access to it, so folders
      // fall back to their default expand state for the initial render to avoid a hydration mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedState(parsed);
    } catch {
      window.localStorage.removeItem(EXPANDED_STORAGE_KEY);
    }
  }, []);

  const setExpanded = useCallback((id: string, expanded: boolean) => {
    setExpandedState((prev) => {
      const next = { ...prev, [id]: expanded };
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <FolderTreeUIContext.Provider
      value={{
        modal,
        openModal: setModal,
        closeModal: () => setModal(null),
        collapseSignal,
        collapseAll: () => setCollapseSignal((prev) => prev + 1),
        expandedState,
        setExpanded,
      }}
    >
      {children}
    </FolderTreeUIContext.Provider>
  );
}

export function useFolderTreeUI(): FolderTreeUIContextValue {
  const context = useContext(FolderTreeUIContext);
  if (!context) {
    throw new Error("useFolderTreeUI must be used within a FolderTreeUIProvider");
  }
  return context;
}
