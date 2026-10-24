import React, { useState, useEffect } from 'react';
import { 
  X, 
  Navigation, 
  MapPin, 
  Compass, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Footprints, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { SafeRouteResult } from '../types';
import { safeFetchJson } from '../services/api';

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

export const SafeRouteModal: React.FC = () => {
  const { 
    isSafeRouteModalOpen, 
    closeSafeRouteModal, 
    setActiveSafeRoute, 
    flyTo 
  } = useIncidentStore();

  const [originText, setOriginText] = useState('Châtelet, Paris');
  const [destText, setDestText] = useState('Place de la République, Paris');

  const [originSuggestions, setOriginSuggestions] = useState<Suggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);
  const [showOriginDrop, setShowOriginDrop] = useState(false);
  const [showDestDrop, setShowDestDrop] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<SafeRouteResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autocomplete helpers
  useEffect(() => {
    if (!originText || originText.length < 2) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(originText)}&limit=4`);
        const json = await res.json();
        if (json.success) setOriginSuggestions(json.data);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [originText]);

  useEffect(() => {
    if (!destText || destText.length < 2) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(destText)}&limit=4`);
        const json = await res.json();
        if (json.success) setDestSuggestions(json.data);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [destText]);

  if (!isSafeRouteModalOpen) return null;

  const handleComputeRoute = async (customOrigin?: string, customDest?: string) => {
    const o = customOrigin || originText;
    const d = customDest || destText;

    if (!o.trim() || !d.trim()) {
      setErrorMessage('Veuillez renseigner le point de départ et la destination.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await safeFetchJson<{ success: boolean; data: SafeRouteResult; error?: string }>(
        '/api/routing/safe-path',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin: o, destination: d }),
        }
      );

      if (!result.ok || !result.data?.success) {
        throw new Error(result.error || result.data?.error || 'Erreur lors du calcul du trajet');
      }

      setRouteResult(result.data.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de calculer l\'itinéraire.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToMap = () => {
    if (!routeResult) return;
    setActiveSafeRoute(routeResult);
    // Center map on route origin
    flyTo(routeResult.origin.lat, routeResult.origin.lng, 14);
    closeSafeRouteModal();
  };

  const setPreset = (o: string, d: string) => {
    setOriginText(o);
    setDestText(d);
    handleComputeRoute(o, d);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Itinéraire Sécurisé (Safe Routing)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  Anti-Tension A*
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Calcul de chemin piéton évitant les zones d'affrontements & gaz lacrymogènes
              </p>
            </div>
          </div>
          <button
            onClick={closeSafeRouteModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Exemples de trajets à risque à contourner :
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setPreset('Châtelet, Paris', 'Place de la République, Paris')}
                className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-300 text-[11px] transition"
              >
                Châtelet ➔ République
              </button>
              <button
                type="button"
                onClick={() => setPreset('Place de la Bastille, Paris', 'Place de la Concorde, Paris')}
                className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-300 text-[11px] transition"
              >
                Bastille ➔ Concorde
              </button>
              <button
                type="button"
                onClick={() => setPreset('Gare de Lyon, Paris', 'Gare du Nord, Paris')}
                className="px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-750 text-slate-300 text-[11px] transition"
              >
                Gare de Lyon ➔ Gare du Nord
              </button>
            </div>
          </div>

          {/* Inputs Form */}
          <div className="space-y-3 bg-dark-950 p-4 rounded-xl border border-dark-800">
            {/* Origin */}
            <div className="relative">
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Point de Départ</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={originText}
                  onChange={(e) => {
                    setOriginText(e.target.value);
                    setShowOriginDrop(true);
                  }}
                  onFocus={() => originSuggestions.length > 0 && setShowOriginDrop(true)}
                  placeholder="Ex: Châtelet, 10 rue de Rivoli..."
                  className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <MapPin className="w-4 h-4 text-emerald-400 absolute left-2.5 top-2.5" />
              </div>
              {showOriginDrop && originSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-dark-850 border border-dark-700 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-dark-800">
                  {originSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setOriginText(item.label);
                        setShowOriginDrop(false);
                      }}
                      className="p-2 text-xs text-slate-200 hover:bg-dark-800 cursor-pointer"
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="relative">
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Destination d'Arrivée</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destText}
                  onChange={(e) => {
                    setDestText(e.target.value);
                    setShowDestDrop(true);
                  }}
                  onFocus={() => destSuggestions.length > 0 && setShowDestDrop(true)}
                  placeholder="Ex: Place de la République, Gare Saint-Lazare..."
                  className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <Navigation className="w-4 h-4 text-rose-500 absolute left-2.5 top-2.5" />
              </div>
              {showDestDrop && destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-dark-850 border border-dark-700 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-dark-800">
                  {destSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setDestText(item.label);
                        setShowDestDrop(false);
                      }}
                      className="p-2 text-xs text-slate-200 hover:bg-dark-800 cursor-pointer"
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleComputeRoute()}
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-950"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyse géométrique des obstacles...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Calculer le Tracé Sécurisé</span>
                </>
              )}
            </button>
          </div>

          {/* Results Comparison View */}
          {routeResult && (
            <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-dark-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Score de Sécurité du Parcours
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {routeResult.safetyScore}% Safe
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold mb-1">
                    Tracé Sécurisé (Vert)
                  </div>
                  <div className="flex items-center gap-3 font-mono text-white">
                    <span className="flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                      {routeResult.safeDistanceKm} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      ~{routeResult.safeDurationMin} min
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/30">
                  <div className="text-[10px] font-mono text-rose-400 uppercase font-semibold mb-1">
                    Tracé Direct à Risque (Rouge)
                  </div>
                  <div className="flex items-center gap-3 font-mono text-slate-300">
                    <span className="flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5 text-rose-400" />
                      {routeResult.directDistanceKm} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      ~{routeResult.directDurationMin} min
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendation Note */}
              <p className="text-xs text-slate-300 bg-dark-900 p-2.5 rounded-lg border border-dark-800 leading-relaxed">
                {routeResult.recommendation}
              </p>

              {/* Hazards avoided list */}
              {routeResult.hazardsAvoided.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Périmètres dangereux contournés :
                  </span>
                  <div className="space-y-1">
                    {routeResult.hazardsAvoided.map((h, i) => (
                      <div
                        key={i}
                        className="text-[11px] px-2 py-1 rounded bg-dark-900 border border-dark-800 text-slate-300 flex items-center justify-between"
                      >
                        <span className="truncate max-w-[280px]">{h.location_name}</span>
                        <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">
                          Zone {h.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply button */}
              <button
                type="button"
                onClick={handleApplyToMap}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-xl shadow-emerald-950"
              >
                <span>Visualiser le tracé sur la carte</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
