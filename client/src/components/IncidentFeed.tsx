import React, { useState } from 'react';
import { 
  Activity, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  ThumbsUp, 
  ThumbsDown, 
  PlusCircle, 
  Search, 
  ShieldCheck,
  ShieldAlert,
  Flame,
  Flag,
  Train,
  Map as MapIcon
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { Incident, Severity } from '../types';

export const IncidentFeed: React.FC = () => {
  const { 
    incidents, 
    selectedIncident, 
    setSelectedIncident, 
    openReportModal, 
    voteIncident,
    mobileActiveTab,
    setMobileActiveTab
  } = useIncidentStore();

  const [searchFilter, setSearchFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');

  const filteredIncidents = incidents.filter((incident) => {
    if (severityFilter !== 'all' && incident.severity !== severityFilter) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        incident.location_name.toLowerCase().includes(q) ||
        incident.description.toLowerCase().includes(q) ||
        incident.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: Incident['severity']) => {
    switch (severity) {
      case 'danger':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Danger</span>
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Tension</span>
          </span>
        );
      case 'safe':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            <span>Zone Safe</span>
          </span>
        );
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'manifestation': return <Flag className="w-3 h-3 text-purple-400" />;
      case 'degradation': return <Flame className="w-3 h-3 text-rose-400" />;
      case 'fermeture_station': return <Train className="w-3 h-3 text-indigo-400" />;
      case 'tension': return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      case 'calme': return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      default: return <MapPin className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <aside className={`h-full flex-col bg-dark-900 border-l border-dark-800 shrink-0 select-none ${
      mobileActiveTab === 'feed'
        ? 'flex fixed inset-0 z-30 lg:static lg:w-96'
        : 'hidden lg:flex lg:w-96'
    }`}>
      {/* Header Panel */}
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-pulse-accent animate-pulse" />
          <h2 className="font-semibold text-sm text-slate-100">Flux d'Incidents en Direct</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-400">
            {filteredIncidents.length} signalements
          </span>
          <button 
            onClick={() => setMobileActiveTab('map')}
            className="lg:hidden p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-white"
            title="Revenir à la carte"
          >
            <MapIcon className="w-4 h-4 text-pulse-accent" />
          </button>
        </div>
      </div>

      {/* Primary Crowdsourcing Action */}
      <div className="p-3 border-b border-dark-800/80 bg-dark-950/40">
        <button
          onClick={openReportModal}
          className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-rose-950/60 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Signaler un événement / tension</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-dark-800/60 bg-dark-900 space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrer par rue, station, mot-clé..."
            className="w-full pl-8 pr-3 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-dark-700 transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          {(['all', 'danger', 'warning', 'safe'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`flex-1 py-1 rounded-md capitalize font-medium transition ${
                severityFilter === sev
                  ? 'bg-dark-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev === 'all' ? 'Tous' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-slate-500">
            <Activity className="w-8 h-8 stroke-1 mb-2 opacity-50" />
            <p className="text-xs font-medium">Aucun incident correspondant</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Modifiez vos filtres ou signalez le premier événement via le bouton ci-dessus.
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            const reliability = incident.reliability_score ?? 0.5;
            const percent = Math.round(reliability * 100);

            return (
              <div
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-dark-800 border-pulse-accent shadow-lg shadow-blue-950/30'
                    : 'bg-dark-850/60 border-dark-800 hover:border-slate-700'
                }`}
              >
                {/* Header card */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    {getSeverityBadge(incident.severity)}
                    {incident.reports_count && incident.reports_count > 1 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
                        <span>×{incident.reports_count}</span>
                      </span>
                    )}
                    {incident.category && (
                      <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] bg-dark-950 text-slate-300 font-mono">
                        {getCategoryIcon(incident.category)}
                        <span className="capitalize">{incident.category}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-[10px] text-slate-400 font-mono space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start space-x-2 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <h4 className="text-xs font-semibold text-slate-200 leading-tight">
                    {incident.location_name}
                  </h4>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-snug line-clamp-2 mb-3">
                  {incident.description}
                </p>

                {/* Reliability Progress Gauge */}
                <div className="mb-2.5 bg-dark-950/80 p-2 rounded-lg border border-dark-800">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      {reliability >= 0.8 ? (
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-amber-400" />
                      )}
                      <span>Indice de Fiabilité</span>
                    </span>
                    <span className="font-bold text-slate-200">{percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        reliability >= 0.8 ? 'bg-emerald-500' : reliability >= 0.6 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Actions & Attribution */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dark-800 text-slate-400">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 truncate max-w-[150px]" title={incident.source}>
                    {incident.source}
                  </span>

                  {/* Upvote & Downvote buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        voteIncident(incident.id, 'up');
                      }}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-dark-800 hover:bg-slate-700 text-slate-200 transition"
                      title="Confirmer cette alerte (Upvote)"
                    >
                      <ThumbsUp className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono font-bold text-[10px]">{incident.upvotes}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        voteIncident(incident.id, 'down');
                      }}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-dark-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
                      title="Contester cette alerte (Downvote)"
                    >
                      <ThumbsDown className="w-3 h-3 text-rose-400" />
                      {incident.downvotes !== undefined && incident.downvotes > 0 && (
                        <span className="font-mono text-[10px]">{incident.downvotes}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
