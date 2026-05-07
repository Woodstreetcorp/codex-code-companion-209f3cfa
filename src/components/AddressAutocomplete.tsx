import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const SCRIPT_ID = "google-maps-places-script";

let loaderPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // @ts-expect-error google global
  if (window.google?.maps?.places) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }
  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")));
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export type ParsedAddress = {
  formatted: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

function parsePlace(place: google.maps.places.PlaceResult): ParsedAddress {
  const get = (type: string, short = false) => {
    const c = place.address_components?.find((c) => c.types.includes(type));
    return (short ? c?.short_name : c?.long_name) ?? "";
  };
  const streetNumber = get("street_number");
  const route = get("route");
  return {
    formatted: place.formatted_address ?? "",
    street: [streetNumber, route].filter(Boolean).join(" "),
    city: get("locality") || get("postal_town") || get("sublocality"),
    province: get("administrative_area_level_1", true),
    postalCode: get("postal_code"),
    country: get("country", true),
  };
}

type Props = {
  value: string;
  onChange: (formatted: string, parsed?: ParsedAddress) => void;
  placeholder?: string;
  onEnter?: () => void;
};

export function AddressAutocomplete({ value, onChange, placeholder, onEnter }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current) return;
        // @ts-expect-error google global
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "ca" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
        });
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place || !place.address_components) return;
          const parsed = parsePlace(place);
          if (parsed.country !== "CA") {
            setError("Please select an address in Canada.");
            return;
          }
          if (parsed.province !== "ON") {
            setError("Only properties in Ontario are supported at this time.");
            return;
          }
          setError(null);
          onChange(parsed.formatted, parsed);
        });
        acRef.current = ac;
        setReady(true);
      })
      .catch((e) => setError(e.message ?? "Maps failed to load"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl space-y-2">
      <Input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => {
          setError(null);
          onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        placeholder={placeholder ?? "Start typing your address…"}
        className="h-14 text-lg"
        autoComplete="off"
      />
      {!ready && !error && (
        <p className="text-xs text-muted-foreground">Loading address search…</p>
      )}
      {error && <p className="text-sm text-accent">{error}</p>}
      {ready && !error && (
        <p className="text-xs text-muted-foreground">
          Addresses limited to Ontario, Canada.
        </p>
      )}
    </div>
  );
}