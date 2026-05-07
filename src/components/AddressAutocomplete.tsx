import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const SCRIPT_ID = "google-maps-places-script";

type FallbackSuggestion = {
  id: string;
  label: string;
  parsed: ParsedAddress;
};

let loaderPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // @ts-expect-error google global
  if (window.google?.maps?.places) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  if (!GOOGLE_MAPS_API_KEY) {
    // Do NOT cache this rejection — allow retry after env is configured.
    return Promise.reject(
      new Error(
        "Google Maps API key is not configured. Add VITE_GOOGLE_MAPS_API_KEY to the project .env file at the repo root, then restart the dev server.",
      ),
    );
  }
  const promise = new Promise<void>((resolve, reject) => {
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
  // Clear cache on failure so a retry can succeed.
  promise.catch(() => {
    loaderPromise = null;
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) existing.remove();
  });
  loaderPromise = promise;
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

type AddressComponent = { long_name: string; short_name: string; types: string[] };
type PlaceResult = {
  address_components?: AddressComponent[];
  formatted_address?: string;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
};

function parsePlace(place: PlaceResult): ParsedAddress {
  const get = (type: string, short = false) => {
    const c = place.address_components?.find((c: AddressComponent) => c.types.includes(type));
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

function parseFallbackResult(place: NominatimResult): ParsedAddress | null {
  const address = place.address;
  if (!address) return null;
  const province = address.state === "Ontario" ? "ON" : "";
  const country = address.country_code?.toUpperCase() ?? "";
  if (province !== "ON" || country !== "CA") return null;

  return {
    formatted: place.display_name,
    street: [address.house_number, address.road].filter(Boolean).join(" "),
    city: address.city || address.town || address.village || address.municipality || "",
    province,
    postalCode: address.postcode ?? "",
    country,
  };
}

async function fetchFallbackSuggestions(query: string): Promise<FallbackSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: `${trimmed}, Ontario, Canada`,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "ca",
    limit: "5",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Fallback address search failed");
  }

  const results = (await response.json()) as NominatimResult[];
  return results
    .map((result) => {
      const parsed = parseFallbackResult(result);
      if (!parsed) return null;
      return {
        id: String(result.place_id),
        label: parsed.formatted,
        parsed,
      };
    })
    .filter((result): result is FallbackSuggestion => !!result);
}

type Props = {
  value: string;
  onChange: (formatted: string, parsed?: ParsedAddress) => void;
  placeholder?: string;
  onEnter?: () => void;
};

export function AddressAutocomplete({ value, onChange, placeholder, onEnter }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackSuggestions, setFallbackSuggestions] = useState<FallbackSuggestion[]>([]);

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
          const place = ac.getPlace() as PlaceResult;
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
      .catch((e) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "Maps failed to load";
        const refererBlocked = /RefererNotAllowedMapError/i.test(message);
        setUseFallback(refererBlocked);
        setReady(refererBlocked);
        setError(
          refererBlocked
            ? null
            : message ?? "Maps failed to load",
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!useFallback) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetchFallbackSuggestions(value)
        .then((results) => {
          if (!controller.signal.aborted) {
            setFallbackSuggestions(results);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setFallbackSuggestions([]);
            setError("Unable to load address suggestions right now.");
          }
        });
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [useFallback, value]);

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
      {useFallback && fallbackSuggestions.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          {fallbackSuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => {
                setError(null);
                setFallbackSuggestions([]);
                onChange(suggestion.parsed.formatted, suggestion.parsed);
              }}
              className="block w-full border-b border-border px-4 py-3 text-left text-sm text-foreground transition-colors last:border-b-0 hover:bg-muted"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
      {!ready && !error && (
        <p className="text-xs text-muted-foreground">Loading address search…</p>
      )}
      {error && <p className="text-sm text-accent">{error}</p>}
      {ready && !error && (
        <p className="text-xs text-muted-foreground">
          {useFallback ? "Address suggestions limited to Ontario, Canada." : "Addresses limited to Ontario, Canada."}
        </p>
      )}
    </div>
  );
}