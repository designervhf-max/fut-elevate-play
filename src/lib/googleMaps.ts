import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google?: any;
    __gmapsLoading__?: Promise<void>;
  }
}

let cachedKey: string | null = null;

async function getKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  const { data, error } = await supabase.functions.invoke('get-maps-key');
  if (error || !data?.key) throw new Error('Não foi possível carregar Google Maps');
  cachedKey = data.key;
  return cachedKey;
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__gmapsLoading__) return window.__gmapsLoading__;

  window.__gmapsLoading__ = (async () => {
    const key = await getKey();
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=pt-BR&region=BR`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar Google Maps'));
      document.head.appendChild(script);
    });
  })();

  return window.__gmapsLoading__;
}

export function useGoogleMaps() {
  const [ready, setReady] = useState(!!window.google?.maps?.places);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (ready) return;
    loadGoogleMaps()
      .then(() => setReady(true))
      .catch((e) => setError(e.message));
  }, [ready]);
  return { ready, error };
}

export interface PlaceResult {
  address: string;
  latitude: number;
  longitude: number;
}

export function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement>,
  onSelect: (p: PlaceResult) => void,
) {
  const { ready } = useGoogleMaps();
  const acRef = useRef<any>(null);

  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'br' },
      fields: ['formatted_address', 'geometry'],
    });
    acRef.current = ac;
    const listener = ac.addListener('place_changed', () => {
      const p = ac.getPlace();
      if (!p?.geometry?.location) return;
      onSelect({
        address: p.formatted_address ?? inputRef.current?.value ?? '',
        latitude: p.geometry.location.lat(),
        longitude: p.geometry.location.lng(),
      });
    });
    return () => listener?.remove?.();
  }, [ready, inputRef, onSelect]);

  return { ready };
}
