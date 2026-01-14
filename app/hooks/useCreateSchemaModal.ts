"use client";

import { create } from "zustand";

interface CreateSchemaModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useCreateSchemaModal = create<CreateSchemaModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useCreateSchemaModal;
