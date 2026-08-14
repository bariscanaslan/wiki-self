"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
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

interface FolderTreeUIContextValue {
  modal: ModalState;
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
  collapseSignal: number;
  collapseAll: () => void;
}

const FolderTreeUIContext = createContext<FolderTreeUIContextValue | undefined>(undefined);

export function FolderTreeUIProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [collapseSignal, setCollapseSignal] = useState(0);

  return (
    <FolderTreeUIContext.Provider
      value={{
        modal,
        openModal: setModal,
        closeModal: () => setModal(null),
        collapseSignal,
        collapseAll: () => setCollapseSignal((prev) => prev + 1),
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
