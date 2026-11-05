import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Train, 
  ArrowUpDown, 
  Navigation, 
  Compass, 
  Star, 
  AlertTriangle, 
  Plus,
  Search
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { 
  TRANSIT_STATIONS, 
  TransitStation, 
  calculateMetroRoute, 
  MetroRoutePlan 
} from '../services/metroRoutingService';
import { 
  getLineStyle, 
  getAlignedNow, 
  normalizeLineKey, 
  getPinnedStops, 
  togglePinStop, 
  isStopPinned, 
  getStopRealtimeDeparture, 
  fetchNetworkDisruptions 
} from '../services/ratpRealtimeService';
import { 
  IDF_LINES_DIRECTORY, 
  SAMPLE_IDF_DISRUPTIONS, 
  TransitStopItem, 
  TransitDisruptionItem 
} from '../data/transitLinesData';
import { PinnedTransitStop } from '../types';

type ModalTab = 'explorer' | 'pinned' | 'disruptions' | 'planner';
type ModeFilter = 'all' | 'metro' | 'rer' | 'tram' | 'bus';
type DisruptionFilter = 'all' | 'delay' | 'cancellation' | 'strike' | 'station_closure';

export const MetroRouteModal: React.FC = () => {
  const { 
    isMetroRouteModalOpen, 
    closeMetroRouteModal, 
    openReportModal, 
    setActiveMetroRoute, 
    flyTo, 
    incidents, 
    metroRouteOrigin, 
    metroRouteDestination 
  } = useIncidentStore();

  // Onglet actif : 'explorer', 'pinned', 'disruptions', 'planner'
  const [activeTab, setActiveTab] = useState<ModalTab>('explorer');

  // Ligne sélectionnée pour l'explorateur (M13 par défaut)
  const [selectedLineKey, setSelectedLineKey] = useState<string>('M13');
  const [directionIndex, setDirectionIndex] = useState<number>(0);
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Arrêts épinglés
  const [pinnedStopsList, setPinnedStopsList] = useState<PinnedTransitStop[]>(() => getPinnedStops());

  // Perturbations et retards réseau
  const [disruptions, setDisruptions] = useState<TransitDisruptionItem[]>(SAMPLE_IDF_DISRUPTIONS);
  const [disruptionFilter, setDisruptionFilter] = useState<DisruptionFilter>('all');

  // Trajet ponctuel A ➔ B
  const originStation = useMemo<TransitStation>(() => 
    TRANSIT_STATIONS.find(s => s.id === (metroRouteOrigin || 'station-porte-de-clichy')) || TRANSIT_STATIONS[0],
    [metroRouteOrigin]
  );
  const destStation = useMemo<TransitStation>(() => 
    TRANSIT_STATIONS.find(s => s.id === (metroRouteDestination || 'station-saint-lazare')) || TRANSIT_STATIONS[1],
    [metroRouteDestination]
  );
  const [originSearch, setOriginSearch] = useState<string>(() => originStation.name);
  const [destSearch, setDestSearch] = useState<string>(() => destStation.name);
  const [routePlan, setRoutePlan] = useState<MetroRoutePlan | null>(null);

  // Horloge réactive pour ticker à la seconde
  const [ticker, setTicker] = useState<number>(0);

  const stopsListContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentAlignedTime = useMemo(() => {
    if (ticker < 0) return getAlignedNow();
    return getAlignedNow();
  }, [ticker]);

  // Chargement des perturbations depuis le serveur
  useEffect(() => {
    if (isMetroRouteModalOpen) {
      fetchNetworkDisruptions().then((data) => {
        if (data && data.length > 0) setDisruptions(data);
      });
      setPinnedStopsList(getPinnedStops());
    }
  }, [isMetroRouteModalOpen]);

  if (!isMetroRouteModalOpen) return null;

  // Ligne active dans l'explorateur
  const activeLineData = IDF_LINES_DIRECTORY[normalizeLineKey(selectedLineKey)] || IDF_LINES_DIRECTORY['M13'];
  const activeLineStyle = getLineStyle(activeLineData.key);
  const activeDirection = activeLineData.directions[directionIndex] || activeLineData.directions[0];

  // Liste ordonnée des arrêts selon le sens de circulation
  const displayedStops = useMemo(() => {
    const rawStops = [...activeLineData.stops];
    if (directionIndex === 1) {
      rawStops.reverse();
    }
    if (!searchFilter.trim()) return rawStops;
    const q = searchFilter.toLowerCase().trim();
    return rawStops.filter((s) => 
      s.name.toLowerCase().includes(q) || 
      (s.city && s.city.toLowerCase().includes(q)) ||
      s.lines.some(l => l.toLowerCase().includes(q))
    );
  }, [activeLineData, directionIndex, searchFilter]);

  // Lignes filtrées pour le sélecteur horizontal
  const availableLinesList = useMemo(() => {
    const all = Object.values(IDF_LINES_DIRECTORY);
    return all.filter((l) => {
      if (modeFilter !== 'all' && l.type !== modeFilter) return false;
      return true;
    });
  }, [modeFilter]);

  // Perturbations filtrées
  const filteredDisruptions = useMemo(() => {
    return disruptions.filter((d) => {
      if (disruptionFilter !== 'all' && d.type !== disruptionFilter) return false;
      return true;
    });
  }, [disruptions, disruptionFilter]);

  // Bascule du pinning pour un arrêt
  const handleTogglePin = (stop: TransitStopItem) => {
    const pinItem: PinnedTransitStop = {
      id: `pin-${activeLineData.key}-${stop.id}-${activeDirection.code}`,
      lineKey: activeLineData.key,
      stopName: stop.name,
      stopId: stop.id,
      direction: activeDirection.destination,
      directionCode: activeDirection.code,
      hubId: stop.hubId,
      addedAt: Date.now(),
    };
    togglePinStop(pinItem);
    setPinnedStopsList(getPinnedStops());
  };

  // Trouver si un incident actif (contrôleur ou arrêt HS) touche un arrêt donné
  const getStopAlerts = (stopName: string) => {
    const stopClean = stopName.toLowerCase();
    const relevant = incidents.filter((inc) => {
      const loc = inc.location_name.toLowerCase();
      const desc = inc.description.toLowerCase();
      return loc.includes(stopClean) || desc.includes(stopClean);
    });

    const controllers = relevant.filter((i) => i.category === 'controleurs');
    const disruptionsList = relevant.filter((i) => i.category === 'arret_perturbe' || i.category === 'fermeture_station');

    return {
      hasControllers: controllers.length > 0,
      controllerCount: controllers.length,
      hasDisruption: disruptionsList.length > 0,
      alerts: relevant,
    };
  };

  const getDisruptionCoordinates = (disrup: TransitDisruptionItem): { lat: number; lng: number } => {
    if (disrup.lineKey === 'M13' || disrup.lineKey === 'M14' || disrup.lineKey === 'T3b') {
      return { lat: 48.8944, lng: 2.3134 }; // Porte de Clichy
    }
    if (disrup.lineKey === 'RER B' || disrup.lineKey === 'Train H') {
      return { lat: 48.8809, lng: 2.3553 }; // Paris Gare du Nord
    }
    if (disrup.lineKey === 'RER C') {
      return { lat: 48.8617, lng: 2.3142 }; // Invalides / Saint-Lazare
    }
    return { lat: 48.8756, lng: 2.3258 }; // Saint-Lazare
  };

  const handleComputeRoute = () => {
    const origin = TRANSIT_STATIONS.find(s => s.name.toLowerCase().includes(originSearch.toLowerCase().trim())) || originStation;
    const dest = TRANSIT_STATIONS.find(s => s.name.toLowerCase().includes(destSearch.toLowerCase().trim())) || destStation;
    const result = calculateMetroRoute(origin.id, dest.id);
    setRoutePlan(result);
    setActiveMetroRoute(result);
  };

  const handleSwapPlannerStations = () => {
    const temp = originSearch;
    setOriginSearch(destSearch);
    setDestSearch(temp);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop sombre et flou */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={closeMetroRouteModal}
        aria-hidden="true"
      />

      {/* Conteneur principal plein écran sur mobile / modal épuré sur desktop */}
      <div 
        className="relative w-full h-[100dvh] sm:h-[92dvh] sm:max-h-[880px] sm:max-w-2xl bg-dark-900 border-0 sm:border border-dark-750 sm:rounded-2xl rounded-none shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200"
      >
        {/* ========================================================= */}
        {/* 1. EN-TÊTE FIXE DU WIDGET (SAFE-AREA NATIVE SMARTPHONE)    */}
        {/* ========================================================= */}
        <div 
          className="px-4 sm:px-6 pb-2.5 border-b border-dark-800 bg-dark-950/98 backdrop-blur-xl shrink-0 flex items-center justify-between z-30"
          style={{
            paddingTop: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-top, 20px)))',
          }}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Train className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Transports IDF en Direct
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  RATP Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Lignes, arrêts défilants, décomptes & radar contrôleurs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMetroRouteModal}
            className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-750 active:bg-dark-700 border border-dark-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95 shadow-sm shrink-0 ml-2"
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. BARRE D'ONGLETS FIXE (TOUJOURS ACCESSIBLE)              */}
        {/* ========================================================= */}
        <div className="px-3 sm:px-6 pt-2 pb-2 bg-dark-950/95 border-b border-dark-800 shrink-0 z-30">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-dark-900 border border-dark-800 text-center">
            {/* Onglet 1 : Lignes & Arrêts */}
            <button
              type="button"
              onClick={() => setActiveTab('explorer')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                activeTab === 'explorer'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-xs">Lignes & Arrêts</span>
            </button>

            {/* Onglet 2 : Épinglés */}
            <button
              type="button"
              onClick={() => setActiveTab('pinned')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                activeTab === 'pinned'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md shadow-amber-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px] sm:text-xs">Épinglés ({pinnedStopsList.length})</span>
            </button>

            {/* Onglet 3 : Info Trafic */}
            <button
              type="button"
              onClick={() => setActiveTab('disruptions')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                activeTab === 'disruptions'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-xs">Info Trafic</span>
            </button>

            {/* Onglet 4 : Itinéraire Direct */}
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                activeTab === 'planner'
                  ? 'bg-dark-800 text-white border border-dark-650 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="text-[10px] sm:text-xs">Itinéraire</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. PLATEFORME DE CONTRÔLE FIXE POUR L'EXPLORATEUR        */}
        {/*    (Résout le problème du défilement et des boutons)     */}
        {/* ========================================================= */}
        {activeTab === 'explorer' && (
          <div className="bg-dark-950/95 border-b border-dark-800 px-3 sm:px-6 py-2.5 shrink-0 z-20 space-y-2.5">
            {/* 3.1 Barre de recherche rapide de station ou de ligne */}
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher une station, arrêt ou ligne (ex: Porte de Clichy, 14, 54)..."
                className="w-full pl-8 pr-8 py-2 bg-dark-900 border border-dark-750 focus:border-cyan-500/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="w-5 h-5 rounded-full bg-dark-800 text-slate-400 hover:text-white absolute right-2 top-2 flex items-center justify-center text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 3.2 Filtre par mode (Tous, Métro, RER, Tram, Bus) & Puces de lignes horizontales */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'Toutes' },
                  { id: 'metro', label: '🚇 Métro' },
                  { id: 'rer', label: '🚆 RER' },
                  { id: 'tram', label: '🚋 Tram' },
                  { id: 'bus', label: '🚌 Bus' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setModeFilter(mode.id as ModeFilter)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition active:scale-95 cursor-pointer ${
                      modeFilter === mode.id
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                        : 'bg-dark-900 text-slate-400 border border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Puces de lignes colorées aux normes RATP / IDFM */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                {availableLinesList.map((line) => {
                  const style = getLineStyle(line.key);
                  const isSelected = normalizeLineKey(line.key) === normalizeLineKey(selectedLineKey);

                  return (
                    <button
                      key={line.key}
                      type="button"
                      onClick={() => {
                        setSelectedLineKey(line.key);
                        setDirectionIndex(0);
                        setSearchFilter('');
                      }}
                      style={{
                        backgroundColor: isSelected ? style.bg : '#111827',
                        color: isSelected ? style.text : '#cbd5e1',
                        borderColor: isSelected ? style.bg : style.bg + '60',
                      }}
                      className={`min-w-[44px] h-8 px-2 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm ${
                        isSelected ? 'ring-2 ring-white/60 scale-105' : 'hover:scale-100 opacity-80 hover:opacity-100'
                      }`}
                      title={style.fullName}
                    >
                      <span>{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3.3 Bandeau fixe de direction & inversion de sens */}
            <div className="p-2.5 rounded-xl bg-dark-900 border border-dark-750 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  style={{ backgroundColor: activeLineStyle.bg, color: activeLineStyle.text }}
                  className="min-w-[32px] h-6 px-1.5 rounded-lg flex items-center justify-center font-mono font-black text-xs shadow-md shrink-0"
                >
                  {activeLineStyle.label}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span>Ligne {activeLineStyle.fullName}</span>
                    <span className="text-[10px] font-normal text-slate-400">({displayedStops.length} arrêts)</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-medium truncate">
                    ➜ {activeDirection.destination}
                  </div>
                </div>
              </div>

              {/* Bouton d'inversion immédiate du sens de circulation */}
              <button
                type="button"
                onClick={() => setDirectionIndex(directionIndex === 0 ? 1 : 0)}
                className="py-1.5 px-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 active:bg-dark-700 border border-dark-700 text-slate-200 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer shrink-0"
                title="Inverser le sens de circulation"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xs:inline text-[11px]">Inverser</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. CORPS DÉFILANT SOUS LES CONTRÔLES FIXES                */}
        {/* ========================================================= */}
        <div 
          ref={stopsListContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3"
          style={{
            paddingBottom: 'max(2.5rem, calc(2rem + env(safe-area-inset-bottom, 24px)))',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* ======================================================= */}
          {/* VUE 1 : TIMELINE DE TOUS LES ARRÊTS DE LA LIGNE         */}
          {/* ======================================================= */}
          {activeTab === 'explorer' && (
            <div className="space-y-1 relative pl-2 sm:pl-3 animate-in fade-in duration-150">
              {/* Ligne conductrice verticale aux couleurs officielles de la ligne */}
              <div 
                style={{ backgroundColor: activeLineStyle.bg }}
                className="absolute left-[17px] sm:left-[21px] top-4 bottom-4 w-1 rounded-full opacity-70 z-0"
              />

              {displayedStops.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-dark-950 border border-dark-800 text-slate-400 text-xs">
                  Aucun arrêt ne correspond à votre recherche "{searchFilter}".
                </div>
              ) : (
                displayedStops.map((stop, idx) => {
                  const isPinned = isStopPinned(stop.name, activeLineData.key, activeDirection.destination);
                  const dep = getStopRealtimeDeparture(
                    stop.id,
                    stop.order,
                    displayedStops.length,
                    activeLineData.key,
                    activeDirection.code,
                    currentAlignedTime
                  );
                  const alerts = getStopAlerts(stop.name);
                  const isTerminal = idx === 0 || idx === displayedStops.length - 1;

                  return (
                    <div 
                      key={stop.id}
                      className="relative z-10 flex items-start gap-3 py-1.5"
                    >
                      {/* Pastille sur l'axe de la ligne */}
                      <div className="shrink-0 pt-1">
                        <div 
                          style={{ borderColor: activeLineStyle.bg }}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isTerminal ? 'bg-white shadow-md scale-110 ring-2 ring-dark-900' : 'bg-dark-950'
                          }`}
                        >
                          <div 
                            style={{ backgroundColor: activeLineStyle.bg }}
                            className="w-1.5 h-1.5 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Carte d'arrêt interactive hautement contrastée */}
                      <div className="flex-1 p-3 rounded-2xl bg-dark-950/90 border border-dark-800 hover:border-dark-700 transition shadow-sm space-y-2">
                        {/* Ligne 1 : Nom de la station & Décompte Live avec Heure de Démarrage */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {stop.name}
                              </h4>
                              {stop.isAccessiblePmr && (
                                <span className="text-[10px] text-sky-400" title="Accessible PMR">♿</span>
                              )}
                            </div>
                            {stop.city && (
                              <p className="text-[10px] text-slate-400 truncate">{stop.city}</p>
                            )}
                          </div>

                          {/* Décompte temps réel vivant : Temps restant ET Heure exacte de départ */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="text-right">
                              <span 
                                className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs tabular-nums flex items-center gap-1.5 shadow-sm ${
                                  dep.isApproaching
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                                    : 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                                }`}
                              >
                                {dep.isApproaching && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                )}
                                <span>{dep.remainingDisplay}</span>
                                <span className="text-[10px] font-normal text-slate-400 font-sans">
                                  ({dep.departureTime})
                                </span>
                              </span>
                              <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                                Suiv. {dep.followingDepartureTime} (+{dep.followingDisplay})
                              </div>
                            </div>

                            {/* Bouton Pin ⭐ 44x44px accessible */}
                            <button
                              type="button"
                              onClick={() => handleTogglePin(stop)}
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0 ${
                                isPinned
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40'
                                  : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-white hover:border-dark-700'
                              }`}
                              title={isPinned ? 'Retirer des favoris' : 'Épingler cet arrêt'}
                              aria-label={isPinned ? 'Retirer des favoris' : 'Épingler cet arrêt'}
                            >
                              <Star className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Ligne 2 : Badges des Correspondances Disponibles */}
                        {stop.lines && stop.lines.length > 1 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] font-mono text-slate-500">Corr. :</span>
                            {stop.lines
                              .filter((l) => normalizeLineKey(l) !== normalizeLineKey(activeLineData.key))
                              .map((corrLine) => {
                                const corrStyle = getLineStyle(corrLine);
                                return (
                                  <button
                                    key={corrLine}
                                    type="button"
                                    onClick={() => {
                                      setSelectedLineKey(corrLine);
                                      setDirectionIndex(0);
                                      setSearchFilter('');
                                    }}
                                    style={{ backgroundColor: corrStyle.bg, color: corrStyle.text }}
                                    className="min-w-[20px] h-4 px-1 rounded text-[9px] font-mono font-bold flex items-center justify-center cursor-pointer transition active:scale-90 hover:opacity-90 shadow-xs"
                                    title={`Basculer vers la ligne ${corrStyle.fullName}`}
                                  >
                                    {corrStyle.label}
                                  </button>
                                );
                              })}
                          </div>
                        )}

                        {/* Bannières d'Alertes Actives sur cet Arrêt (Radar ou HS) */}
                        {alerts.hasControllers && (
                          <div className="p-2 rounded-xl bg-indigo-950/90 border border-indigo-500/70 text-[11px] text-indigo-200 flex items-center justify-between gap-2 animate-in fade-in">
                            <span className="flex items-center gap-1.5">
                              <span className="text-base">👮</span>
                              <span className="font-semibold">Contrôleurs signalés récemment à cet arrêt !</span>
                            </span>
                            <span className="text-[9px] font-mono bg-indigo-900 px-1.5 py-0.5 rounded text-indigo-300 shrink-0">
                              Radar Actif
                            </span>
                          </div>
                        )}

                        {alerts.hasDisruption && (
                          <div className="p-2 rounded-xl bg-rose-950/90 border border-rose-500/70 text-[11px] text-rose-200 flex items-center gap-1.5 animate-in fade-in">
                            <span className="text-base">🚫</span>
                            <span className="font-semibold">Arrêt perturbé ou accès réduit signalé par les usagers.</span>
                          </div>
                        )}

                        {/* Actions Rapides pour cet Arrêt */}
                        <div className="flex items-center justify-between pt-1 border-t border-dark-850 text-[11px] font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              flyTo(stop.lat, stop.lng, 16);
                              closeMetroRouteModal();
                            }}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer py-1"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Voir sur la carte</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                openReportModal({
                                  category: 'controleurs',
                                  address: stop.name,
                                  line: activeLineData.key,
                                  lat: stop.lat,
                                  lng: stop.lng,
                                });
                              }}
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer py-1 font-semibold"
                              title="Signaler des contrôleurs ici"
                            >
                              <span>👮 Signaler</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* VUE 2 : MES TRANSPORTS ÉPINGLÉS (TABLEAU DE BORD)       */}
          {/* ======================================================= */}
          {activeTab === 'pinned' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span>Vos Lignes & Arrêts Favoris</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Décomptes en direct synchronisés avec le serveur
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('explorer')}
                  className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un arrêt</span>
                </button>
              </div>

              {pinnedStopsList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-dark-950 border border-dark-800 space-y-3">
                  <Star className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">Aucun arrêt épinglé pour le moment.</p>
                  <p className="text-[11px] text-slate-400">
                    Allez dans l'onglet "Lignes & Arrêts" et cliquez sur l'étoile ⭐ pour ajouter vos lignes du quotidien (M13, M14, T3b, Bus 54...).
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('explorer')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Explorer les lignes IDF
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {pinnedStopsList.map((pin) => {
                    const style = getLineStyle(pin.lineKey);
                    const dep = getStopRealtimeDeparture(
                      pin.stopId,
                      3,
                      15,
                      pin.lineKey,
                      pin.directionCode || 'DIR',
                      currentAlignedTime
                    );

                    return (
                      <div
                        key={pin.id}
                        className="p-3.5 rounded-2xl bg-dark-950 border border-dark-750 hover:border-dark-650 transition flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Badge de la ligne */}
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="min-w-[32px] h-7 px-1.5 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-sm"
                          >
                            {style.label}
                          </span>

                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {pin.stopName}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-cyan-400 truncate">
                              ➜ {pin.direction}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span 
                              className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs tabular-nums flex items-center gap-1.5 ${
                                dep.isApproaching
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                              }`}
                            >
                              {dep.isApproaching && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              )}
                              <span>{dep.remainingDisplay}</span>
                              <span className="text-[10px] font-normal text-slate-400">
                                ({dep.departureTime})
                              </span>
                            </span>
                            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                              Suiv. {dep.followingDepartureTime} (+{dep.followingDisplay})
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              togglePinStop(pin);
                              setPinnedStopsList(getPinnedStops());
                            }}
                            className="w-8 h-8 rounded-xl bg-dark-900 hover:bg-dark-800 text-amber-400 border border-dark-750 transition active:scale-90 cursor-pointer flex items-center justify-center"
                            title="Désépingler"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Suggestions d'arrêts quotidiens IDF si peu d'arrêts épinglés */}
              <div className="pt-3 border-t border-dark-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400">
                  Suggestions rapides pour vos trajets réguliers :
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'M13 Porte de Clichy', line: 'M13', stop: 'Porte de Clichy', id: 'm13-porte-clichy', dir: 'Châtillon - Montrouge', dirCode: 'SUD' },
                    { label: 'M14 Saint-Lazare', line: 'M14', stop: 'Saint-Lazare', id: 'm14-saint-lazare', dir: 'Aéroport d\'Orly', dirCode: 'ORL' },
                    { label: 'T3b Porte de Clichy', line: 'T3b', stop: 'Porte de Clichy', id: 't3b-porte-clichy', dir: 'Porte de Vincennes', dirCode: 'VIN' },
                    { label: 'Bus 54 Gabriel Péri', line: 'Bus 54', stop: 'Gabriel Péri', id: 'b54-gabriel-peri', dir: 'Porte d\'Aubervilliers', dirCode: 'EST' },
                    { label: 'Bus 66 Saint-Ouen', line: 'Bus 66', stop: 'Mairie de Saint-Ouen', id: 'b66-st-ouen', dir: 'Opéra', dirCode: 'SUD' },
                  ].map((sug) => {
                    const isAlready = isStopPinned(sug.stop, sug.line, sug.dir);
                    return (
                      <button
                        key={sug.label}
                        type="button"
                        onClick={() => {
                          const p: PinnedTransitStop = {
                            id: `pin-${sug.line}-${sug.id}-${sug.dirCode}`,
                            lineKey: sug.line,
                            stopName: sug.stop,
                            stopId: sug.id,
                            direction: sug.dir,
                            directionCode: sug.dirCode,
                            addedAt: Date.now(),
                          };
                          togglePinStop(p);
                          setPinnedStopsList(getPinnedStops());
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          isAlready
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-dark-950 text-slate-300 border border-dark-800 hover:border-dark-700'
                        }`}
                      >
                        <span>{isAlready ? '✓' : '+'}</span>
                        <span>{sug.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VUE 3 : INFO TRAFIC IDF (RETARDS, ANNULATIONS & GRÈVES)  */}
          {/* ======================================================= */}
          {activeTab === 'disruptions' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Info Trafic & Perturbations Réseau</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Retards, trains supprimés, alertes grèves et pannes d'escalators
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openReportModal({ category: 'greve_retard' })}
                  className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Signaler un problème</span>
                </button>
              </div>

              {/* Filtres de perturbations */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'Toutes les alertes' },
                  { id: 'delay', label: '⏱️ Retards majeurs' },
                  { id: 'cancellation', label: '🚫 Trains supprimés' },
                  { id: 'strike', label: '🪧 Grèves & Préavis' },
                  { id: 'station_closure', label: '♿ Pannes & Arrêts HS' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setDisruptionFilter(f.id as DisruptionFilter)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition active:scale-95 cursor-pointer ${
                      disruptionFilter === f.id
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-dark-950/80 text-slate-400 border border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Liste des perturbations */}
              <div className="space-y-2.5">
                {filteredDisruptions.map((disrup) => {
                  const style = getLineStyle(disrup.lineKey);

                  return (
                    <div
                      key={disrup.id}
                      className="p-3.5 rounded-2xl bg-dark-950 border border-dark-750 hover:border-dark-650 transition space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="min-w-[28px] h-6 px-1.5 rounded-md flex items-center justify-center font-mono font-black text-xs shrink-0"
                          >
                            {style.label}
                          </span>
                          <span className="font-bold text-xs text-white truncate">
                            {disrup.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {disrup.updatedAt}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {disrup.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-dark-800 text-[10px] font-mono text-slate-400">
                        {disrup.impactedSection && (
                          <span className="text-rose-400">Tronçon : {disrup.impactedSection}</span>
                        )}
                        {disrup.estimatedResolution && (
                          <span className="text-slate-400">{disrup.estimatedResolution}</span>
                        )}
                      </div>

                      {/* Actions Rapides 1-Tap : Voir sur Carte & Confirmer/Signaler */}
                      <div className="flex items-center justify-between pt-2 border-t border-dark-800 text-[11px] font-mono">
                        <button
                          type="button"
                          onClick={() => {
                            const coords = getDisruptionCoordinates(disrup);
                            flyTo(coords.lat, coords.lng, 15);
                            closeMetroRouteModal();
                          }}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer py-1"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Voir sur la carte</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const coords = getDisruptionCoordinates(disrup);
                            openReportModal({
                              category: disrup.type === 'station_closure' ? 'arret_perturbe' : 'greve_retard',
                              line: disrup.lineKey,
                              address: disrup.impactedSection || `${disrup.lineLabel} - ${disrup.title}`,
                              lat: coords.lat,
                              lng: coords.lng,
                            });
                          }}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer py-1 font-semibold"
                          title="Confirmer ou signaler une aggravation"
                        >
                          <span>📢 Confirmer / Signaler</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VUE 4 : ITINÉRAIRE DIRECT (POINT A ➔ POINT B)           */}
          {/* ======================================================= */}
          {activeTab === 'planner' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-750 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white">Calculateur d'Itinéraire Multimodal</h3>
                  <button
                    type="button"
                    onClick={handleSwapPlannerStations}
                    className="p-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
                    title="Inverser départ et arrivée"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-mono">Inverser</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Départ</label>
                    <input
                      type="text"
                      value={originSearch}
                      onChange={(e) => setOriginSearch(e.target.value)}
                      placeholder="Gare ou station de départ..."
                      className="w-full p-2.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Arrivée</label>
                    <input
                      type="text"
                      value={destSearch}
                      onChange={(e) => setDestSearch(e.target.value)}
                      placeholder="Gare ou station d'arrivée..."
                      className="w-full p-2.5 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleComputeRoute}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    Calculer le Trajet le Plus Rapide
                  </button>
                </div>
              </div>

              {routePlan && (
                <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-750 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">
                      Durée : ~{routePlan.totalDurationMin} min ({routePlan.transfersCount} correspondance{routePlan.transfersCount > 1 ? 's' : ''})
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                      Départ : {routePlan.departureTime}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-dark-800">
                    {routePlan.legs.map((leg, idx) => {
                      const legStyle = getLineStyle(leg.line);
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <span
                            style={{ backgroundColor: legStyle.bg, color: legStyle.text }}
                            className="min-w-[24px] h-5 px-1 rounded flex items-center justify-center font-mono font-bold text-[10px]"
                          >
                            {legStyle.label}
                          </span>
                          <span>De <strong>{leg.fromStation}</strong> à <strong>{leg.toStation}</strong></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
