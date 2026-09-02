import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default leaflet marker icons
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

function makeAvatarIcon(initials: string, color: string, selected = false) {
  const size = selected ? 44 : 36;
  const fontSize = selected ? 13 : 11;
  const ring = selected ? `box-shadow:0 0 0 3px white,0 0 0 5px ${color},0 4px 12px rgba(0,0,0,0.25)` : `box-shadow:0 2px 8px rgba(0,0,0,0.2),0 0 0 2px white`;
  return L.divIcon({
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Manrope,sans-serif;font-size:${fontSize}px;font-weight:700;color:white;${ring};cursor:pointer;">${initials}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const TRADES = ['All', 'Plumbing', 'Electrical', 'Handyman', 'Painting', 'Carpentry', 'Cleaning'];

const ARTISANS = [
  { id: 1, name: 'João Silva', trade: 'Plumbing', rating: 4.9, reviews: 47, lat: 38.6405, lng: -9.0950, available: true, initials: 'JS', color: '#3B82F6' },
  { id: 2, name: 'Ana Costa', trade: 'Electrical', rating: 4.8, reviews: 31, lat: 38.6288, lng: -9.1120, available: true, initials: 'AC', color: '#8B5CF6' },
  { id: 3, name: 'Miguel Santos', trade: 'Handyman', rating: 4.7, reviews: 62, lat: 38.6520, lng: -9.1040, available: true, initials: 'MS', color: '#10B981' },
  { id: 4, name: 'Carlos Ferreira', trade: 'Painting', rating: 4.9, reviews: 28, lat: 38.6180, lng: -9.0880, available: false, initials: 'CF', color: '#F59E0B' },
  { id: 5, name: 'Rita Oliveira', trade: 'Cleaning', rating: 4.6, reviews: 85, lat: 38.6610, lng: -9.1200, available: true, initials: 'RO', color: '#EC4899' },
  { id: 6, name: 'Pedro Alves', trade: 'Carpentry', rating: 4.8, reviews: 19, lat: 38.6340, lng: -9.0760, available: true, initials: 'PA', color: '#6366F1' },
  { id: 7, name: 'Sofia Mendes', trade: 'Plumbing', rating: 4.7, reviews: 33, lat: 38.6450, lng: -9.1300, available: false, initials: 'SM', color: '#3B82F6' },
  { id: 8, name: 'Rui Barbosa', trade: 'Electrical', rating: 5.0, reviews: 12, lat: 38.6250, lng: -9.1050, available: true, initials: 'RB', color: '#8B5CF6' },
];

function FlyToMarker({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-manrope font-bold text-sm flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export default function ExplorePage() {
  const [activeTrade, setActiveTrade] = useState('All');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [location, setLocation] = useState('Seixal, Portugal');

  const filtered = activeTrade === 'All'
    ? ARTISANS
    : ARTISANS.filter(a => a.trade === activeTrade);

  const selected = ARTISANS.find(a => a.id === selectedId);

  return (
    <div className="flex h-screen overflow-hidden font-manrope">

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-[380px] flex-shrink-0 flex flex-col bg-white border-r border-df-border z-10 shadow-sm">

        {/* Header */}
        <div className="px-5 py-4 border-b border-df-border flex items-center justify-between">
          <Link to="/" className="font-garamond text-xl text-df-black">Dashfixe</Link>
          <Link to="/" className="text-df-muted hover:text-df-black text-xs font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>

        {/* Location input */}
        <div className="px-5 pt-5 pb-3 space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-df-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm text-df-black bg-df-cream border border-df-border rounded-lg focus:outline-none focus:border-df-primary transition-colors"
              placeholder="Your location"
            />
          </div>

          {/* Trade filter pills */}
          <div className="flex gap-2 flex-wrap">
            {TRADES.map(trade => (
              <button
                key={trade}
                onClick={() => setActiveTrade(trade)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  activeTrade === trade
                    ? 'bg-df-primary text-white border-df-primary'
                    : 'bg-white text-df-muted border-df-border hover:border-df-black hover:text-df-black'
                }`}
              >
                {trade}
              </button>
            ))}
          </div>

          <p className="text-xs text-df-muted">
            <span className="font-semibold text-df-black">{filtered.filter(a => a.available).length} artisans</span> available nearby
          </p>
        </div>

        {/* Artisan list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {filtered.map(artisan => (
            <button
              key={artisan.id}
              onClick={() => setSelectedId(artisan.id === selectedId ? null : artisan.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
                selectedId === artisan.id
                  ? 'border-df-primary bg-df-surface-warm shadow-sm'
                  : 'border-df-border bg-white hover:border-df-primary/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar initials={artisan.initials} color={artisan.color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-df-black truncate">{artisan.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      artisan.available
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                      {artisan.available ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <p className="text-xs text-df-muted mt-0.5">{artisan.trade}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-df-black font-medium">
                      <span className="text-amber-400">★</span>
                      {artisan.rating}
                    </span>
                    <span className="text-xs text-df-muted">{artisan.reviews} reviews</span>
                  </div>
                </div>
              </div>

              {selectedId === artisan.id && (
                <div className="mt-3 pt-3 border-t border-df-border flex gap-2">
                  <Link
                    to="/waitlist"
                    className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-df-primary text-white hover:bg-df-primary-dark transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    Request this Pro
                  </Link>
                  <button className="px-3 py-2 rounded-lg border border-df-border text-xs text-df-muted hover:border-df-black transition-colors">
                    View Profile
                  </button>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP ── */}
      <div className="flex-1 relative">
        <MapContainer
          center={[38.6388, -9.1032]}
          zoom={12}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filtered.map(artisan => (
            <Marker
              key={artisan.id}
              position={[artisan.lat, artisan.lng]}
              icon={makeAvatarIcon(artisan.initials, artisan.color, selectedId === artisan.id)}
              eventHandlers={{ click: () => setSelectedId(artisan.id === selectedId ? null : artisan.id) }}
            >
              <Popup>
                <div className="font-manrope text-sm p-1">
                  <div className="font-semibold text-df-black">{artisan.name}</div>
                  <div className="text-df-muted text-xs">{artisan.trade}</div>
                  <div className="text-xs mt-1">★ {artisan.rating} · {artisan.reviews} reviews</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {selected && <FlyToMarker lat={selected.lat} lng={selected.lng} />}

          {/* Zoom controls — top right */}
          <div className="leaflet-top leaflet-right" style={{ marginTop: '1rem', marginRight: '1rem' }} />
        </MapContainer>

        {/* Floating label */}
        <div className="absolute top-4 left-4 bg-white border border-df-border rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2 z-[400]">
          <svg className="w-4 h-4 text-df-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="font-manrope text-sm font-semibold text-df-black">Seixal & Amora, Portugal</span>
        </div>
      </div>
    </div>
  );
}
