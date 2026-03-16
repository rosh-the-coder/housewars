"use client";

import { useMemo, useState } from "react";

type House = {
  id: string;
  name: string;
  hex_code: string | null;
};

type HouseTone = {
  label: string;
  color: string;
  rank: number;
};

const FALLBACK_COLOR = "#555555";

function normalizeHouse(house: House): HouseTone {
  const normalized = house.name.trim().toLowerCase();
  const hex = (house.hex_code ?? "").toLowerCase();

  if (normalized.includes("phoenix") || normalized.includes("red") || hex.includes("dc2626")) {
    return { label: "PHOENIX", color: "#DC2626", rank: 0 };
  }
  if (normalized.includes("tsunami") || normalized.includes("blue") || hex.includes("2563eb")) {
    return { label: "TSUNAMI", color: "#2563EB", rank: 1 };
  }
  if (normalized.includes("viper") || normalized.includes("green") || hex.includes("16a34a")) {
    return { label: "VIPER", color: "#16A34A", rank: 2 };
  }
  if (normalized.includes("thunder") || normalized.includes("yellow") || hex.includes("ca8a04")) {
    return { label: "THUNDER", color: "#CA8A04", rank: 3 };
  }

  return {
    label: house.name.trim().toUpperCase(),
    color: house.hex_code ?? FALLBACK_COLOR,
    rank: 99,
  };
}

export function HouseSelector({ houses }: { houses: House[] }) {
  const items = useMemo(() => {
    return houses
      .map((house) => ({ house, tone: normalizeHouse(house) }))
      .sort((a, b) => a.tone.rank - b.tone.rank || a.house.name.localeCompare(b.house.name));
  }, [houses]);

  const [selectedId, setSelectedId] = useState(items[0]?.house.id ?? "");

  if (!items.length) {
    return null;
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-[11px] font-bold tracking-[0.18em] text-[#999999]">CHOOSE YOUR HOUSE</legend>
      <input type="hidden" name="house_id" value={selectedId} />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ house, tone }) => {
          const isSelected = house.id === selectedId;
          return (
            <button
              key={house.id}
              type="button"
              onClick={() => setSelectedId(house.id)}
              className="h-[72px] border-[3px] transition"
              style={{
                background: isSelected ? tone.color : "#1A1A1A",
                borderColor: isSelected ? "#FFFFFF" : tone.color,
                color: isSelected ? "#FFFFFF" : tone.color,
              }}
            >
              <span className="flex flex-col items-center justify-center gap-1 text-center">
                <span className="text-xs font-extrabold tracking-[0.08em]">{tone.label}</span>
                {isSelected ? <span className="text-[9px] font-bold tracking-[0.1em] text-white/70">★ SELECTED</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
