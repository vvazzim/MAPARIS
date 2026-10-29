import React, { useState } from 'react';
import { 
  Activity, 
  MapPin, 
  Search, 
  Map as MapIcon
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { Severity } from '../types';
import { cleanShortAddress } from '../utils/landmarkHelper';
import { formatIncidentDetails } from '../utils/incidentFormatter';

export const IncidentFeed: React.FC = () => {
  const { 
    incidents, 
    selectedIncident, 
    setSelectedIncident, 
    flyTo,
    showTransportWidget,
    toggleTransportWidget,
    closeMobileMenu,
    mobileActiveTab,
    setMobileActiveTab,
    language,
    t,
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

  return (
    <aside className={`h-full flex-col bg-dark-900 border-l border-dark-800 shrink-0 select-none ${
      mobileActiveTab === 'feed'
        ? 'flex fixed inset-0 z-30 lg:static lg:w-96'
        : 'hidden lg:flex lg:w-96'
    }`}>
      {/* En-tête épuré avec Safe Area */}
      <div 
        style={{ paddingTop: 'max(0.875rem, calc(0.5rem + env(safe-area-inset-top, 0px)))' }}
        className="p-3.5 border-b border-dark-800 flex items-center justify-between bg-dark-950/80 shrink-0"
      >
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-pulse-accent animate-pulse" />
          <h2 className="font-bold text-sm text-white">{t.feed.title}</h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-dark-800 text-slate-300 border border-dark-750">
            {filteredIncidents.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Bouton Retour Carte sur mobile */}
          <button 
            onClick={() => setMobileActiveTab('map')}
            className="lg:hidden px-2.5 py-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-white border border-dark-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
            title={t.feed.backToMap}
          >
            <MapIcon className="w-4 h-4 text-pulse-accent" />
            <span>Carte</span>
          </button>
        </div>
      </div>

      {/* Barre de Recherche & Filtres Rapides (Minimale & Compacte) */}
      <div className="p-2.5 border-b border-dark-800 bg-dark-900 space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t.feed.searchPlaceholder}
            className="w-full pl-8 pr-3 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-dark-700 transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          {(['all', 'danger', 'warning', 'safe'] as const).map((sev) => {
            const isActive = severityFilter === sev;
            let activeClass = 'bg-dark-800 text-white shadow-sm';
            if (isActive && sev === 'danger') activeClass = 'bg-rose-950/80 text-rose-300 border border-rose-800';
            if (isActive && sev === 'warning') activeClass = 'bg-amber-950/80 text-amber-300 border border-amber-800';
            if (isActive && sev === 'safe') activeClass = 'bg-emerald-950/80 text-emerald-300 border border-emerald-800';

            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`flex-1 py-1 rounded-md capitalize font-medium transition ${
                  isActive ? activeClass : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev === 'all'
                  ? t.feed.filterAll
                  : sev === 'danger'
                  ? t.feed.filterDanger
                  : sev === 'warning'
                  ? t.feed.filterWarning
                  : t.feed.filterSafe}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste Épurée des Incidents (Strict Minimum Vital) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-slate-500">
            <Activity className="w-7 h-7 stroke-1 mb-2 opacity-40" />
            <p className="text-xs font-medium">{t.feed.empty}</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            const details = formatIncidentDetails(incident, language);
            const shortAddress = cleanShortAddress(incident.location_name, incident.lat, incident.lng);

            // Style tripartite selon la gravité : Rouge (Danger) / Orange (Tension) / Vert (Safe)
            const severityTheme = 
              incident.severity === 'danger'
                ? {
                    border: 'border-l-4 border-l-rose-500',
                    bg: isSelected ? 'bg-rose-950/40 border-rose-500' : 'bg-dark-850/80 border-dark-800 hover:border-rose-500/50',
                    badge: 'bg-rose-950/60 text-rose-300',
                  }
                : incident.severity === 'warning'
                ? {
                    border: 'border-l-4 border-l-amber-500',
                    bg: isSelected ? 'bg-amber-950/40 border-amber-500' : 'bg-dark-850/80 border-dark-800 hover:border-amber-500/50',
                    badge: 'bg-amber-950/60 text-amber-300',
                  }
                : {
                    border: 'border-l-4 border-l-emerald-500',
                    bg: isSelected ? 'bg-emerald-950/40 border-emerald-500' : 'bg-dark-850/80 border-dark-800 hover:border-emerald-500/50',
                    badge: 'bg-emerald-950/60 text-emerald-300',
                  };

            return (
              <div
                key={incident.id}
                onClick={() => {
                  setSelectedIncident(incident);
                  flyTo(incident.lat, incident.lng, 16);
                  setMobileActiveTab('map');
                  if (showTransportWidget) toggleTransportWidget();
                  closeMobileMenu();
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99] ${severityTheme.border} ${severityTheme.bg}`}
              >
                {/* Ligne 1 : Émoji + Catégorie Principale (Gauche) & Heure Relative (Droite) */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base select-none leading-none shrink-0">
                      {details.emoji}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {details.categoryLabel}
                    </span>
                    {incident.reports_count && incident.reports_count > 1 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-dark-900 text-slate-300 border border-dark-750">
                        ×{incident.reports_count}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {details.timeAgo}
                  </span>
                </div>

                {/* Ligne 2 : Adresse Courte & Épurée */}
                <div className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {shortAddress}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
