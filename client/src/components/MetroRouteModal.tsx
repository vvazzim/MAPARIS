import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Train, 
  ArrowRight, 
  ArrowUpDown, 
  Clock, 
  Timer, 
  CheckCircle2, 
  Navigation,
  Compass,
  LocateFixed,
  Bus,
  TramFront
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { 
  TRANSIT_STATIONS,
  TransitStation,
  calculateMetroRoute, 
  MetroRoutePlan,
  searchTransitStations,
  findNearestTransitStation
} from '../services/metroRoutingService';
import { 
  getLineStyle, 
  getRealtimeDeparturesForStation, 
  TransitLineType
} from '../services/ratpRealtimeService';
import { RealtimeDeparture } from '../types';

type ModeFilter = 'all' | 'metro' | 'rer' | 'train' | 'tram' | 'bus';

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

  const [originStation, setOriginStation] = useState<TransitStation>(() => 
    TRANSIT_STATIONS.find(s => s.id === 'station-chatelet') || TRANSIT_STATIONS[0]
  );
  const [destStation, setDestStation] = useState<TransitStation>(() => 
    TRANSIT_STATIONS.find(s => s.id === 'station-republique') || TRANSIT_STATIONS[1]
  );

  // Moteur de recherche départ et arrivée
  const [originSearch, setOriginSearch] = useState<string>('Châtelet - Les Halles');
  const [destSearch, setDestSearch] = useState<string>('République');
  const [isOriginSearchOpen, setIsOriginSearchOpen] = useState<boolean>(false);
  const [isDestSearchOpen, setIsDestSearchOpen] = useState<boolean>(false);

  // Filtre de mode de transport (Tous, Métro, Train/RER, Tram, Bus)
  const [activeMode, setActiveMode] = useState<ModeFilter>('all');

  // Itinéraire calculé et décomptes
  const [routePlan, setRoutePlan] = useState<MetroRoutePlan | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [liveDepartures, setLiveDepartures] = useState<RealtimeDeparture[]>([]);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const originInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);

  // Initialisation ou synchronisation depuis le store
  useEffect(() => {
    if (metroRouteOrigin) {
      const match = TRANSIT_STATIONS.find(s => s.id === metroRouteOrigin);
      if (match) {
        setOriginStation(match);
        setOriginSearch(match.name);
      }
    }
    if (metroRouteDestination) {
      const match = TRANSIT_STATIONS.find(s => s.id === metroRouteDestination);
      if (match) {
        setDestStation(match);
        setDestSearch(match.name);
      }
    }
  }, [metroRouteOrigin, metroRouteDestination]);

  // Recalcul du trajet et des passages en temps réel
  useEffect(() => {
    if (!isMetroRouteModalOpen || !originStation || !destStation) return;
    const plan = calculateMetroRoute(originStation.id, destStation.id, new Date());
    setRoutePlan(plan);
    if (plan) {
      setSecondsRemaining(plan.countdownSeconds);
    }

    const deps = getRealtimeDeparturesForStation(
      originStation.id,
      originStation.lines,
      'normal',
      new Date(),
      activeMode
    );
    setLiveDepartures(deps.slice(0, 6));
  }, [originStation, destStation, isMetroRouteModalOpen, activeMode]);

  // Live Ticker : Décompte des secondes et minutes en temps réel (1s)
  useEffect(() => {
    if (!isMetroRouteModalOpen || !originStation) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          const refreshed = calculateMetroRoute(originStation.id, destStation.id, new Date());
          setRoutePlan(refreshed);
          return refreshed ? refreshed.countdownSeconds : 180;
        }
        return prev - 1;
      });

      // Rafraîchir les passages en temps réel à quai
      const updatedDeps = getRealtimeDeparturesForStation(
        originStation.id,
        originStation.lines,
        'normal',
        new Date(),
        activeMode
      );
      setLiveDepartures(updatedDeps.slice(0, 6));
    }, 1000);

    return () => clearInterval(interval);
  }, [isMetroRouteModalOpen, originStation, destStation, activeMode]);

  // Suggestions filtrées pour le départ
  const originSuggestions = useMemo(() => {
    return searchTransitStations(originSearch, activeMode);
  }, [originSearch, activeMode]);

  // Suggestions filtrées pour l'arrivée
  const destSuggestions = useMemo(() => {
    return searchTransitStations(destSearch, activeMode);
  }, [destSearch, activeMode]);

  if (!isMetroRouteModalOpen) return null;

  // Interversion Départ ⇄ Arrivée
  const handleSwap = () => {
    const tempStation = originStation;
    setOriginStation(destStation);
    setOriginSearch(destStation.name);

    setDestStation(tempStation);
    setDestSearch(tempStation.name);
    setIsOriginSearchOpen(false);
    setIsDestSearchOpen(false);
  };

  // Géolocalisation directe (Bouton "Ma Position")
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre appareil.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const nearest = findNearestTransitStation(pos.coords.latitude, pos.coords.longitude);
        setOriginStation(nearest);
        setOriginSearch(nearest.name);
        setIsOriginSearchOpen(false);
      },
      () => {
        setIsLocating(false);
        // Repli élégant sur Châtelet si non autorisé
        const defaultStation = TRANSIT_STATIONS[0];
        setOriginStation(defaultStation);
        setOriginSearch(defaultStation.name);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
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

  const getModeIcon = (type: TransitLineType) => {
    switch (type) {
      case 'bus':
        return <Bus className="w-3.5 h-3.5" />;
      case 'tram':
        return <TramFront className="w-3.5 h-3.5" />;
      case 'rer':
      case 'train':
        return <Train className="w-3.5 h-3.5" />;
      default:
        return <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center font-bold text-[9px] font-mono leading-none">M</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={closeMetroRouteModal}
        aria-hidden="true"
      />

      {/* Modal Container : Mobile Bottom Sheet stylé / Desktop Modal centré */}
      <div 
        className="relative w-full h-[92dvh] sm:h-auto sm:max-h-[min(90dvh,820px)] sm:max-w-2xl bg-dark-900 border-t sm:border border-dark-750 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile Pull Bar Indicator (App look) */}
        <div className="sm:hidden w-full pt-2 pb-1 flex justify-center bg-dark-950/95 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
        </div>

        {/* Header avec Safe Area */}
        <div 
          style={{ paddingTop: 'max(0.6rem, calc(0.3rem + env(safe-area-inset-top, 16px)))' }}
          className="px-4 sm:px-6 pb-3 border-b border-dark-800 flex items-center justify-between bg-dark-950/95 backdrop-blur-md shrink-0"
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Trajets & Horaires Temps Réel
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>RATP / IDFM</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Train, RER, Métro, Tramway & Bus en direct
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

        {/* Corps scrollable avec gestion anti-rebond */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4"
          style={{
            paddingBottom: 'max(2rem, calc(1.5rem + env(safe-area-inset-bottom, 20px)))',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Onglets Filtres de Transport (Style App Citymapper / Bonjour RATP) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('all')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition flex items-center gap-1.5 ${
                activeMode === 'all'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
            >
              <span>✨ Tous</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('metro')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition flex items-center gap-1.5 ${
                activeMode === 'metro'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-950'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center font-bold text-[9px] font-mono leading-none">M</span>
              <span>Métro</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('rer')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition flex items-center gap-1.5 ${
                activeMode === 'rer'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>Train & RER</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('tram')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition flex items-center gap-1.5 ${
                activeMode === 'tram'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
            >
              <TramFront className="w-3.5 h-3.5" />
              <span>Tram</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('bus')}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition flex items-center gap-1.5 ${
                activeMode === 'bus'
                  ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-950'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-750'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Bus</span>
            </button>
          </div>

          {/* Module de Recherche Départ & Arrivée façon App Mobile */}
          <div className="relative p-3.5 sm:p-4 rounded-2xl bg-dark-950/90 border border-dark-800 shadow-lg">
            {/* Colonne d'indication visuelle (Puces & Ligne reliée) */}
            <div className="absolute left-6 top-7 bottom-7 w-0.5 bg-dashed bg-gradient-to-b from-emerald-500 via-indigo-500 to-rose-500 opacity-60 z-0 pointer-events-none" />

            <div className="space-y-3 relative z-10">
              {/* Champ Départ */}
              <div className="relative">
                <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-dark-900 border border-dark-700/80 focus-within:border-emerald-500 transition shadow-inner">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <input
                    ref={originInputRef}
                    type="text"
                    value={originSearch}
                    onChange={(e) => {
                      setOriginSearch(e.target.value);
                      setIsOriginSearchOpen(true);
                    }}
                    onFocus={() => {
                      setIsOriginSearchOpen(true);
                      setIsDestSearchOpen(false);
                    }}
                    placeholder="D'où partez-vous ? (Gare, station, bus...)"
                    className="flex-1 bg-transparent py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
                  />
                  {originSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setOriginSearch('');
                        originInputRef.current?.focus();
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1 transition shrink-0 active:scale-95"
                    title="Prendre la station la plus proche de ma position"
                  >
                    <LocateFixed className={`w-3 h-3 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Ma Position</span>
                  </button>
                </div>

                {/* Dropdown autocomplétion Départ */}
                {isOriginSearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-dark-900 border border-dark-750 shadow-2xl z-30 divide-y divide-dark-800">
                    <div className="p-2 bg-dark-950 text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
                      <span>Stations & arrêts trouvés ({originSuggestions.length})</span>
                      <button 
                        type="button" 
                        onClick={() => setIsOriginSearchOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        Fermer
                      </button>
                    </div>
                    {originSuggestions.map((station) => (
                      <button
                        key={station.id}
                        type="button"
                        onClick={() => {
                          setOriginStation(station);
                          setOriginSearch(station.name);
                          setIsOriginSearchOpen(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-dark-800/80 transition flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span className="text-slate-400">{getModeIcon(station.types[0])}</span>
                            <span>{station.name}</span>
                            {station.district && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({station.district})
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {station.lines.slice(0, 6).map((line) => {
                              const style = getLineStyle(line);
                              return (
                                <span
                                  key={line}
                                  style={{ backgroundColor: style.bg, color: style.text }}
                                  className="text-[9px] font-mono font-bold px-1 rounded-sm"
                                >
                                  {style.label}
                                </span>
                              );
                            })}
                            {station.lines.length > 6 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                +{station.lines.length - 6}
                              </span>
                            )}
                          </div>
                        </div>
                        {station.id === originStation.id && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton Inverser Départ ⇄ Arrivée */}
              <div className="flex justify-end -my-1 pr-3">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="p-1.5 rounded-full bg-dark-800 hover:bg-dark-750 active:bg-dark-700 border border-dark-700 text-indigo-400 hover:text-white transition active:scale-95 cursor-pointer shadow-sm flex items-center gap-1 text-[10px] font-mono"
                  title="Inverser départ et arrivée"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Inverser</span>
                </button>
              </div>

              {/* Champ Arrivée */}
              <div className="relative">
                <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-dark-900 border border-dark-700/80 focus-within:border-indigo-500 transition shadow-inner">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center shrink-0">
                    <Navigation className="w-3 h-3 text-indigo-400" />
                  </div>
                  <input
                    ref={destInputRef}
                    type="text"
                    value={destSearch}
                    onChange={(e) => {
                      setDestSearch(e.target.value);
                      setIsDestSearchOpen(true);
                    }}
                    onFocus={() => {
                      setIsDestSearchOpen(true);
                      setIsOriginSearchOpen(false);
                    }}
                    placeholder="Où allez-vous ? (Destination...)"
                    className="flex-1 bg-transparent py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
                  />
                  {destSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestSearch('');
                        destInputRef.current?.focus();
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown autocomplétion Arrivée */}
                {isDestSearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-dark-900 border border-dark-750 shadow-2xl z-30 divide-y divide-dark-800">
                    <div className="p-2 bg-dark-950 text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
                      <span>Destinations trouvées ({destSuggestions.length})</span>
                      <button 
                        type="button" 
                        onClick={() => setIsDestSearchOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        Fermer
                      </button>
                    </div>
                    {destSuggestions.map((station) => (
                      <button
                        key={station.id}
                        type="button"
                        onClick={() => {
                          setDestStation(station);
                          setDestSearch(station.name);
                          setIsDestSearchOpen(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-dark-800/80 transition flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span className="text-slate-400">{getModeIcon(station.types[0])}</span>
                            <span>{station.name}</span>
                            {station.district && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({station.district})
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {station.lines.slice(0, 6).map((line) => {
                              const style = getLineStyle(line);
                              return (
                                <span
                                  key={line}
                                  style={{ backgroundColor: style.bg, color: style.text }}
                                  className="text-[9px] font-mono font-bold px-1 rounded-sm"
                                >
                                  {style.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        {station.id === destStation.id && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLEAU DES PROCHAINS DÉPARTS EN DIRECT À LA STATION SÉLECTIONNÉE */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-950/80 border border-dark-800 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-dark-800">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-white">
                  Prochains départs à <span className="text-indigo-400">{originStation.name}</span>
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Décompte Live
              </span>
            </div>

            {liveDepartures.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">
                Aucun départ pour ce mode à cette station. Sélectionnez "Tous" ou un autre mode.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {liveDepartures.map((dep, idx) => {
                  const style = getLineStyle(dep.line);
                  const isApproaching = dep.remainingMinutes === 0;

                  return (
                    <div 
                      key={idx}
                      className="p-2 sm:p-2.5 rounded-xl bg-dark-900 border border-dark-800 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          style={{ backgroundColor: style.bg, color: style.text }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-sm"
                        >
                          {style.label}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 block truncate">
                            {dep.destination}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Suivant: {dep.followingDisplay}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span 
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md inline-block ${
                            isApproaching
                              ? 'bg-emerald-500/20 text-emerald-300 animate-pulse border border-emerald-500/40'
                              : 'bg-dark-800 text-emerald-400 border border-dark-700'
                          }`}
                        >
                          {dep.remainingDisplay}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RÉSULTAT DU TRAJET OPTIMAL CALCULÉ */}
          {routePlan && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Carte Résumé : Horaires exacts & compte à rebours */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-dark-900 border border-indigo-500/40 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-900/40 mb-3">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Itinéraire direct & correspondances
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300">
                    Durée: <strong className="text-white">{routePlan.totalDurationMin} min</strong>
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
                    <span className="text-[10px] font-mono text-slate-400">
                      Suivant: {routePlan.legs[0]?.followingDepartureTime}
                    </span>
                  </div>

                  {/* Compte à rebours en direct */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                    <span className="text-[10px] font-mono text-emerald-300 uppercase block mb-1 flex items-center justify-center gap-1">
                      <Timer className="w-3 h-3 text-emerald-400 animate-spin" />
                      Décompte
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 block tracking-tight">
                      {mins === 0 && secs < 30 ? "À l'approche" : formattedCountdown}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300/80">
                      Arrivée : {routePlan.arrivalTime}
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

              {/* Étapes du parcours */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block px-1">
                  Détail du parcours :
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
                            className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs font-mono shadow-sm"
                          >
                            {style.label}
                          </span>
                          <span className="font-bold text-xs text-white">
                            {leg.line} · Dir. {leg.direction}
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

              {/* Bouton Tracer sur la Carte */}
              <button
                type="button"
                onClick={handleVisualizeOnMap}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold font-mono transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950 active:scale-[0.98]"
              >
                <Compass className="w-4 h-4" />
                <span>Afficher le trajet sur la carte interactive</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
