import React from 'react';
import { Plus } from 'lucide-react';

const AddHiveCard = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-2xl cursor-pointer bg-orange-100 hover:bg-orange-200 transition py-5"
    >
      <span className="text-[#F59E0B] font-semibold mb-4">
        Ajouter une ruche
      </span>

      <div className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-[#F59E0B]">
        <Plus className="text-[#F59E0B]" />
      </div>
    </div>
  );
};

export default AddHiveCard;