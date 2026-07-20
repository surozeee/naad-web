'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { getGoogleMapsApiKey, loadGoogleMaps } from '@/app/lib/google-maps';
import { resolveTimezone } from '@/app/lib/timezone-from-location';

export type BirthPlaceSelection = {
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  countryCode?: string;
  timezoneSource?: 'google' | 'country' | 'browser';
};

type Props = {
  value: BirthPlaceSelection;
  birthDate?: string;
  onChange: (next: BirthPlaceSelection) => void;
};

function countryFromComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined
): string | undefined {
  const country = components?.find((c) => c.types.includes('country'));
  return country?.short_name;
}

function formatPlace(result: google.maps.GeocoderResult | google.maps.places.PlaceResult): string {
  return result.formatted_address || result.name || 'Selected location';
}

export default function BirthPlaceMapPicker({ value, birthDate, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const onChangeRef = useRef(onChange);
  const birthDateRef = useRef(birthDate);

  const [ready, setReady] = useState(false);
  const [loadingMaps, setLoadingMaps] = useState(true);
  const [resolvingTz, setResolvingTz] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    birthDateRef.current = birthDate;
  }, [birthDate]);

  useEffect(() => {
    if (inputRef.current && value.placeName && inputRef.current.value !== value.placeName) {
      inputRef.current.value = value.placeName;
    }
  }, [value.placeName]);

  async function applyLocation(opts: {
    placeName: string;
    latitude: number;
    longitude: number;
    countryCode?: string;
  }) {
    setResolvingTz(true);
    try {
      const tz = await resolveTimezone({
        latitude: opts.latitude,
        longitude: opts.longitude,
        countryCode: opts.countryCode,
        date: birthDateRef.current,
      });
      onChangeRef.current({
        placeName: opts.placeName,
        latitude: opts.latitude,
        longitude: opts.longitude,
        countryCode: opts.countryCode || tz.countryCode,
        timezone: tz.timezone,
        timezoneSource: tz.source,
      });
    } finally {
      setResolvingTz(false);
    }
  }

  useEffect(() => {
    if (!getGoogleMapsApiKey()) {
      setLoadingMaps(false);
      setMapsError('Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map place selection.');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !mapRef.current || !inputRef.current) return;

        const center = { lat: value.latitude, lng: value.longitude };
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        mapInstance.current = map;
        geocoderRef.current = new google.maps.Geocoder();

        const marker = new google.maps.Marker({
          map,
          position: center,
          draggable: true,
          title: 'Birth place',
        });
        markerRef.current = marker;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name', 'address_components'],
          types: ['geocode'],
        });
        autocomplete.bindTo('bounds', map);
        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const loc = place.geometry?.location;
          if (!loc) return;
          const lat = loc.lat();
          const lng = loc.lng();
          map.panTo({ lat, lng });
          map.setZoom(13);
          marker.setPosition({ lat, lng });
          void applyLocation({
            placeName: formatPlace(place),
            latitude: lat,
            longitude: lng,
            countryCode: countryFromComponents(place.address_components),
          });
        });

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          geocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
            const best = status === 'OK' && results?.[0] ? results[0] : null;
            void applyLocation({
              placeName: best ? formatPlace(best) : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              latitude: lat,
              longitude: lng,
              countryCode: countryFromComponents(best?.address_components),
            });
          });
        });

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (!pos) return;
          const lat = pos.lat();
          const lng = pos.lng();
          geocoderRef.current?.geocode({ location: { lat, lng } }, (results, status) => {
            const best = status === 'OK' && results?.[0] ? results[0] : null;
            void applyLocation({
              placeName: best ? formatPlace(best) : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              latitude: lat,
              longitude: lng,
              countryCode: countryFromComponents(best?.address_components),
            });
          });
        });

        setReady(true);
        setMapsError(null);
      } catch (err) {
        setMapsError(err instanceof Error ? err.message : 'Could not load Google Maps');
      } finally {
        if (!cancelled) setLoadingMaps(false);
      }
    })();

    return () => {
      cancelled = true;
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      markerRef.current = null;
      mapInstance.current = null;
    };
    // Initialize once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapInstance.current || !markerRef.current) return;
    const pos = { lat: value.latitude, lng: value.longitude };
    markerRef.current.setPosition(pos);
    mapInstance.current.panTo(pos);
  }, [ready, value.latitude, value.longitude]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Search place (Google Maps)
        </label>
        <div className="relative">
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            ref={inputRef}
            defaultValue={value.placeName}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="Type city or address…"
            autoComplete="off"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Search or click the map. Timezone updates from the selected country / coordinates.
        </p>
      </div>

      <style>{`.pac-container{z-index:10050!important;}`}</style>

      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-900/40">
        {(loadingMaps || resolvingTz) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/70 dark:bg-slate-900/60 text-sm text-gray-600 dark:text-gray-300">
            <Loader2 className="animate-spin" size={16} />
            {loadingMaps ? 'Loading map…' : 'Resolving timezone…'}
          </div>
        )}
        <div ref={mapRef} className="w-full h-56 sm:h-64" />
      </div>

      {mapsError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {mapsError}
        </div>
      )}

      <div className="grid sm:grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
          <input
            value={value.timezone}
            readOnly
            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            title={
              value.timezoneSource
                ? `Resolved via ${value.timezoneSource}${value.countryCode ? ` (${value.countryCode})` : ''}`
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
