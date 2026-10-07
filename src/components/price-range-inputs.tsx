"use client";

export function PriceRangeInputs({ minValue, maxValue }: { minValue?: string; maxValue?: string }) {
  const low = Math.min(1000, Math.max(0, Number(minValue) || 0));
  const high = Math.min(1000, Math.max(low, Number(maxValue) || 1000));
  return (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between text-[10px] text-[#657367]">
        <span>${low}</span>
        <span>${high === 1000 ? "1000+" : high}</span>
      </div>
      <label className="block text-[10px] font-medium text-[#56645a]">
        Minimum price
        <input
          name="minPrice"
          type="range"
          min="0"
          max="1000"
          step="5"
          defaultValue={low}
          className="mt-1 block w-full accent-[#1b3b2b]"
        />
      </label>
      <label className="block text-[10px] font-medium text-[#56645a]">
        Maximum price
        <input
          name="maxPrice"
          type="range"
          min="0"
          max="1000"
          step="5"
          defaultValue={high}
          className="mt-1 block w-full accent-[#1b3b2b]"
        />
      </label>
    </div>
  );
}
