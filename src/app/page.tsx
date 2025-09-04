"use client";

import React, { useEffect, useRef, useState } from "react";
import { PiArmchairFill } from "react-icons/pi";
import AvailableSeatModal from "./AvailableSeatModal";
import UnavailableSeatModal from "./UnavailableSeatModal";
import { useTheme } from "next-themes";
import ThemeToggle from "../components/ThemeToggle";


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

type Reservation = {
  id: string;
  label: string;
  price: number;
};

export default function Page() {
  const { resolvedTheme } = useTheme();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [selectedSeatLabel, setSelectedSeatLabel] = useState("");
  const [selectedSeatStatus, setSelectedSeatStatus] = useState("");
  const [selectedSeatPrice, setSelectedSeatPrice] = useState<number | null>(null);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Load venue.json only (ignore old reservations for summary)
  useEffect(() => {
    const savedVenue = localStorage.getItem("venue");
    if (savedVenue) {
      try {
        const parsed = normalizeVenue(JSON.parse(savedVenue));
        setVenue(parsed);
      } catch (err) {
        console.error("Failed to parse saved venue", err);
      }
    } else {
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
    }

    // load active reservations (cart-like)
    const savedReservations = localStorage.getItem("reservations");
    if (savedReservations) {
      setReservations(JSON.parse(savedReservations));
    }
  }, []);

  // Resize handling
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

  const handleSeatClick = (seat: Seat, sectionLabel: string, rowIndex: number) => {
    const label = `${sectionLabel} Row ${rowIndex} Seat ${seat.col}`;
    setSelectedSeatLabel(label);
    setSelectedSeatStatus(seat.status);
    setSelectedSeatPrice(seat.priceTier);
    setSelectedSeatId(seat.id);

    if (seat.status === "available") {
      setShowAvailableModal(true);
    } else {
      setShowUnavailableModal(true);
    }
  };

  const handleReserve = () => {
    if (!venue || !selectedSeatId || !selectedSeatPrice) return;

    // Check max reservation limit
    if (reservations.length >= 8) {
      alert("You cannot reserve more than 8 seats.");
      setShowAvailableModal(false);
      return;
    }

    // update venue (for UI)
    const updatedVenue = {
      ...venue,
      sections: venue.sections.map((section) => ({
        ...section,
        rows: section.rows.map((row) => ({
          ...row,
          seats: row.seats.map((seat) =>
            seat.id === selectedSeatId ? { ...seat, status: "reserved" as const } : seat
          ),
        })),
      })),
    };

    setVenue(updatedVenue);
    localStorage.setItem("venue", JSON.stringify(updatedVenue));

    // add to cart-like reservations
    const newReservation: Reservation = {
      id: selectedSeatId,
      label: selectedSeatLabel,
      price: selectedSeatPrice,
    };

    const updatedReservations = [...reservations, newReservation];
    setReservations(updatedReservations);
    localStorage.setItem("reservations", JSON.stringify(updatedReservations));

    setShowAvailableModal(false);
  };



  const handleCancelReservation = (reservationId: string) => {
    if (!venue) return;

    // Remove from reservations
    const updatedReservations = reservations.filter(r => r.id !== reservationId);
    setReservations(updatedReservations);
    localStorage.setItem("reservations", JSON.stringify(updatedReservations));

    // Update venue to make the seat available again
    const updatedVenue = {
      ...venue,
      sections: venue.sections.map(section => ({
        ...section,
        rows: section.rows.map(row => ({
          ...row,
          seats: row.seats.map(seat =>
            seat.id === reservationId ? { ...seat, status: "available" as const } : seat
          ),
        })),
      })),
    };
    setVenue(updatedVenue);
    localStorage.setItem("venue", JSON.stringify(updatedVenue));
  };


  useEffect(() => {
    setMounted(true);
  }, []);



  function normalizeVenue(data: any): Venue {
    return {
      ...data,
      sections: data.sections.map((section: any) => ({
        ...section,
        rows: section.rows.map((row: any) => ({
          ...row,
          seats: row.seats.map((seat: any) => ({
            ...seat,
            status: seat.status as Seat["status"],
          })),
        })),
      })),
    };
  }

  if (error) return <div className="p-4 text-red-400">{error}</div>;
  if (!venue) return <div className="p-4">Loading venue…</div>;

  const subtotal = reservations.reduce((sum, r) => sum + r.price, 0);

  return (
    <div className={`p-4 flex flex-col items-center 
    
   
    
            ${!mounted
        ? "bg-white text-black shadow-blue-500/20" // Default (Avoid SSR mismatch)
        : resolvedTheme === "dark"
          ? "bg-[#111827] text-white shadow-blue-500/20"
          : "bg-white text-black shadow-blue-500/20"
      } 
      
      `}

    >
      <div className="flex text-center items-center justify-center gap-3 p-4">
        <ThemeToggle />
        <h1 className="mb-3  text-lg font-semibold">
          {venue.name ?? "Venue"} — Seating map
        </h1>

      </div>
      {/* Seating Map */}
      <div
        ref={containerRef}
        role="region"
        aria-label={`Seating map for ${venue.name ?? "venue"}`}
        className={`relative w-full max-w-[1100px] bg-[#071022] rounded-lg overflow-hidden  shadow-2xl shadow-black/20
                 ${!mounted
            ? "bg-white text-black shadow-blue-500/20" // Default (Avoid SSR mismatch)
            : resolvedTheme === "dark"
              ? "bg-[#111827] text-white shadow-green-500/20"
              : "bg-white text-black shadow-green-500/20"
          }
      `}
        style={{ aspectRatio: `${venue.map.width} / ${venue.map.height}` }}
      >
        {venue.sections.map((section) => (
          <React.Fragment key={section.id}>
            {section.rows[0]?.seats.length && (
              <div
                className="mb-6  gap-6"
                style={{
                  position: "absolute",
                  top: (section.rows[0].seats[0].y - 30) * scale,
                  left:
                    ((section.rows[0].seats[0].x +
                      section.rows[0].seats[section.rows[0].seats.length - 1].x) /
                      2) *
                    scale,
                  transform: "translateX(-50%)",
                  backgroundColor: "white",
                  color: "black",
                  fontWeight: "bold",
                  fontSize: 14 * scale,
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
                  size={28 * scale}
                  color={statusColors[seat.status]}
                  style={{
                    position: "absolute",
                    top: seat.y * scale - 10 * scale,
                    left: seat.x * scale - 10 * scale,
                  }}
                  role="button"
                  aria-label={`${section.label} Row ${row.index}, Seat ${seat.col}, ${seat.status}`}
                  tabIndex={0}
                  title={`${section.label} Row ${row.index}, Seat ${seat.col} — ${seat.status}`}
                  className={`mt-6 mb-6 cursor-pointer  ${seat.id === selectedSeatId ? "pulse-glow" : ""
                    }`}
                  onClick={() => handleSeatClick(seat, section.label, row.index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSeatClick(seat, section.label, row.index);
                    }
                  }}
                />
              ))
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Live Summary (top-right, responsive) */}
      <div
        className={`  p-4 rounded-lg  shadow-lg 
  w-full sm:w-72 sm:fixed sm:top-4 sm:right-4 sm:max-h-[80vh] sm:overflow-y-auto
  mt-4 sm:mt-0 z-50
            ${!mounted
            ? "bg-white text-black shadow-blue-500/20" // Default (Avoid SSR mismatch)
            : resolvedTheme === "dark"
              ? "bg-[#111827] text-white shadow-green-500/20"
              : "bg-white text-black shadow-green-500/20"
          }
  
  `}
      >
        <h2 className="text-lg font-bold mb-2">Live Summary</h2>

        {reservations.length > 0 ? (
          <div className="space-y-4">
            {reservations.map((r) => (
              <div key={r.id} className="flex justify-between items-center">
                <span className="truncate">{r.label}</span>
                <div className="flex items-center gap-2">
                  <span>${r.price}</span>
                  <button
                    onClick={() => handleCancelReservation(r.id)}
                    className="text-red-400 hover:text-red-600 font-bold text-3xl"
                    title="Cancel reservation"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 flex justify-between">
              <span className="font-bold">Subtotal</span>
              <span className="font-bold">${subtotal}</span>
            </div>

            {/* Pay Now Button */}
            <button
              onClick={() => alert("Proceeding to payment...")}
              className="w-full mt-4 py-2 px-4 rounded-lg font-bold text-black 
          bg-gradient-to-r from-green-700 to-green-400 
          hover:from-green-500 hover:to-green-800 
          shadow-lg hover:shadow-2xl
          animate-pulse transition-all duration-500"
            >
              Pay Now
            </button>
          </div>
        ) : (
          <p className="text-slate-400">No reservations yet</p>
        )}
      </div>


      {showAvailableModal && (
        <AvailableSeatModal
          seatLabel={selectedSeatLabel}
          selectedSeatStatus={selectedSeatStatus}
          selectedSeatPrice={selectedSeatPrice}
          onClose={() => {
            setShowAvailableModal(false);
            setSelectedSeatId(null);
          }}
          onReserve={handleReserve}
        />
      )}

      {showUnavailableModal && (
        <UnavailableSeatModal
          seatLabel={selectedSeatLabel}
          selectedSeatStatus={selectedSeatStatus}
          selectedSeatPrice={selectedSeatPrice}
          onClose={() => {
            setShowUnavailableModal(false);
            setSelectedSeatId(null);
          }}
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
