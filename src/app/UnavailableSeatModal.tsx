"use client";

import React from "react";

type Props = {
  seatLabel: string;
  selectedSeatStatus: string;
  selectedSeatPrice: number | null;
  onClose: () => void;
};

export default function UnavailableSeatModal({
  seatLabel,
  selectedSeatStatus,
  selectedSeatPrice,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center text-black bg-black/50">
      <div className="bg-white rounded-lg p-6 w-80 text-center">
        <h2 className="text-xl font-bold mb-4">
          Seat Unavailable - {selectedSeatStatus} - ${selectedSeatPrice}
        </h2>
        <p className="mb-6">
          {seatLabel} cannot be reserved because it is not available.
        </p>
        <button
          onClick={onClose}
          className="bg-red-600 text-black px-4 py-2 rounded hover:bg-red-400"
        >
          Close
        </button>
      </div>
    </div>
  );
}
