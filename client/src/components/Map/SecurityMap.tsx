import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PARIS_TRANSPORT_HUBS } from '../../data/ratpHubs';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident } from '../../types';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Train, 
  Navigation, 
  Layers, 
  Shield, 
  ShieldCheck, 
  Clock,
  Users,
  X
} from 'lucide-react';

// Custom Map Controller to smoothly pan/zoom and resize
const MapController: React.FC = () => {
  const map = useMap();
  const flyTarget = useIncidentStore((state) => state.flyTarget);

  // Force size recalculation upon mounting & window resize
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  useEffect(() => {
    if (flyTarget) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 15, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [flyTarget, map]);

  return null;
};

// Custom DivIcons for Leaflet
const createIncidentIcon = (severity: Incident['severity'], reportsCount?: number) => {
  const badgeHtml = reportsCount && reportsCount > 1
    ? `<span class="absolute -top-1.5 -right-2 px-1 py-0.5 bg-slate-950 text-amber-300 font-mono font-black text-[9px] rounded-full border border-amber-400 shadow-md">×${reportsCount}</span>`
    : '';

  switch (severity) {
    case 'danger':
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-red-500 opacity-60"></span>
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white border-2 border-white shadow-xl shadow-red-950">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            ${badgeHtml}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

    case 'warning':
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-slate-950 border-2 border-amber-200 shadow-lg shadow-amber-950">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            ${badgeHtml}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

    case 'safe':
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white border-2 border-white shadow-md shadow-emerald-950">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            ${badgeHtml}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
      });
  }
};

const createStationIcon = (status: 'normal' | 'disrupted' | 'closed') => {
  const bgClass =
    status === 'closed'
      ? 'bg-rose-900 border-rose-400 text-rose-200'
      : status === 'disrupted'
      ? 'bg-amber-900 border-amber-400 text-amber-200'
      : 'bg-indigo-900 border-indigo-400 text-indigo-200';

  return L.divIcon({
    className: 'custom-station-marker',
    html: `
      <div class="flex items-center justify-center w-6 h-6 rounded-lg border ${bgClass} shadow-md text-xs font-bold font-mono">
        M
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

const createRoutePinIcon = (type: 'origin' | 'destination') => {
  const isOrigin = type === 'origin';
  return L.divIcon({
    className: 'custom-route-pin',
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-full ${
        isOrigin ? 'bg-emerald-500 border-2 border-white' : 'bg-rose-500 border-2 border-white'
      } shadow-xl text-white font-bold text-[11px] font-mono">
        ${isOrigin ? 'A' : 'B'}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const SecurityMap: React.FC = () => {
  const {
    incidents,
    setSelectedIncident,
    showDangerRadius,
    showTransports,
    toggleDangerRadius,
    toggleTransports,
    flyTo,
    voteIncident,
    activeSafeRoute,
    clearSafeRoute,
  } = useIncidentStore();

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden select-none bg-slate-100">
      <MapContainer
        center={[48.8566, 2.3522]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
        className="w-full h-full z-0"
      >
        <MapController />

        {/* Fond de Carte OpenStreetMap France Officiel Standard */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          subdomains="abc"
          maxZoom={20}
        />

        {/* Hazard Perimeter Circles */}
        {showDangerRadius &&
          incidents.map((incident) => {
            const isDanger = incident.severity === 'danger';
            const isWarning = incident.severity === 'warning';
            return (
              <Circle
                key={`circle-${incident.id}`}
                center={[incident.lat, incident.lng]}
                radius={isDanger ? 380 : isWarning ? 220 : 140}
                pathOptions={{
                  color: isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
                  fillColor: isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981',
                  fillOpacity: isDanger ? 0.22 : isWarning ? 0.14 : 0.08,
                  weight: isDanger ? 1.5 : 1,
                  dashArray: isDanger ? '6 6' : undefined,
                }}
              />
            );
          })}

        {/* Incident Markers */}
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.lat, incident.lng]}
            icon={createIncidentIcon(incident.severity, incident.reports_count)}
            eventHandlers={{
              click: () => setSelectedIncident(incident),
            }}
          >
            <Popup className="pulse-popup">
              <div className="p-1 min-w-[250px] text-slate-100">
                <div className="flex items-center justify-between pb-2 border-b border-dark-700/80 mb-2">
                  <div className="flex items-center space-x-1.5">
                    {incident.severity === 'danger' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                    {incident.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    {incident.severity === 'safe' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    <span className="text-xs uppercase font-bold tracking-wider font-mono">
                      {incident.severity === 'danger' ? 'Danger Élevé' : incident.severity === 'warning' ? 'Tension' : 'Zone Sécurisée'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Cluster & TTL Info Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 bg-dark-900/90 px-2 py-1 rounded border border-dark-700/80 mb-2">
                  <span className="flex items-center gap-1 font-semibold text-amber-300">
                    <Users className="w-3 h-3 text-amber-400" />
                    <span>{incident.reports_count && incident.reports_count > 1 ? `${incident.reports_count} signalements` : '1 signalement'}</span>
                  </span>
                  {incident.expires_at && (
                    <span className="flex items-center gap-1 text-slate-400" title={`Expire à ${new Date(incident.expires_at).toLocaleTimeString()}`}>
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{new Date(incident.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  )}
                </div>

                <h4 className="font-semibold text-xs text-white leading-tight mb-1.5">
                  {incident.location_name}
                </h4>

                <p className="text-xs text-slate-300 leading-snug mb-2.5">
                  {incident.description}
                </p>

                {/* Reliability gauge in popup */}
                <div className="mb-2.5 bg-dark-900/80 p-2 rounded-lg border border-dark-700">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Fiabilité</span>
                    </span>
                    <span className="font-bold text-slate-200">
                      {Math.round((incident.reliability_score ?? 0.5) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        (incident.reliability_score ?? 0.5) >= 0.8
                          ? 'bg-emerald-500'
                          : (incident.reliability_score ?? 0.5) >= 0.6
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.round((incident.reliability_score ?? 0.5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-dark-700 text-[11px] text-slate-400">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[110px]" title={incident.source}>
                    {incident.source}
                  </span>
                  
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        voteIncident(incident.id, 'up');
                      }}
                      className="flex items-center space-x-1 px-2 py-1 rounded bg-dark-800 hover:bg-slate-700 text-slate-200 transition text-xs"
                      title="Voter pour confirmer ce signalement (Upvote)"
                    >
                      <ThumbsUp className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono font-bold text-[10px]">{incident.upvotes}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        voteIncident(incident.id, 'down');
                      }}
                      className="flex items-center space-x-1 px-2 py-1 rounded bg-dark-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition text-xs"
                      title="Contester ce signalement (Downvote)"
                    >
                      <ThumbsDown className="w-3 h-3 text-rose-400" />
                      {incident.downvotes !== undefined && incident.downvotes > 0 && (
                        <span className="font-mono text-[10px]">{incident.downvotes}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Transport Station Markers */}
        {showTransports &&
          PARIS_TRANSPORT_HUBS.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={createStationIcon(station.status)}
            >
              <Popup>
                <div className="p-1 min-w-[230px] text-slate-100">
                  <div className="flex items-center justify-between pb-1.5 border-b border-dark-700/80 mb-2">
                    <span className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Train className="w-3.5 h-3.5 text-indigo-400" />
                      {station.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                        station.status === 'closed'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : station.status === 'disrupted'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {station.status === 'closed' ? 'Fermée' : station.status === 'disrupted' ? 'Perturbée' : 'Normale'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {station.lines.map((line) => (
                      <span key={line} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-dark-800 text-slate-200 border border-dark-700">
                        {line}
                      </span>
                    ))}
                  </div>

                  {station.incident_desc && (
                    <p className="text-xs text-slate-300 leading-snug">
                      {station.incident_desc}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        {/* Active Safe Route Layer */}
        {activeSafeRoute && (
          <>
            {/* Direct Unsafe Path (Dashed Red Line) */}
            <Polyline
              positions={activeSafeRoute.directPath}
              pathOptions={{
                color: '#ef4444',
                weight: 2.5,
                dashArray: '6 8',
                opacity: 0.6,
              }}
            />

            {/* Safe Route (Solid Vibrant Emerald Neon Line) */}
            <Polyline
              positions={activeSafeRoute.safePath}
              pathOptions={{
                color: '#10b981',
                weight: 5,
                opacity: 0.95,
              }}
            />

            {/* Origin Pin (A) */}
            <Marker
              position={[activeSafeRoute.origin.lat, activeSafeRoute.origin.lng]}
              icon={createRoutePinIcon('origin')}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold text-emerald-400">Départ :</span>
                  <p className="text-white mt-0.5">{activeSafeRoute.origin.address}</p>
                </div>
              </Popup>
            </Marker>

            {/* Destination Pin (B) */}
            <Marker
              position={[activeSafeRoute.destination.lat, activeSafeRoute.destination.lng]}
              icon={createRoutePinIcon('destination')}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold text-rose-400">Arrivée :</span>
                  <p className="text-white mt-0.5">{activeSafeRoute.destination.address}</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Floating Active Route Banner (Top Center) */}
      {activeSafeRoute && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-dark-900/95 border border-emerald-500/40 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white">Tracé Safe Actif</span>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded">
              {activeSafeRoute.safetyScore}% Sûr
            </span>
            <span className="text-slate-300">
              ({activeSafeRoute.safeDistanceKm} km · ~{activeSafeRoute.safeDurationMin} min)
            </span>
          </div>

          <button
            onClick={clearSafeRoute}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition"
            title="Effacer l'itinéraire de la carte"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Map Action Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button
          onClick={toggleDangerRadius}
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-xl transition flex items-center gap-2 text-xs font-medium ${
            showDangerRadius
              ? 'bg-dark-900/90 border-rose-500/50 text-rose-400'
              : 'bg-dark-900/70 border-dark-700 text-slate-400 hover:text-white'
          }`}
          title="Basculer l'affichage des périmètres de sécurité"
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Périmètres</span>
        </button>

        <button
          onClick={toggleTransports}
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-xl transition flex items-center gap-2 text-xs font-medium ${
            showTransports
              ? 'bg-dark-900/90 border-indigo-500/50 text-indigo-400'
              : 'bg-dark-900/70 border-dark-700 text-slate-400 hover:text-white'
          }`}
          title="Basculer l'affichage des stations de métro RATP"
        >
          <Train className="w-4 h-4" />
          <span className="hidden sm:inline">RATP Hubs</span>
        </button>

        <button
          onClick={() => flyTo(48.8566, 2.3522, 13)}
          className="p-2.5 rounded-xl border border-dark-700 bg-dark-900/80 backdrop-blur-md text-slate-300 hover:text-white shadow-xl transition flex items-center gap-2 text-xs font-medium"
          title="Recentrer la carte sur Paris"
        >
          <Navigation className="w-4 h-4" />
          <span className="hidden sm:inline">Centrer Paris</span>
        </button>
      </div>

      {/* Floating Map Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-[400] bg-dark-900/90 border border-dark-800 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl text-[11px] text-slate-300 flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-mono text-[10px] uppercase">Légende :</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" />
          <span>Danger</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span>Tension</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span>Safe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
          <span>Hub RATP</span>
        </div>
      </div>
    </div>
  );
};
