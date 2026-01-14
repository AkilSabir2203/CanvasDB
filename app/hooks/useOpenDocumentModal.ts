"use client";

import { create } from "zustand";

interface OpenDocumentModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useOpenDocumentModal = create<OpenDocumentModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useOpenDocumentModal;
