import React, { useState } from 'react';
import { 
  Train, 
  X, 
  ExternalLink, 
  MapPin, 
  Clock, 
  RefreshCw, 
  Radio 
} from 'lucide-react';
import { PARIS_TRANSPORT_HUBS } from '../data/ratpHubs';
import { useIncidentStore } from '../store/useIncidentStore';
import { MetroStationStatus } from '../types';
import { 
  useRealtimeDepartures, 
  getLineStyle 
} from '../services/ratpRealtimeService';

/**
 * Sous-composant affichant les passages en temps réel pour une station donnée
 */
const StationDepartureBoard: React.FC<{ station: MetroStationStatus }> = ({ station }) => {
  const { departures } = useRealtimeDepartures(station.id, station.lines, station.status, 5);
  const [expanded, setExpanded] = useState(false);

  const displayedDepartures = expanded ? departures : departures.slice(0, 4);

  return (
    <div className="mt-2.5 pt-2 border-t border-dark-800/80">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-indigo-400" />
          Temps restant en direct
        </span>
        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          RATP Live
        </span>
      </div>

      <div className="space-y-1.5">
        {displayedDepartures.map((dep, idx) => {
          const style = getLineStyle(dep.line);
          const isApproaching = dep.remainingMinutes === 0;

          return (
            <div
              key={`${dep.line}-${dep.destination}-${idx}`}
              className="flex items-center justify-between p-1.5 rounded-lg bg-dark-900/90 border border-dark-750/80 hover:border-dark-650 transition text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {/* Badge officiel de la ligne */}
                <span
                  style={{ backgroundColor: style.bg, color: style.text }}
                  className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono shrink-0 shadow-sm"
                >
                  {style.label}
                </span>
                {/* Terminus */}
                <span className="text-slate-200 text-[11px] truncate font-medium">
                  {dep.destination}
                </span>
              </div>

              {/* Temps restant en direct */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] flex items-center gap-1 ${
                    isApproaching
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                      : dep.status === 'delayed'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                  }`}
                >
                  {isApproaching && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  {dep.remainingDisplay}
                </span>

                {dep.followingDisplay && (
                  <span className="text-[9px] font-mono text-slate-500 hidden xs:inline-block">
                    +{dep.followingDisplay}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {departures.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 w-full py-1 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 text-center transition flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>{expanded ? '▲ Réduire' : `▼ Voir ${departures.length - 4} autres directions`}</span>
        </button>
      )}
    </div>
  );
};

export const TransportWidget: React.FC = () => {
  const { showTransportWidget, toggleTransportWidget, flyTo, setMobileActiveTab, t } = useIncidentStore();
  const [filter, setFilter] = useState<'all' | 'disrupted'>('all');
  const [tick, setTick] = useState(0);

  if (!showTransportWidget) return null;

  const filteredStations = PARIS_TRANSPORT_HUBS.filter((station) => {
    if (filter === 'disrupted') return station.status !== 'normal';
    return true;
  });

  const closedCount = PARIS_TRANSPORT_HUBS.filter((s) => s.status === 'closed').length;
  const disruptedCount = PARIS_TRANSPORT_HUBS.filter((s) => s.status === 'disrupted').length;

  return (
    <>
      {/* Backdrop overlay assombri sur mobile pour fermer facilement en cliquant à côté */}
      <div
        className="sm:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity cursor-pointer"
        onClick={toggleTransportWidget}
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 sm:inset-y-16 right-0 w-full sm:w-[420px] max-w-full bg-dark-900/98 sm:bg-dark-900/95 backdrop-blur-xl border-l border-dark-800 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header avec Safe Area */}
        <div 
          style={{ paddingTop: 'max(1rem, calc(0.5rem + env(safe-area-inset-top, 0px)))' }}
          className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-950/80 shrink-0"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {t.transport.title}
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-950/90 text-emerald-300 rounded border border-emerald-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Temps Réel
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Temps d'attente estimé de chaque train et métro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTick((prev) => prev + 1)}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
              title="Rafraîchir les temps d'attente"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleTransportWidget}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-mono cursor-pointer active:scale-95"
              title="Fermer et revenir à la carte"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span className="text-[11px] font-semibold">Fermer</span>
            </button>
          </div>
        </div>

        {/* Live Ticker Bar */}
        <div className="px-3 py-1.5 bg-indigo-950/30 border-b border-indigo-900/30 flex items-center justify-between text-[11px] font-mono text-indigo-300 shrink-0">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Flux RATP / Île-de-France Mobilités direct</span>
          </span>
          <span className="text-slate-400 text-[10px]">
            Actualisation continue
          </span>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-dark-950/60 border-b border-dark-800 text-xs shrink-0">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="font-bold font-mono">{PARIS_TRANSPORT_HUBS.length - closedCount - disruptedCount} Hubs</div>
              <div className="text-[10px] text-emerald-400/80">Service 100% Fluide</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            <Train className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="font-bold font-mono">14 Lignes & RER</div>
              <div className="text-[10px] text-indigo-400/80">Passages en Direct</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex p-2 bg-dark-900 border-b border-dark-800/80 gap-1 text-xs shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-md font-medium transition cursor-pointer ${
              filter === 'all'
                ? 'bg-dark-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.transport.allTab} ({PARIS_TRANSPORT_HUBS.length})
          </button>
          <button
            onClick={() => setFilter('disrupted')}
            className={`flex-1 py-1.5 rounded-md font-medium transition cursor-pointer ${
              filter === 'disrupted'
                ? 'bg-dark-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.transport.disrupted} ({closedCount + disruptedCount})
          </button>
        </div>

        {/* Stations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3" key={tick}>
          {filteredStations.map((station) => {
            const isClosed = station.status === 'closed';
            const isDisrupted = station.status === 'disrupted';

            return (
              <div
                key={station.id}
                className={`p-3 rounded-xl border transition ${
                  isClosed
                    ? 'bg-rose-950/20 border-rose-800/50'
                    : isDisrupted
                    ? 'bg-amber-950/20 border-amber-800/50'
                    : 'bg-dark-850/60 border-dark-800 hover:border-dark-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {station.name}
                  </span>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${
                      isClosed
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isDisrupted
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isClosed ? t.transport.closed : isDisrupted ? t.transport.disrupted : t.transport.fluid}
                  </span>
                </div>

                {/* Badges de lignes */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {station.lines.map((line) => {
                    const style = getLineStyle(line);
                    return (
                      <span
                        key={line}
                        style={{ backgroundColor: style.bg, color: style.text }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-sm"
                      >
                        {style.label}
                      </span>
                    );
                  })}
                </div>

                {/* Tableau des prochains départs en temps réel */}
                <StationDepartureBoard station={station} />

                {station.incident_desc && (
                  <p className="text-xs text-slate-300 leading-snug my-2 bg-dark-900/60 p-2 rounded-lg border border-dark-800">
                    {station.incident_desc}
                  </p>
                )}

                <button
                  onClick={() => {
                    flyTo(station.lat, station.lng, 16);
                    toggleTransportWidget();
                    setMobileActiveTab('map');
                  }}
                  className="mt-2.5 w-full py-2 px-3 rounded-lg bg-dark-800 hover:bg-indigo-950 border border-dark-700 hover:border-indigo-700 text-slate-200 hover:text-indigo-300 text-xs font-medium flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <span>{t.transport.locateOnMap}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bouton bas de tiroir pour retour direct sur la carte */}
        <div className="p-3 border-t border-dark-800 bg-dark-950/90 shrink-0">
          <button
            onClick={() => {
              toggleTransportWidget();
              setMobileActiveTab('map');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950 active:scale-[0.98]"
          >
            <MapPin className="w-4 h-4" />
            <span>{t.feed.backToMap || 'Retour à la Carte'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
