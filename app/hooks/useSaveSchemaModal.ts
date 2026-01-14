"use client";

import { create } from "zustand";

interface SaveSchemaModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useSaveSchemaModal = create<SaveSchemaModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useSaveSchemaModal;
