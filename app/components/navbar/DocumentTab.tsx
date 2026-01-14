"use client";

import { Plus, File, ChevronDown } from "lucide-react";
import useCreateSchemaModal from "@/app/hooks/useCreateSchemaModal";

const Search = () => {
  const fileName = "Untitled";
  const createSchemaModal = useCreateSchemaModal();

  return (
      <div className="flex flex-row items-center gap-2">
        {/* Inner pill: Create */}
        <button
          className="
            flex items-center gap-2
            px-4 py-2
            rounded-full
          hover:bg-gray-50
            text-sm font-semibold
            transition shadow-sm hover:shadow-md border-[1px] border-neutral-200 cursor-pointer
          "
          onClick={() => {
            createSchemaModal.onOpen();
          }}
        >
          <Plus size={18} className="h-6 w-6 text-white rounded-full bg-purple-600" />
          Create
        </button>

        {/* Inner pill: File name */}
        <button
          className="
            flex items-center gap-2
            px-4 py-2
            rounded-full
            bg-gray-100 hover:bg-gray-50
            text-sm font-semibold
            transition shadow-sm hover:shadow-md border-[1px] border-neutral-200 cursor-pointer
          "
          onClick={() => {
            console.log("Switch file");
          }}
        >
          <File size={18} />
          {fileName}
          <ChevronDown size={16} />
        </button>
      </div>
  );
};

export default Search;
