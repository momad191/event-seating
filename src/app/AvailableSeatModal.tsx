"use client";

import React from "react";

type Props = { 
  seatLabel: string;
  selectedSeatStatus: string;
  selectedSeatPrice: number | null;
  onClose: () => void;
  onReserve: () => void;
};

export default function AvailableSeatModal({
  seatLabel,
  selectedSeatStatus,
  selectedSeatPrice,
  onClose,
  onReserve, 
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center text-black bg-black/50">
      <div className="bg-white rounded-lg p-6 w-80 text-center">
        <h2 className="text-xl font-bold mb-4">
          Reserve Seat -{selectedSeatStatus} - ${selectedSeatPrice}
        </h2>
        <p className="mb-6">
          {seatLabel} is available. Do you want to reserve it?
        </p>
        <div className="flex justify-between gap-2">
          <button
            onClick={onReserve}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Reserve
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
