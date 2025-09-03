"use client";

import React, { useEffect, useState } from "react";

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

  const { width, height } = venue.map;
  const seatRadius = Math.max(12, width / 100);

  return (
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-[1100px]">
        <h1 className="mb-3 text-slate-200 text-lg font-semibold">
          {venue.name ?? "Venue"} — Seating map
        </h1>

        <div
          role="region"
          aria-label={`Seating map for ${venue.name ?? "venue"}`}
          className="rounded-lg overflow-hidden"
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto block bg-[#071022] rounded-lg"
          >
            {/* Background */}
            <rect x="0" y="0" width={width} height={height} fill="#071022" />

            {/* Render seats */}
            {venue.sections.flatMap((section) =>
              section.rows.flatMap((row) =>
                row.seats.map((seat) => (
                  <circle
                    key={seat.id}
                    cx={seat.x}
                    cy={seat.y}
                    r={seatRadius}
                    fill={statusColors[seat.status]}
                    stroke="#fff"
                    strokeWidth={1.5}
                    // className="bg-black"
                  >
                    <title>
                      {`${section.label} Row ${row.index}, Seat ${seat.col} — ${seat.status}`}
                    </title>
                  </circle>
                ))
              )
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-3 flex gap-4">
          {Object.entries(statusColors).map(([status, color]) => (
            <div
              key={status}
              className="flex items-center gap-1.5 text-slate-300 text-sm"
            >
              <span
                className="inline-block rounded-full border border-white"
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: color,
                }}
              />
              {status}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
