"use client";

import React, { useEffect, useRef, useState } from "react";
import { PiArmchairFill } from "react-icons/pi";
import AvailableSeatModal from "./AvailableSeatModal";
import UnavailableSeatModal from "./UnavailableSeatModal";

type Seat = {
  id: string;
  col: number;
  x: number;
  y: number;
  priceTier: number;
  status: "available" | "reserved" | "sold" | "held";
};

type Row = {
  index: number;
  seats: Seat[];
};

type Section = {
  id: string;
  label: string;
  transform: { x: number; y: number; scale: number };
  rows: Row[];
};

type Venue = {
  venueId: string;
  name: string;
  map: { width: number; height: number };
  sections: Section[];
};

const statusColors: Record<Seat["status"], string> = {
  available: "#22c55e",
  reserved: "#facc15",
  sold: "#ef4444",
  held: "#3b82f6",
};

export default function Page() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const [selectedSeatLabel, setSelectedSeatLabel] = useState("");
  const [selectedSeatStatus, setSelectedSeatStatus] = useState("");
  const [selectedSeatPrice, setSelectedSeatPrice] = useState<number | null>(
    null
  );
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  useEffect(() => {
    fetch("/venue.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Venue) => setVenue(data))
      .catch((err) => {
        console.error("Failed to load venue.json", err);
        setError("Failed to load venue.json (check console)");
      });
  }, []);

  useEffect(() => {
    function handleResize() {
      if (!containerRef.current || !venue) return;
      const containerWidth = containerRef.current.offsetWidth;
      setScale(containerWidth / venue.map.width);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [venue]);

  const handleSeatClick = (
    seat: Seat,
    sectionLabel: string,
    rowIndex: number
  ) => {
    const label = `${sectionLabel} Row ${rowIndex} Seat ${seat.col}`;
    setSelectedSeatLabel(label);
    setSelectedSeatStatus(seat.status);
    setSelectedSeatPrice(seat.priceTier);

    if (seat.status === "available") {
      setShowAvailableModal(true);
    } else {
      setShowUnavailableModal(true);
    }
  };

  const handleReserve = () => {
    console.log("Seat reserved:", selectedSeatLabel);
    setShowAvailableModal(false);
  };

  if (error) return <div className="p-4 text-red-400">{error}</div>;
  if (!venue) return <div className="p-4">Loading venue…</div>;

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="mb-3 text-slate-200 text-lg font-semibold">
        {venue.name ?? "Venue"} — Seating map
      </h1>

      <div
        ref={containerRef}
        role="region"
        aria-label={`Seating map for ${venue.name ?? "venue"}`}
        className="relative w-full max-w-[1100px] bg-[#071022] rounded-lg overflow-hidden"
        style={{ aspectRatio: `${venue.map.width} / ${venue.map.height}` }}
      >
        {venue.sections.map((section) => (
          <React.Fragment key={section.id}>
            {section.rows[0]?.seats.length && (
              <div
                className="mb-4"
                style={{
                  position: "absolute",
                  top: (section.rows[0].seats[0].y - 30) * scale,
                  left:
                    ((section.rows[0].seats[0].x +
                      section.rows[0].seats[section.rows[0].seats.length - 1]
                        .x) /
                      2) *
                    scale,
                  transform: "translateX(-50%)",
                  backgroundColor: "white",
                  color: "black",
                  fontWeight: "bold",
                  fontSize: 16 * scale,
                  padding: `${4 * scale}px ${8 * scale}px`,
                  borderRadius: 4 * scale,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {section.label}
              </div>
            )}

            {section.rows.map((row) =>
              row.seats.map((seat) => (
                <PiArmchairFill
                  key={seat.id}
                  size={20 * scale}
                  color={statusColors[seat.status]}
                  style={{
                    position: "absolute",
                    top: seat.y * scale - 10 * scale,
                    left: seat.x * scale - 10 * scale,
                  }}
                  title={`${section.label} Row ${row.index}, Seat ${seat.col} — ${seat.status}`}
                  className="cursor-pointer"
                  onClick={() =>
                    handleSeatClick(seat, section.label, row.index)
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSeatClick(seat, section.label, row.index);
                    }
                  }}
                />
              ))
            )}
          </React.Fragment>
        ))}
      </div>

      {showAvailableModal && (
        <AvailableSeatModal
          seatLabel={selectedSeatLabel}
          selectedSeatStatus={selectedSeatStatus}
          selectedSeatPrice={selectedSeatPrice}
          onClose={() => setShowAvailableModal(false)}
          onReserve={handleReserve}
        />
      )}

      {showUnavailableModal && (
        <UnavailableSeatModal
          seatLabel={selectedSeatLabel}
          selectedSeatStatus={selectedSeatStatus}
          selectedSeatPrice={selectedSeatPrice}
          onClose={() => setShowUnavailableModal(false)}
        />
      )}

      <div className="mt-3 flex gap-4 flex-wrap justify-center">
        {Object.entries(statusColors).map(([status, color]) => (
          <div
            key={status}
            className="flex items-center gap-1.5 text-slate-300 font-bold cursor-pointer"
          >
            <PiArmchairFill color={color} className="text-3xl" />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}
