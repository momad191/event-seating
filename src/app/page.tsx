"use client";

import React, { useEffect, useState } from "react";
import { PiArmchairFill } from "react-icons/pi";

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

// Status → color mapping
const statusColors: Record<Seat["status"], string> = {
  available: "#22c55e",
  reserved: "#facc15",
  sold: "#ef4444",
  held: "#3b82f6",
};

export default function Page() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return <div className="p-4 text-red-400">{error}</div>;
  if (!venue) return <div className="p-4">Loading venue…</div>;

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="mb-3 text-slate-200 text-lg font-semibold">
        {venue.name ?? "Venue"} — Seating map
      </h1>

      <div
        role="region"
        aria-label={`Seating map for ${venue.name ?? "venue"}`}
        className="relative w-full max-w-[1100px] bg-[#071022] rounded-lg overflow-hidden "
        style={{ aspectRatio: `${venue.map.width} / ${venue.map.height}` }}
      >
        {venue.sections.map((section) => (
          <React.Fragment key={section.id}>
            {/* Section label */}
            {section.rows[0]?.seats.length && (
              <div
                className="mt-4 bg-white text-black px-4 font-semibold"
                style={{
                  position: "absolute",
                  top: section.rows[0].seats[0].y - 30,
                  left:
                    (section.rows[0].seats[0].x +
                      section.rows[0].seats[section.rows[0].seats.length - 1]
                        .x) /
                    2,
                  transform: "translateX(-50%)",
                  // color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                  pointerEvents: "none",
                }}
              >
                {section.label}
              </div>
            )}

            {/* Seats */}
            {section.rows.map((row) =>
              row.seats.map((seat) => (
                <PiArmchairFill
                  className="text-2xl cursor-pointer gap-1 mt-5 mb-8"
                  key={seat.id}
                  size={30}
                  color={statusColors[seat.status]}
                  style={{
                    position: "absolute",
                    top: seat.y - 10, // center the icon
                    left: seat.x - 10,
                  }}
                  title={`${section.label} Row ${row.index}, Seat ${seat.col} — ${seat.status}`}
                />
              ))
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-4">
        {Object.entries(statusColors).map(([status, color]) => (
          <div
            key={status}
            className="flex items-center gap-1.5 text-slate-300  font-bold cursor-pointer"
          >
            <PiArmchairFill color={color} className="cursor-pointer text-3xl" />
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}
