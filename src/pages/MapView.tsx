import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageTransition } from '@/components/PageTransition';
import { GlowCard } from '@/components/effects/GlowCard';
import { StaggerList } from '@/components/effects/StaggerList';
import { providersApi } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { useVectr } from '@/context/VectrContext';
import { MapPin, Wifi, Activity, WifiOff } from 'lucide-react';

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const STALE_MS = 15 * 60 * 1000; // 15 minutes with no ping = considered stale

type ProviderLocation = {
  provider_id: string;
  name: string;
  status: string;
  is_available: boolean;
  last_lat: number | null;
  last_lng: number | null;
  last_seen_at: string | null;
};

function isStale(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return true;
  return Date.now() - new Date(lastSeenAt).getTime() > STALE_MS;
}

export default function MapView() {
  const { setMode } = useVectr();
  useEffect(() => { setMode('ambient'); }, [setMode]);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['provider-locations'],
    queryFn: async () => (await providersApi.getLocations()).data.data as ProviderLocation[],
    refetchInterval: 15000,
  });

  const providers = data ?? [];
  const withCoords = providers.filter(p => p.last_lat != null && p.last_lng != null);
  const onlineCount = providers.filter(p => p.is_available).length;
  const staleCount = withCoords.filter(p => isStale(p.last_seen_at)).length;

  const center = useMemo(() => {
    if (withCoords.length === 0) return INDIA_CENTER;
    const lat = withCoords.reduce((s, p) => s + Number(p.last_lat), 0) / withCoords.length;
    const lng = withCoords.reduce((s, p) => s + Number(p.last_lng), 0) / withCoords.length;
    return { lat, lng };
  }, [withCoords]);

  // Load the SDK once and create the map instance.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !mapDivRef.current || mapRef.current) return;
        mapRef.current = new g.maps.Map(mapDivRef.current, {
          center,
          zoom: withCoords.length ? 11 : 5,
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
        });
        infoWindowRef.current = new g.maps.InfoWindow();
        setMapReady(true);
      })
      .catch((e) => setMapsError(e.message ?? 'Could not load Google Maps'));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers whenever the provider list refreshes.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const g = window.google;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = withCoords.map((p) => {
      const stale = isStale(p.last_seen_at);
      const color = !p.is_available ? '#9ca3af' : stale ? '#f59e0b' : '#34d399';
      const marker = new g.maps.Marker({
        position: { lat: Number(p.last_lat), lng: Number(p.last_lng) },
        map: mapRef.current!,
        title: p.name,
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      marker.addListener('click', () => {
        const staleNote = stale && p.is_available ? '<br/><span style="color:#f59e0b">⚠ Stale location</span>' : '';
        infoWindowRef.current?.setContent(`
          <div style="font-size:13px;line-height:1.5;color:#0f172a;">
            <strong>${p.name}</strong><br/>
            ${p.is_available ? 'Online' : 'Offline'} · ${p.status}<br/>
            Last seen: ${p.last_seen_at ? timeAgo(p.last_seen_at) : 'never'}${staleNote}
          </div>
        `);
        infoWindowRef.current?.open({ map: mapRef.current!, anchor: marker });
      });
      return marker;
    });
  }, [withCoords, mapReady]);

  // Re-center once we actually have real coordinates (initial load starts at India center).
  useEffect(() => {
    if (mapReady && mapRef.current && withCoords.length) {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(11);
    }
  }, [mapReady, center, withCoords.length]);

  const statCards = [
    { label: 'Online Providers', value: onlineCount,       icon: Wifi,     color: '#34d399' },
    { label: 'Tracked on Map',   value: withCoords.length,  icon: Activity, color: '#ffb238' },
    { label: 'Stale (>15m)',     value: staleCount,          icon: WifiOff,  color: '#f87171' },
  ];

  return (
    <PageTransition>
      <DashboardLayout title="Live Provider Map" subtitle="Real-time provider locations from the field">
        {/* Stats row */}
        <StaggerList
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <GlowCard
              key={label}
              glowColor={`${color}26`}
              className="glass-card"
              style={{
                padding: '18px 20px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                style={{
                  width: 40, height: 40, borderRadius: '10px',
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={18} style={{ color }} />
              </motion.div>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--mono)', color }}>{value}</p>
                <p style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>
                  {label}
                </p>
              </div>
            </GlowCard>
          ))}
        </StaggerList>

        <div style={{
          position: 'relative',
          height: 'calc(100vh - 280px)',
          minHeight: '480px',
          borderRadius: '20px',
          border: '1px solid rgba(37,99,235,0.14)',
          overflow: 'hidden',
        }}>
          {mapsError ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: 'var(--muted)' }}>
              <MapPin size={32} style={{ opacity: 0.5 }} />
              <p style={{ fontSize: '13px' }}>{mapsError}</p>
            </div>
          ) : (
            <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />
          )}

          {/* Top-left legend chip */}
          <GlowCard
            style={{
              position: 'absolute', top: 16, left: 16, zIndex: 10,
              background: 'rgba(255,255,255,0.90)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(37,99,235,0.20)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          >
            <MapPin size={15} style={{ color: 'var(--amber)' }} />
            <span style={{
              fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 700,
              color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {isLoading ? 'Loading…' : `${withCoords.length} providers on map`}
            </span>
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 8px #34d399',
                marginLeft: 4,
              }}
            />
          </GlowCard>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
}
