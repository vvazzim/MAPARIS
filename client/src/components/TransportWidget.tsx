import React, { useState } from 'react';
import { Train, AlertCircle, AlertTriangle, X, ExternalLink, MapPin } from 'lucide-react';
import { PARIS_TRANSPORT_HUBS } from '../data/ratpHubs';
import { useIncidentStore } from '../store/useIncidentStore';

export const TransportWidget: React.FC = () => {
  const { showTransportWidget, toggleTransportWidget, flyTo } = useIncidentStore();
  const [filter, setFilter] = useState<'all' | 'disrupted'>('all');

  if (!showTransportWidget) return null;

  const filteredStations = PARIS_TRANSPORT_HUBS.filter((station) => {
    if (filter === 'disrupted') return station.status !== 'normal';
    return true;
  });

  const closedCount = PARIS_TRANSPORT_HUBS.filter((s) => s.status === 'closed').length;
  const disruptedCount = PARIS_TRANSPORT_HUBS.filter((s) => s.status === 'disrupted').length;

  return (
    <div className="fixed inset-y-16 right-0 w-96 bg-dark-900/95 backdrop-blur-xl border-l border-dark-800 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Hubs Transports RATP
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-dark-800 text-slate-300 rounded">
                PRIM API
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Statut des grandes correspondances & métros
            </p>
          </div>
        </div>

        <button
          onClick={toggleTransportWidget}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-dark-950/60 border-b border-dark-800 text-xs">
        <div className="flex items-center space-x-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <div>
            <div className="font-bold font-mono">{closedCount} Station(s)</div>
            <div className="text-[10px] text-rose-400/80">Fermée(s) d'urgence</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <div>
            <div className="font-bold font-mono">{disruptedCount} Hub(s)</div>
            <div className="text-[10px] text-amber-400/80">Filtrage / Ralentis</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-2 bg-dark-900 border-b border-dark-800/80 gap-1 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 rounded-md font-medium transition ${
            filter === 'all'
              ? 'bg-dark-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Toutes ({PARIS_TRANSPORT_HUBS.length})
        </button>
        <button
          onClick={() => setFilter('disrupted')}
          className={`flex-1 py-1.5 rounded-md font-medium transition ${
            filter === 'disrupted'
              ? 'bg-dark-800 text-amber-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Perturbées ({closedCount + disruptedCount})
        </button>
      </div>

      {/* Stations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
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
                  : 'bg-dark-850/60 border-dark-800'
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
                  {isClosed ? 'Fermée' : isDisrupted ? 'Perturbée' : 'Fluide'}
                </span>
              </div>

              {/* Lines tags */}
              <div className="flex flex-wrap gap-1 mb-2">
                {station.lines.map((line) => (
                  <span
                    key={line}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-dark-800/90 text-slate-200 border border-dark-700"
                  >
                    {line}
                  </span>
                ))}
              </div>

              {station.incident_desc && (
                <p className="text-xs text-slate-300 leading-snug mb-2.5 bg-dark-900/60 p-2 rounded-lg border border-dark-800">
                  {station.incident_desc}
                </p>
              )}

              <button
                onClick={() => flyTo(station.lat, station.lng, 16)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-dark-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition"
              >
                <span>Localiser sur la carte</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
