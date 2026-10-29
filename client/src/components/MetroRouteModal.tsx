import React, { useState, useEffect } from 'react';
import { 
  X, 
  Train, 
  MapPin, 
  ArrowRight, 
  ArrowUpDown, 
  Clock, 
  Timer, 
  CheckCircle2, 
  Navigation,
  Compass
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { 
  METRO_NETWORK_STATIONS, 
  calculateMetroRoute, 
  MetroRoutePlan 
} from '../services/metroRoutingService';
import { getLineStyle } from '../services/ratpRealtimeService';

export const MetroRouteModal: React.FC = () => {
  const { 
    isMetroRouteModalOpen, 
    closeMetroRouteModal, 
    setActiveMetroRoute, 
    flyTo, 
    setMobileActiveTab,
    metroRouteOrigin,
    metroRouteDestination 
  } = useIncidentStore();

  const [originId, setOriginId] = useState<string>('station-chatelet');
  const [destId, setDestId] = useState<string>('station-republique');
  const [routePlan, setRoutePlan] = useState<MetroRoutePlan | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);

  // Synchronisation avec les stations passées en paramètre au store
  useEffect(() => {
    if (metroRouteOrigin) setOriginId(metroRouteOrigin);
    if (metroRouteDestination) setDestId(metroRouteDestination);
  }, [metroRouteOrigin, metroRouteDestination]);

  // Recalcul du trajet dès que les stations changent ou à l'ouverture
  useEffect(() => {
    if (!isMetroRouteModalOpen) return;
    const plan = calculateMetroRoute(originId, destId, new Date());
    setRoutePlan(plan);
    if (plan) {
      setSecondsRemaining(plan.countdownSeconds);
    }
  }, [originId, destId, isMetroRouteModalOpen]);

  // Décompte des secondes et minutes en direct (Live Ticker)
  useEffect(() => {
    if (!isMetroRouteModalOpen || !routePlan) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Recalcul automatique au passage du train
          const refreshed = calculateMetroRoute(originId, destId, new Date());
          setRoutePlan(refreshed);
          return refreshed ? refreshed.countdownSeconds : 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMetroRouteModalOpen, routePlan, originId, destId]);

  if (!isMetroRouteModalOpen) return null;

  // Interversion Départ ⇄ Arrivée
  const handleSwap = () => {
    const temp = originId;
    setOriginId(destId);
    setDestId(temp);
  };

  // Formatage du décompte MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedCountdown = `${mins} min ${secs.toString().padStart(2, '0')}s`;

  // Application de l'itinéraire sur la carte
  const handleVisualizeOnMap = () => {
    if (!routePlan) return;
    setActiveMetroRoute(routePlan);
    closeMetroRouteModal();
    setMobileActiveTab('map');
    flyTo(routePlan.origin.lat, routePlan.origin.lng, 14);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={closeMetroRouteModal}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div 
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[min(92dvh,760px)] sm:max-w-xl bg-dark-900 border-0 sm:border border-dark-750 sm:rounded-2xl rounded-none shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Header avec Safe Area */}
        <div 
          style={{ paddingTop: 'max(1rem, calc(0.75rem + env(safe-area-inset-top, 24px)))' }}
          className="px-5 sm:px-6 pb-3.5 border-b border-dark-800 flex items-center justify-between bg-dark-950/90 backdrop-blur-md shrink-0"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Trajet Métro & RER</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En Direct</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Horaires exacts de départ & décompte à la seconde
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMetroRouteModal}
            className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-750 active:bg-dark-700 border border-dark-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4"
          style={{
            paddingBottom: 'max(2rem, calc(1.5rem + env(safe-area-inset-bottom, 20px)))',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Sélecteurs Départ & Arrivée */}
          <div className="p-4 rounded-xl bg-dark-950/80 border border-dark-800 space-y-3">
            {/* Station de départ */}
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Station de départ</span>
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-dark-850 border border-dark-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {METRO_NETWORK_STATIONS.map((station) => (
                  <option key={station.id} value={station.id} disabled={station.id === destId}>
                    {station.name} ({station.lines.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Bouton Swap ⇄ */}
            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleSwap}
                className="p-1.5 rounded-full bg-dark-800 hover:bg-dark-750 border border-dark-700 text-indigo-400 hover:text-white transition active:scale-95 cursor-pointer shadow-sm"
                title="Inverser départ et arrivée"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Station d'arrivée */}
            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                <span>Station d'arrivée</span>
              </label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-dark-850 border border-dark-700 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {METRO_NETWORK_STATIONS.map((station) => (
                  <option key={station.id} value={station.id} disabled={station.id === originId}>
                    {station.name} ({station.lines.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Raccourcis rapides */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Raccourcis :</span>
            <button
              type="button"
              onClick={() => { setOriginId('station-chatelet'); setDestId('station-republique'); }}
              className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-[11px] text-slate-300 font-medium cursor-pointer"
            >
              Châtelet ➔ République
            </button>
            <button
              type="button"
              onClick={() => { setOriginId('station-gare-de-lyon'); setDestId('station-chatelet'); }}
              className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-[11px] text-slate-300 font-medium cursor-pointer"
            >
              Gare de Lyon ➔ Châtelet
            </button>
            <button
              type="button"
              onClick={() => { setOriginId('station-gare-du-nord'); setDestId('station-gare-de-lyon'); }}
              className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-700 text-[11px] text-slate-300 font-medium cursor-pointer"
            >
              Gare du Nord ➔ Gare de Lyon
            </button>
          </div>

          {/* Fiche Résultat de Trajet en Temps Réel */}
          {routePlan && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Encart Horaires & Compte à Rebours */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-dark-900 border border-indigo-500/40 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-900/40 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Horaires de passage en direct
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    RATP Synchro
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  {/* Heure de Départ */}
                  <div className="p-2.5 rounded-xl bg-dark-900/80 border border-dark-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Départ à quai
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-white block">
                      {routePlan.departureTime}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Suivant : {routePlan.legs[0]?.followingDepartureTime}
                    </span>
                  </div>

                  {/* Compte à rebours en direct */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                    <span className="text-[10px] font-mono text-emerald-300 uppercase block mb-1 flex items-center justify-center gap-1">
                      <Timer className="w-3 h-3 text-emerald-400 animate-spin" />
                      Décompte en direct
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 block tracking-tight">
                      {mins === 0 && secs < 30 ? "À l'approche" : formattedCountdown}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300/80">
                      Arrivée : {routePlan.arrivalTime} ({routePlan.totalDurationMin} min)
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-indigo-900/40 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{routePlan.recommendation}</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Trafic Fluide
                  </span>
                </div>
              </div>

              {/* Détail étape par étape */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Étapes du parcours :
                </span>

                {routePlan.legs.map((leg, idx) => {
                  const style = getLineStyle(leg.line);

                  return (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-dark-900 border border-dark-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono shadow-sm"
                          >
                            {style.label}
                          </span>
                          <span className="font-bold text-xs text-white">
                            Ligne {leg.line} · Dir. {leg.direction}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 bg-dark-800 px-2 py-0.5 rounded border border-dark-750">
                          {leg.stopsCount} arrêts ({leg.durationMin} min)
                        </span>
                      </div>

                      <div className="pl-8 text-xs space-y-1 text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <strong className="text-white">{leg.fromStation}</strong>
                          </span>
                          <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                            {leg.exactDepartureTime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            <span>{leg.toStation}</span>
                          </span>
                          <span className="font-mono">
                            {idx === routePlan.legs.length - 1 ? routePlan.arrivalTime : 'Correspondance'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton Visualiser sur la Carte */}
              <button
                type="button"
                onClick={handleVisualizeOnMap}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950 active:scale-[0.98]"
              >
                <Compass className="w-4 h-4" />
                <span>Tracer le trajet sur la carte interactive</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
