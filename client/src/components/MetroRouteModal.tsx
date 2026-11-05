import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Train, 
  ArrowUpDown, 
  Navigation,
  Compass,
  Star,
  AlertTriangle,
  Plus
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

  // Onglet actif : 'explorer' (Explorateur de lignes & arrêts), 'pinned' (Mes Transports Épinglés), 'disruptions' (Retards & Grèves), 'planner' (Trajet A ➔ B)
  const [activeTab, setActiveTab] = useState<ModalTab>('explorer');

  // Ligne sélectionnée pour l'explorateur (M13 par défaut, la ligne préférée)
  const [selectedLineKey, setSelectedLineKey] = useState<string>('M13');
  const [directionIndex, setDirectionIndex] = useState<number>(0);
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Utilisation explicite du ticker pour forcer le rafraîchissement réactif
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
      return rawStops.reverse();
    }
    return rawStops;
  }, [activeLineData, directionIndex]);

  // Lignes filtrées pour le sélecteur
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

  const handleComputeRoute = () => {
    const origin = TRANSIT_STATIONS.find(s => s.name.toLowerCase().includes(originSearch.toLowerCase().trim())) || originStation;
    const dest = TRANSIT_STATIONS.find(s => s.name.toLowerCase().includes(destSearch.toLowerCase().trim())) || destStation;
    const result = calculateMetroRoute(origin.id, dest.id);
    setRoutePlan(result);
    setActiveMetroRoute(result);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop sombre */}
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
        {/* EN-TÊTE MODALE AVEC SAFE-AREA POUR SMARTPHONE             */}
        {/* ========================================================= */}
        <div 
          className="px-4 sm:px-6 pb-3 border-b border-dark-800 bg-dark-950/95 backdrop-blur-md shrink-0 flex items-center justify-between"
          style={{
            paddingTop: 'max(0.85rem, calc(0.6rem + env(safe-area-inset-top, 20px)))',
          }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Train className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Transports IDF en Temps Réel</h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  RATP Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lignes, arrêts défilants, décomptes à la seconde & radar contrôleurs
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

        {/* ========================================================= */}
        {/* BARRE D'ONGLETS PRINCIPALE DU WIDGET                      */}
        {/* ========================================================= */}
        <div className="px-3 sm:px-6 pt-2.5 pb-2 bg-dark-950/80 border-b border-dark-800 shrink-0">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-dark-950 border border-dark-800 text-center">
            {/* Onglet 1 : Explorateur de Lignes & Arrêts */}
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

            {/* Onglet 2 : Mes Favoris Épinglés */}
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

            {/* Onglet 3 : Info Trafic & Retards / Grèves */}
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
              <span className="text-[10px] sm:text-xs">Retards & Grèves</span>
            </button>

            {/* Onglet 4 : Trajet Direct */}
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
        {/* CORPS PRINCIPAL SELON L'ONGLET ACTIF                      */}
        {/* ========================================================= */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-4"
          style={{
            paddingBottom: 'max(2.5rem, calc(2rem + env(safe-area-inset-bottom, 24px)))',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* ======================================================= */}
          {/* VUE 1 : EXPLORATEUR DE LIGNES & ARRÊTS DÉFILANTS        */}
          {/* ======================================================= */}
          {activeTab === 'explorer' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Sélecteur de Mode (Métro, RER, Tram, Bus, Train) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'all', label: 'Toutes les Lignes' },
                  { id: 'metro', label: 'Métro' },
                  { id: 'rer', label: 'RER' },
                  { id: 'tram', label: 'Tramway' },
                  { id: 'bus', label: 'Bus IDF' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setModeFilter(mode.id as ModeFilter)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition active:scale-95 cursor-pointer ${
                      modeFilter === mode.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'bg-dark-950/80 text-slate-400 border border-dark-800 hover:border-dark-700'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Barre de Puces de Lignes Claires & Colorées */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
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
                      }}
                      style={{
                        backgroundColor: isSelected ? style.bg : '#111827',
                        color: isSelected ? style.text : '#cbd5e1',
                        borderColor: isSelected ? style.bg : style.bg + '60',
                      }}
                      className={`min-w-[48px] h-9 px-2.5 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm ${
                        isSelected ? 'ring-2 ring-white/50 scale-105' : 'hover:scale-100 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span>{style.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bannière de la Ligne Sélectionnée & Choix du Sens / Terminus */}
              <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-750 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: activeLineStyle.bg, color: activeLineStyle.text }}
                      className="min-w-[34px] h-7 px-2 rounded-lg flex items-center justify-center font-mono font-black text-xs shadow-md shrink-0"
                    >
                      {activeLineStyle.label}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Ligne {activeLineStyle.fullName}</span>
                        <span className="text-[10px] font-normal text-slate-400">({activeLineData.stops.length} arrêts)</span>
                      </div>
                      <div className="text-[11px] text-cyan-400 font-medium">
                        Direction : {activeDirection.destination}
                      </div>
                    </div>
                  </div>

                  {/* Bouton Inverser le Sens */}
                  <button
                    type="button"
                    onClick={() => setDirectionIndex(directionIndex === 0 ? 1 : 0)}
                    className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-dark-700 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer"
                    title="Inverser le sens de circulation"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Inverser le Sens</span>
                  </button>
                </div>

                {/* Bascule Rapide Terminus A ↔ Terminus B */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDirectionIndex(0)}
                    className={`p-2 rounded-xl border text-left transition active:scale-95 cursor-pointer ${
                      directionIndex === 0
                        ? 'bg-indigo-950/70 border-indigo-500/80 text-white shadow-md'
                        : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Terminus 1</div>
                    <div className="font-semibold truncate text-[11px]">{activeLineData.directions[0].destination}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectionIndex(1)}
                    className={`p-2 rounded-xl border text-left transition active:scale-95 cursor-pointer ${
                      directionIndex === 1
                        ? 'bg-indigo-950/70 border-indigo-500/80 text-white shadow-md'
                        : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Terminus 2</div>
                    <div className="font-semibold truncate text-[11px]">{activeLineData.directions[1].destination}</div>
                  </button>
                </div>
              </div>

              {/* TIMELINE DÉFILANTE DE TOUS LES ARRÊTS DE LA LIGNE */}
              <div className="space-y-1 relative pl-2 sm:pl-3">
                {/* Ligne verticale conductrice aux couleurs de la ligne */}
                <div 
                  style={{ backgroundColor: activeLineStyle.bg }}
                  className="absolute left-[17px] sm:left-[21px] top-4 bottom-4 w-1 rounded-full opacity-70 z-0"
                />

                {displayedStops.map((stop, idx) => {
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
                      className="relative z-10 flex items-start gap-3.5 py-1.5"
                    >
                      {/* Pastille sur l'axe de la ligne */}
                      <div className="shrink-0 pt-1">
                        <div 
                          style={{ borderColor: activeLineStyle.bg }}
                          className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isTerminal ? 'bg-white shadow-md scale-110' : 'bg-dark-950'
                          }`}
                        >
                          <div 
                            style={{ backgroundColor: activeLineStyle.bg }}
                            className="w-1.5 h-1.5 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Carte d'arrêt interactive */}
                      <div className="flex-1 p-2.5 sm:p-3 rounded-xl bg-dark-950/90 border border-dark-800 hover:border-dark-700 transition shadow-sm space-y-2">
                        {/* Ligne 1 : Nom de la station & Décompte Live */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {stop.name}
                              </h4>
                              {stop.isAccessiblePmr && (
                                <span className="text-[10px] text-sky-400" title="Accessible PMR">♿</span>
                              )}
                            </div>
                            {stop.city && (
                              <p className="text-[10px] text-slate-400">{stop.city}</p>
                            )}
                          </div>

                          {/* Décompte temps réel vivant */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span 
                              className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm ${
                                dep.isApproaching
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                              }`}
                            >
                              {dep.isApproaching && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              )}
                              <span>{dep.remainingDisplay}</span>
                              <span className="text-[10px] font-normal text-slate-400 font-sans hidden xs:inline">
                                ({dep.departureTime})
                              </span>
                            </span>

                            {/* Bouton Pin ⭐ */}
                            <button
                              type="button"
                              onClick={() => handleTogglePin(stop)}
                              className={`p-1.5 rounded-lg border transition active:scale-95 cursor-pointer ${
                                isPinned
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                                  : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-white'
                              }`}
                              title={isPinned ? 'Retirer des favoris' : 'Épingler cet arrêt'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
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

                        {/* Bannières d'Alertes Actives sur cet Arrêt */}
                        {alerts.hasControllers && (
                          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/60 text-[11px] text-indigo-200 flex items-center justify-between gap-2 animate-in fade-in">
                            <span className="flex items-center gap-1.5">
                              <span className="text-sm">👮</span>
                              <span className="font-semibold">Contrôleurs signalés récemment à cet arrêt !</span>
                            </span>
                            <span className="text-[9px] font-mono bg-indigo-900 px-1 py-0.5 rounded text-indigo-300">
                              Radar Actif
                            </span>
                          </div>
                        )}

                        {alerts.hasDisruption && (
                          <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/60 text-[11px] text-rose-200 flex items-center gap-1.5 animate-in fade-in">
                            <span className="text-sm">🚫</span>
                            <span className="font-semibold">Arrêt perturbé ou accès réduit signalé par les usagers.</span>
                          </div>
                        )}

                        {/* Actions Rapides pour cet Arrêt */}
                        <div className="flex items-center justify-between pt-1 border-t border-dark-850 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              flyTo(stop.lat, stop.lng, 16);
                              closeMetroRouteModal();
                            }}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Voir sur la carte</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={openReportModal}
                              className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                              title="Signaler des contrôleurs ici"
                            >
                              <span>👮 Signaler</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    Allez dans l'onglet "Lignes & Arrêts" et cliquez sur l'étoile ⭐ pour ajouter vos lignes du quotidien.
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
                        className="p-3 rounded-2xl bg-dark-950 border border-dark-750 hover:border-dark-650 transition flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Badge de la ligne */}
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="min-w-[28px] h-7 px-1.5 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-sm"
                          >
                            {style.label}
                          </span>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {pin.stopName}
                            </div>
                            <div className="text-[10px] text-cyan-400 truncate">
                              ➜ {pin.direction}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span 
                            className={`px-2 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 ${
                              dep.isApproaching
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulse'
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                            }`}
                          >
                            {dep.isApproaching && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                            <span>{dep.remainingDisplay}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              togglePinStop(pin);
                              setPinnedStopsList(getPinnedStops());
                            }}
                            className="p-1.5 rounded-lg bg-dark-900 hover:bg-dark-800 text-amber-400 border border-dark-750 transition active:scale-90 cursor-pointer"
                            title="Désépingler"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                  onClick={openReportModal}
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
                        <div className="flex items-center gap-2">
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="min-w-[26px] h-6 px-1.5 rounded-md flex items-center justify-center font-mono font-black text-xs shrink-0"
                          >
                            {style.label}
                          </span>
                          <span className="font-bold text-xs text-white">
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
              <div className="p-3 rounded-2xl bg-dark-950 border border-dark-750 space-y-3">
                <h3 className="text-xs font-bold text-white">Calculateur d'Itinéraire Multimodal</h3>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Départ</label>
                    <input
                      type="text"
                      value={originSearch}
                      onChange={(e) => setOriginSearch(e.target.value)}
                      placeholder="Gare ou station de départ..."
                      className="w-full p-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Arrivée</label>
                    <input
                      type="text"
                      value={destSearch}
                      onChange={(e) => setDestSearch(e.target.value)}
                      placeholder="Gare ou station d'arrivée..."
                      className="w-full p-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
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
