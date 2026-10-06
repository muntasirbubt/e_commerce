"use client";
import { useState } from "react";
type Image = { id?: string; url: string; alt: string };
export function ProductGallery({
  images,
  fallbackAlt,
}: {
  images: Image[];
  fallbackAlt: string;
}) {
  const list = images.length ? images : [{ url: "", alt: fallbackAlt }];
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_65%_35%,#c8d9c8_0%,#eaf0e8_48%,#f4f5f1_100%)]">
        {list[active].url ? (
          <img
            src={list[active].url}
            alt={list[active].alt || fallbackAlt}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full place-items-center font-serif text-9xl text-[#52745b]/35">
            {fallbackAlt.slice(0, 1)}
          </div>
        )}
        <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-white/85 px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#1b3b2b] opacity-0 backdrop-blur transition group-hover:opacity-100">
          Hover to explore
        </span>
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {images.map((image, i) => (
            <button
              key={image.id ?? image.url}
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded-xl border-2 bg-[#edf1eb] ${active === i ? "border-[#1b3b2b]" : "border-transparent"}`}
              aria-label={`View image ${i + 1}`}
            >
              {image.url && (
                <img
                  src={image.url}
                  alt={image.alt || fallbackAlt}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
