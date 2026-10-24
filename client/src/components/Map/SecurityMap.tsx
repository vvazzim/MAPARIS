import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PARIS_TRANSPORT_HUBS } from '../../data/ratpHubs';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident } from '../../types';
import { formatLocationName } from '../../utils/landmarkHelper';
import { formatIncidentDetails } from '../../utils/incidentFormatter';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Train, 
  Navigation, 
  Layers, 
  Shield, 
  ShieldCheck, 
  Users, 
  X, 
  SlidersHorizontal 
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
  if (type === 'origin') {
    // Rond bleu pour le point de départ A
    return L.divIcon({
      className: 'custom-route-origin-dot',
      html: `
        <div class="relative flex items-center justify-center w-7 h-7">
          <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-60"></span>
          <div class="relative flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-xl">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }

  // Pin rose pour la destination
  return L.divIcon({
    className: 'custom-route-destination-pin',
    html: `
      <div class="relative flex items-center justify-center -translate-y-2 cursor-pointer filter drop-shadow-xl">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="34" viewBox="0 0 24 28" fill="none">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 28 12 28C12 28 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#f43f5e"/>
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 28 12 28C12 28 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" stroke="#ffffff" stroke-width="1.8"/>
          <circle cx="12" cy="11" r="4" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [30, 34],
    iconAnchor: [15, 34],
    popupAnchor: [0, -34],
  });
};

export const SecurityMap: React.FC = () => {
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const {
    incidents,
    setSelectedIncident,
    showDangerRadius,
    showTransports,
    toggleDangerRadius,
    toggleTransports,
    toggleTransportWidget,
    flyTo,
    voteIncident,
    activeSafeRoute,
    clearSafeRoute,
    selectedRouteIndex,
    setSelectedRouteIndex,
    isSafeRouteModalOpen,
    isReportModalOpen,
    language,
    t,
  } = useIncidentStore();

  const isAnyModalOpen = isSafeRouteModalOpen || isReportModalOpen;

  // Calcul Haversine de la distance d'un tracé coordonnées
  const getPathDistanceKm = (path: [number, number][]): number => {
    let d = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const [lat1, lng1] = path[i];
      const [lat2, lng2] = path[i + 1];
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      d += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return Number(d.toFixed(2));
  };

  // Consolidation de l'ensemble des routes (Recommandée + Alternatives)
  const allSafeRoutes = useMemo(() => {
    if (!activeSafeRoute) return [];
    const list: Array<{
      index: number;
      name: string;
      path: [number, number][];
      distanceKm: number;
      durationMin: number;
      safetyScore: number;
      isRecommended: boolean;
    }> = [
      {
        index: 0,
        name: t.map.routeRecommended.replace('{num}', '1'),
        path: activeSafeRoute.safePath,
        distanceKm: activeSafeRoute.safeDistanceKm,
        durationMin: activeSafeRoute.safeDurationMin,
        safetyScore: activeSafeRoute.safetyScore,
        isRecommended: true,
      },
    ];

    if (activeSafeRoute.alternativePaths && activeSafeRoute.alternativePaths.length > 0) {
      activeSafeRoute.alternativePaths.forEach((altPath, idx) => {
        const dist = getPathDistanceKm(altPath);
        const dur = Math.max(1, Math.round((dist / 4.5) * 60));
        list.push({
          index: idx + 1,
          name: t.map.routeAlternative.replace('{num}', String(idx + 2)),
          path: altPath,
          distanceKm: dist,
          durationMin: dur,
          safetyScore: Math.max(85, activeSafeRoute.safetyScore - (idx + 1) * 3),
          isRecommended: false,
        });
      });
    }

    return list;
  }, [activeSafeRoute, t]);

  const currentSelectedRoute = allSafeRoutes[selectedRouteIndex] || allSafeRoutes[0];

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
        {incidents.map((incident) => {
          const details = formatIncidentDetails(incident, language);
          return (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              icon={createIncidentIcon(incident.severity, incident.reports_count)}
              eventHandlers={{
                click: () => setSelectedIncident(incident),
              }}
            >
              <Popup className="pulse-popup">
                <div className="p-1 min-w-[240px] max-w-[280px] sm:max-w-[320px] text-slate-100">
                  <div className="flex items-center justify-between pb-2 border-b border-dark-700/80 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base select-none leading-none">{details.emoji}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider font-mono px-2 py-0.5 rounded-full ${details.severityBadgeClass}`}>
                        {details.cleanTitle}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {details.timeAgo}
                    </span>
                  </div>

                  {/* Cluster & TTL Info Bar */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 bg-dark-900/90 px-2 py-1 rounded border border-dark-700/80 mb-2">
                    <span className="flex items-center gap-1 font-semibold text-amber-300">
                      <Users className="w-3 h-3 text-amber-400" />
                      <span>{incident.reports_count && incident.reports_count > 1 ? t.map.confirmedBadge.replace('{count}', String(incident.reports_count)) : t.map.oneSignal}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-dark-950 text-slate-300 font-mono">
                      {details.categoryLabel}
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-white leading-tight mb-1.5">
                    {formatLocationName(incident.location_name, incident.lat, incident.lng)}
                  </h4>

                  <p className="text-xs text-slate-300 leading-snug line-clamp-3 mb-2.5 overflow-hidden text-ellipsis break-words">
                    {details.cleanDescription}
                  </p>

                  {/* Reliability gauge in popup */}
                  <div className="mb-2.5 bg-dark-900/80 p-2 rounded-lg border border-dark-700">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>{t.map.reliability}</span>
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
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]" title={details.sourceBadge}>
                      {details.sourceBadge}
                    </span>
                    
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          voteIncident(incident.id, 'up');
                        }}
                        className="flex items-center space-x-1 px-2 py-1 rounded bg-dark-800 hover:bg-slate-700 text-slate-200 transition text-xs"
                        title={t.map.voteUpTitle}
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
                        title={t.map.voteDownTitle}
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
          );
        })}

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
                      {station.status === 'closed' ? t.transport.closed : station.status === 'disrupted' ? t.transport.disrupted : t.transport.normal}
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
            {/* Trajet Direct piéton à risque (Ligne Rouge en évidence) */}
            <Polyline
              positions={activeSafeRoute.directPath}
              pathOptions={{
                color: '#ef4444',
                weight: 4,
                dashArray: '8 8',
                opacity: 0.85,
              }}
            >
              <Tooltip sticky direction="top">
                <span className="font-mono text-xs font-semibold text-rose-500">
                  {t.map.routeDirect} ({activeSafeRoute.directDistanceKm} km · ~{activeSafeRoute.directDurationMin} min)
                </span>
              </Tooltip>
            </Polyline>

            {/* Tracés alternatifs secondaires (Lignes grises cliquables pour switcher) */}
            {allSafeRoutes
              .filter((r) => r.index !== selectedRouteIndex)
              .map((r) => (
                <Polyline
                  key={`alt-path-${r.index}`}
                  positions={r.path}
                  pathOptions={{
                    color: '#94a3b8',
                    weight: 4,
                    dashArray: '5 6',
                    opacity: 0.75,
                    className: 'cursor-pointer hover:stroke-slate-300 transition-all',
                  }}
                  eventHandlers={{
                    click: () => setSelectedRouteIndex(r.index),
                  }}
                >
                  <Tooltip sticky direction="top">
                    <div className="font-mono text-xs">
                      <div className="font-bold text-slate-800">{r.name}</div>
                      <div className="text-slate-600">{r.distanceKm} km · ~{r.durationMin} min</div>
                      <div className="text-emerald-600 font-semibold mt-0.5">{t.map.switchRouteTooltip}</div>
                    </div>
                  </Tooltip>
                </Polyline>
              ))}

            {/* Tracé Sélectionné Actif (Ligne Verte Principale éclatante) */}
            {currentSelectedRoute && (
              <Polyline
                key={`active-safe-path-${currentSelectedRoute.index}`}
                positions={currentSelectedRoute.path}
                pathOptions={{
                  color: '#10b981',
                  weight: 6,
                  opacity: 0.95,
                  className: 'filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
                }}
              >
                <Tooltip sticky direction="top">
                  <div className="font-mono text-xs">
                    <div className="font-bold text-emerald-700 flex items-center gap-1">
                      <span>✓</span>
                      <span>{currentSelectedRoute.name} ({t.map.routeSelectedBadge})</span>
                    </div>
                    <div className="text-slate-700 font-medium">
                      {currentSelectedRoute.distanceKm} km · ~{currentSelectedRoute.durationMin} min · {currentSelectedRoute.safetyScore}% Safe
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            )}

            {/* Point de Départ (A) : Rond Bleu */}
            <Marker
              position={[activeSafeRoute.origin.lat, activeSafeRoute.origin.lng]}
              icon={createRoutePinIcon('origin')}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{t.map.start}</span>
                  </div>
                  <p className="text-white">{activeSafeRoute.origin.address}</p>
                </div>
              </Popup>
            </Marker>

            {/* Destination : Pin Rose */}
            <Marker
              position={[activeSafeRoute.destination.lat, activeSafeRoute.destination.lng]}
              icon={createRoutePinIcon('destination')}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>{t.map.end}</span>
                  </div>
                  <p className="text-white">{activeSafeRoute.destination.address}</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Floating Active Route Banner (Top Center) with interactive switcher */}
      {activeSafeRoute && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-dark-900/95 border border-dark-700 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-2.5 md:gap-4 text-xs transition-all duration-200 ${
          isAnyModalOpen ? 'opacity-0 pointer-events-none invisible !hidden' : 'opacity-100'
        }`}>
          {/* Tracé sélectionné & métriques dynamiques */}
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white whitespace-nowrap">
              {currentSelectedRoute?.name || t.map.activeSafeRoute}
            </span>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 whitespace-nowrap">
              {t.map.safePercent.replace('{percent}', String(currentSelectedRoute?.safetyScore ?? activeSafeRoute.safetyScore))}
            </span>
            <span className="text-slate-300 whitespace-nowrap">
              ({currentSelectedRoute?.distanceKm ?? activeSafeRoute.safeDistanceKm} km · ~{currentSelectedRoute?.durationMin ?? activeSafeRoute.safeDurationMin} min)
            </span>
          </div>

          {/* Boutons de bascule (switcher) pour changer de tracé en 1 clic */}
          {allSafeRoutes.length > 1 && (
            <div className="flex items-center gap-1 bg-dark-950/80 p-1 rounded-xl border border-dark-800">
              {allSafeRoutes.map((r) => {
                const isSelected = selectedRouteIndex === r.index;
                return (
                  <button
                    key={r.index}
                    onClick={() => setSelectedRouteIndex(r.index)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm shadow-emerald-950'
                        : 'text-slate-400 hover:text-white hover:bg-dark-800 border border-transparent'
                    }`}
                    title={t.map.switchRouteTooltip}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    <span>{r.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Légende couleurs des tracés */}
          <div className="flex items-center gap-3 text-[11px] font-mono border-t md:border-t-0 md:border-l border-dark-750 pt-1.5 md:pt-0 md:pl-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3.5 h-1 rounded-full bg-emerald-500"></span>
              <span>Vert (Sélectionné)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3.5 h-1 rounded-full bg-slate-400"></span>
              <span>Gris (Alternatif)</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3.5 h-1 rounded-full bg-rose-500"></span>
              <span>Rouge (Direct)</span>
            </span>
          </div>

          <button
            onClick={clearSafeRoute}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition active:scale-95 cursor-pointer md:ml-auto"
            title={t.map.clearRouteTitle}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Map Action Controls (En bas à droite - Se merge dans le même bouton après utilisation) */}
      <div className={`absolute bottom-20 lg:bottom-6 right-3 lg:right-6 z-[400] flex flex-col items-end gap-2 transition-all duration-200 ${
        isAnyModalOpen ? 'opacity-0 pointer-events-none invisible !hidden' : 'opacity-100'
      }`}>
        {/* Transparent click-outside backdrop when controls are expanded */}
        {isControlsOpen && (
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setIsControlsOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Action Buttons Group (Unfolds upwards, merges on click) */}
        {isControlsOpen ? (
          <div className="flex flex-col gap-2 p-2 rounded-2xl bg-dark-900/98 border border-dark-700 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-150 min-w-[180px]">
            {/* Header / Close tool button */}
            <button
              onClick={() => setIsControlsOpen(false)}
              className="p-1.5 px-2.5 rounded-xl bg-dark-950/80 hover:bg-dark-800 text-slate-400 hover:text-white text-[11px] font-mono flex items-center justify-between border border-dark-800 transition cursor-pointer"
            >
              <span>Fermer</span>
              <X className="w-3.5 h-3.5 text-rose-400" />
            </button>

            {/* 1. Périmètres de Danger */}
            <button
              onClick={() => {
                toggleDangerRadius();
                setIsControlsOpen(false); // SE MERGE APRÈS UTILISATION
              }}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 text-xs font-medium cursor-pointer active:scale-95 ${
                showDangerRadius
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-400'
                  : 'bg-dark-850/80 border-dark-700 text-slate-400 hover:text-white'
              }`}
              title={t.map.togglePerimetersTitle}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>{t.map.perimeters}</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${showDangerRadius ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
            </button>

            {/* 2. RATP Hubs */}
            <button
              onClick={() => {
                toggleTransports();
                toggleTransportWidget();
                setIsControlsOpen(false); // SE MERGE APRÈS UTILISATION
              }}
              className="p-2.5 rounded-xl border border-indigo-500/40 bg-indigo-950/30 text-indigo-300 hover:text-white hover:bg-indigo-950/50 transition-all flex items-center gap-2.5 text-xs font-medium cursor-pointer active:scale-95"
              title={t.map.toggleRatpTitle}
            >
              <Train className="w-4 h-4 text-indigo-400" />
              <span>RATP Hubs</span>
            </button>

            {/* 3. Centrer Paris */}
            <button
              onClick={() => {
                flyTo(48.8566, 2.3522, 13);
                setIsControlsOpen(false); // SE MERGE APRÈS UTILISATION
              }}
              className="p-2.5 rounded-xl border border-dark-700 bg-dark-850/80 hover:bg-dark-800 text-slate-200 hover:text-white transition-all flex items-center gap-2.5 text-xs font-medium cursor-pointer active:scale-95"
              title={t.map.recenterTitle}
            >
              <Navigation className="w-4 h-4 text-pulse-accent" />
              <span>{t.map.recenter}</span>
            </button>
          </div>
        ) : (
          /* Bouton Unique Mergé (Single Merged FAB Button) */
          <button
            onClick={() => setIsControlsOpen(true)}
            className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-dark-900/95 border border-dark-700/80 hover:border-dark-600 text-slate-200 hover:text-white shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-semibold font-mono transition-all duration-200 active:scale-95 cursor-pointer group"
            title="Options et outils de la carte (Périmètres, RATP, Centrer)"
          >
            <SlidersHorizontal className="w-4 h-4 text-pulse-accent group-hover:rotate-45 transition-transform" />
            <span className="hidden sm:inline">Outils Carte</span>
          </button>
        )}
      </div>

      {/* Floating Map Legend (Bottom Left) - Hidden on Mobile (< sm) and when Modal is Open */}
      <div className={`hidden sm:flex absolute bottom-6 left-6 z-[400] bg-dark-900/90 border border-dark-800 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl text-[11px] text-slate-300 items-center gap-4 transition-opacity duration-200 ${
        isAnyModalOpen ? '!hidden' : ''
      }`}>
        <div className="flex items-center gap-1.5 font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-mono text-[10px] uppercase">{t.map.legend}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse" />
          <span>{t.map.danger}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span>{t.map.warning}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span>{t.map.safe}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
          <span>{t.map.ratp}</span>
        </div>
      </div>
    </div>
  );
};
