import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  X, 
  Plus, 
  MapPin, 
  Navigation,
  ArrowUp, 
  ArrowDown,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { 
  CustomWidgetConfig, 
  CustomWidgetLineItem, 
  WidgetTheme, 
  WidgetDensity 
} from '../types';
import { 
  getLineStyle, 
  getStopRealtimeDeparture, 
  getAlignedNow, 
  normalizeLineKey 
} from '../services/ratpRealtimeService';
import { PARIS_TRANSPORT_HUBS } from '../data/ratpHubs';
import { IDF_LINES_DIRECTORY } from '../data/transitLinesData';

const WIDGET_STORAGE_KEY = 'maparis_custom_widget_config_v1';

// Lignes pré-configurées par défaut (Lignes majeures parisiennes avec Porte de Clichy / Saint-Lazare)
export const DEFAULT_WIDGET_CONFIG: CustomWidgetConfig = {
  enabled: true,
  dockPosition: 'bottom',
  theme: 'glass',
  density: 'standard',
  locationMode: 'gps',
  selectedStationId: 'station-porte-de-clichy',
  selectedStationName: 'Porte de Clichy',
  lines: [
    {
      id: 'item-m13-clichy-sud',
      lineKey: 'M13',
      stopName: 'Porte de Clichy',
      stopId: 'stop-m13-porte-de-clichy',
      direction: 'Châtillon - Montrouge',
      directionCode: 'SUD',
      customLabel: 'Métro 13',
    },
    {
      id: 'item-m14-clichy-sud',
      lineKey: 'M14',
      stopName: 'Porte de Clichy',
      stopId: 'stop-m14-porte-de-clichy',
      direction: 'Aéroport d\'Orly',
      directionCode: 'SUD',
      customLabel: 'Métro 14',
    },
    {
      id: 'item-rerc-clichy-est',
      lineKey: 'RER C',
      stopName: 'Porte de Clichy',
      stopId: 'stop-rerc-porte-de-clichy',
      direction: 'Saint-Martin-d\'Étampes / Dourdan',
      directionCode: 'EST',
      customLabel: 'RER C',
    },
    {
      id: 'item-t3b-clichy-dau',
      lineKey: 'T3b',
      stopName: 'Porte de Clichy',
      stopId: 'stop-t3b-porte-de-clichy',
      direction: 'Porte Dauphine',
      directionCode: 'DAU',
      customLabel: 'Tramway T3b',
    },
  ],
};

export function loadWidgetConfig(): CustomWidgetConfig {
  try {
    const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.lines)) {
        return { ...DEFAULT_WIDGET_CONFIG, ...parsed };
      }
    }
  } catch (err) {
    console.warn('[Widget] Erreur lecture config locale, fallback défaut:', err);
  }
  return DEFAULT_WIDGET_CONFIG;
}

export function saveWidgetConfig(config: CustomWidgetConfig): void {
  try {
    localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('[Widget] Erreur sauvegarde config locale:', err);
  }
}

/**
 * Calcul de distance en mètres entre 2 coordonnées
 */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Composant Widget de Transport Personnalisable & Constructeur
 */
export const CustomTransitWidget: React.FC = () => {
  const { 
    isReportModalOpen, 
    isSafeRouteModalOpen, 
    isMetroRouteModalOpen, 
    isMobileMenuOpen,
    openMetroRouteModal,
  } = useIncidentStore();

  const [config, setConfig] = useState<CustomWidgetConfig>(() => loadWidgetConfig());
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [ticker, setTicker] = useState<number>(0);

  // Station la plus proche
  const [nearestStation, setNearestStation] = useState<{ name: string; distanceMeters: number } | null>(null);

  // Modal d'ajout de nouvelle ligne
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [selectedAddLineKey, setSelectedAddLineKey] = useState<string>('M1');
  const [selectedAddDirectionIndex, setSelectedAddDirectionIndex] = useState<number>(0);
  const [selectedAddStopId, setSelectedAddStopId] = useState<string>('');

  // Synchronisation avec un événement custom (permettant à MobileDrawer d'ouvrir le builder)
  useEffect(() => {
    const handleOpenBuilderEvent = () => setIsBuilderOpen(true);
    window.addEventListener('maparis:open-widget-builder', handleOpenBuilderEvent);
    return () => window.removeEventListener('maparis:open-widget-builder', handleOpenBuilderEvent);
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    saveWidgetConfig(config);
  }, [config]);

  // Horloge 1s pour temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Détection GPS temps réel si mode 'gps'
  useEffect(() => {
    if (config.locationMode !== 'gps') return;

    if (!('geolocation' in navigator)) {
      setNearestStation({ name: 'Porte de Clichy', distanceMeters: 80 });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Trouver la station RATP la plus proche
        let closest = PARIS_TRANSPORT_HUBS[0];
        let minDistance = Infinity;

        for (const hub of PARIS_TRANSPORT_HUBS) {
          const dist = getDistanceMeters(lat, lng, hub.lat, hub.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closest = hub;
          }
        }

        setNearestStation({
          name: closest.name,
          distanceMeters: Math.round(minDistance),
        });
      },
      (err) => {
        console.warn('[Widget] GPS non disponible ou refusé, repli sur Porte de Clichy:', err);
        setNearestStation({ name: 'Porte de Clichy (GPS simulé)', distanceMeters: 110 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [config.locationMode]);

  // Masquer lorsque des modales plein écran sont ouvertes
  if (isReportModalOpen || isSafeRouteModalOpen || isMetroRouteModalOpen || isMobileMenuOpen) {
    return null;
  }

  if (!config.enabled) {
    return null;
  }

  // Styles selon le Thème choisi par l'utilisateur
  const getThemeClasses = (theme: WidgetTheme) => {
    switch (theme) {
      case 'oled':
        return {
          container: 'bg-black border border-emerald-500/40 text-white shadow-[0_8px_32px_rgba(0,0,0,0.95)]',
          header: 'bg-black border-b border-dark-800 text-emerald-400',
          item: 'bg-dark-950 border border-dark-800 hover:border-emerald-500/50',
          accent: 'text-emerald-400',
          highlight: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80',
        };
      case 'neon':
        return {
          container: 'bg-dark-950/95 border border-cyan-400/50 text-white shadow-[0_0_25px_rgba(34,211,238,0.25)] backdrop-blur-2xl',
          header: 'bg-dark-900/90 border-b border-cyan-500/30 text-cyan-300',
          item: 'bg-dark-900/80 border border-cyan-500/20 hover:border-cyan-400/60',
          accent: 'text-cyan-400',
          highlight: 'bg-cyan-950/90 text-cyan-300 border border-cyan-600/80',
        };
      case 'classic':
        return {
          container: 'bg-[#0f172a] border border-blue-500/40 text-slate-100 shadow-2xl',
          header: 'bg-[#090d16] border-b border-blue-900/60 text-blue-300',
          item: 'bg-[#1e293b]/90 border border-blue-900/40 hover:border-blue-400/50',
          accent: 'text-blue-400',
          highlight: 'bg-blue-950 text-blue-300 border border-blue-700',
        };
      case 'glass':
      default:
        return {
          container: 'bg-dark-950/85 backdrop-blur-2xl border border-dark-750/90 text-white shadow-[0_12px_40px_rgba(0,0,0,0.8)]',
          header: 'bg-dark-900/80 border-b border-dark-800/80 text-indigo-300',
          item: 'bg-dark-900/70 border border-dark-800 hover:border-indigo-500/40',
          accent: 'text-indigo-400',
          highlight: 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80',
        };
    }
  };

  const themeStyles = getThemeClasses(config.theme);

  // Déplacement haut / bas pour réordonnancement total
  const moveLine = (index: number, direction: 'up' | 'down') => {
    const newLines = [...config.lines];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLines.length) return;
    const temp = newLines[index];
    newLines[index] = newLines[targetIndex];
    newLines[targetIndex] = temp;
    setConfig({ ...config, lines: newLines });
  };

  // Suppression d'une ligne
  const removeLine = (id: string) => {
    setConfig({
      ...config,
      lines: config.lines.filter((l) => l.id !== id),
    });
  };

  // Ajout d'une ligne
  const handleConfirmAddLine = () => {
    const lineData = IDF_LINES_DIRECTORY[normalizeLineKey(selectedAddLineKey)];
    if (!lineData) return;

    const dir = lineData.directions[selectedAddDirectionIndex] || lineData.directions[0];
    const stop = lineData.stops.find((s) => s.id === selectedAddStopId) || lineData.stops[0];

    const newItem: CustomWidgetLineItem = {
      id: `item-${lineData.key}-${stop.id}-${dir.code}-${Date.now()}`,
      lineKey: lineData.key,
      stopName: stop.name,
      stopId: stop.id,
      direction: dir.destination,
      directionCode: dir.code,
      customLabel: `${lineData.type.toUpperCase()} ${lineData.name}`,
    };

    setConfig({
      ...config,
      lines: [...config.lines, newItem],
    });
    setIsAddLineOpen(false);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. LE WIDGET FLOTTANT SUR LE TÉLÉPHONE                    */}
      {/* ========================================================= */}
      <div 
        className="fixed z-30 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 transition-all duration-300 pointer-events-auto select-none"
        style={{
          bottom: 'max(4.75rem, calc(4.25rem + env(safe-area-inset-bottom, 20px)))',
        }}
      >
        <div className={`rounded-2xl overflow-hidden transition-all duration-200 ${themeStyles.container}`}>
          
          {/* En-tête compact du Widget */}
          <div className={`px-3.5 py-2 flex items-center justify-between text-xs font-bold ${themeStyles.header}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-white">Mon Quotidien</span>
                <span className="text-[10px] opacity-75 font-mono truncate">
                  {config.locationMode === 'gps'
                    ? (nearestStation ? `📍 ${nearestStation.name} (${nearestStation.distanceMeters}m)` : '📡 GPS Localisation...')
                    : `🚉 ${config.selectedStationName || 'Station Fixe'}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Bouton Constructeur / Réglages */}
              <button
                type="button"
                onClick={() => setIsBuilderOpen(true)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
                title="Personnaliser le design et l'ordre des transports"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Replier / Déplier */}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
                title={isCollapsed ? 'Déplier' : 'Réduire'}
              >
                {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Corps du Widget : Lignes ordonnées par l'utilisateur */}
          {!isCollapsed && (
            <div className="p-2 sm:p-2.5 space-y-1.5 max-h-64 overflow-y-auto overscroll-contain">
              {config.lines.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  <p>Aucun transport configuré.</p>
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(true)}
                    className="mt-2 px-3 py-1 bg-cyan-600 text-white rounded-lg font-bold text-xs"
                  >
                    + Ajouter mes lignes
                  </button>
                </div>
              ) : (
                config.lines.map((item, index) => {
                  const liveNow = ticker ? getAlignedNow() : getAlignedNow();
                  const style = getLineStyle(item.lineKey);
                  const dep = getStopRealtimeDeparture(
                    item.stopId,
                    index * 2 + 1,
                    15,
                    item.lineKey,
                    item.directionCode || 'DIR',
                    liveNow
                  );

                  if (config.density === 'compact') {
                    return (
                      <div
                        key={item.id}
                        onClick={() => openMetroRouteModal(item.stopId)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition active:scale-[0.98] ${themeStyles.item}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="min-w-[24px] h-5 px-1 rounded-md flex items-center justify-center font-mono font-black text-[10px] shrink-0"
                          >
                            {style.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {item.direction}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            dep.isApproaching ? 'bg-emerald-500/20 text-emerald-300 animate-pulse' : 'text-emerald-400'
                          }`}>
                            {dep.remainingDisplay}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  if (config.density === 'ticker') {
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs font-mono ${themeStyles.item}`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="w-5 h-4 rounded text-[9px] font-bold flex items-center justify-center"
                          >
                            {style.label}
                          </span>
                          <span className="text-[11px] text-slate-300 truncate">{item.stopName} ➜ {item.direction}</span>
                        </div>
                        <span className="text-emerald-400 font-bold ml-2 shrink-0">{dep.remainingDisplay} ({dep.departureTime})</span>
                      </div>
                    );
                  }

                  // Mode Standard / Détaillé
                  return (
                    <div
                      key={item.id}
                      onClick={() => openMetroRouteModal(item.stopId)}
                      className={`p-2 rounded-xl transition cursor-pointer active:scale-[0.99] ${themeStyles.item}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="min-w-[26px] h-5 px-1.5 rounded-md flex items-center justify-center font-mono font-black text-[10px] shadow-sm shrink-0"
                          >
                            {style.label}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-white truncate">
                              {item.stopName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              ➜ {item.direction}
                            </div>
                          </div>
                        </div>

                        {/* Décompte exact et heure d'arrivée */}
                        <div className="text-right shrink-0">
                          <div className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                            dep.isApproaching ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 animate-pulse' : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
                          }`}>
                            <span>{dep.remainingDisplay}</span>
                          </div>
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                            {dep.departureTime} · Suiv. {dep.followingDisplay}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Footer d'action rapide */}
          <div className="px-3 py-1.5 bg-black/40 border-t border-dark-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Actualisation continue
            </span>
            <button
              type="button"
              onClick={() => openMetroRouteModal()}
              className="text-cyan-400 hover:text-cyan-300 font-bold transition flex items-center gap-0.5"
            >
              Voir tout le réseau ➜
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. LE CONSTRUCTEUR DE WIDGET COMPLET (BUILDER & ORDRE)    */}
      {/* ========================================================= */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            onClick={() => setIsBuilderOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg max-h-[92dvh] bg-dark-900 border border-dark-750 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* Header Builder */}
            <div className="px-5 py-3.5 border-b border-dark-800 bg-dark-950/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Constructeur de Widget Mon Quotidien
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ordre sur-mesure, design personnalisé & décomptes exacts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-750 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps du Constructeur défilant */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
              
              {/* 1. Activer / Désactiver le Widget */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-dark-850 border border-dark-750">
                <div>
                  <div className="font-bold text-white text-xs">Afficher le Widget sur mon écran</div>
                  <div className="text-[11px] text-slate-400">Reste toujours visible avec les prochains départs</div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                  className={`px-3 py-1.5 rounded-xl font-bold font-mono transition cursor-pointer ${
                    config.enabled ? 'bg-emerald-600 text-white shadow-md' : 'bg-dark-750 text-slate-400'
                  }`}
                >
                  {config.enabled ? 'ACTIF' : 'DÉSACTIVÉ'}
                </button>
              </div>

              {/* 2. Mode de Détection d'Emplacement */}
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-2">
                  1. Localisation des Transports
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, locationMode: 'gps' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      config.locationMode === 'gps'
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-white ring-1 ring-cyan-500'
                        : 'bg-dark-850 border-dark-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1 text-cyan-400">
                      <Navigation className="w-4 h-4" />
                      <span>Autour de moi (GPS)</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Calcule les lignes et arrêts les plus proches en temps réel
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, locationMode: 'station' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      config.locationMode === 'station'
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-white ring-1 ring-indigo-500'
                        : 'bg-dark-850 border-dark-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1 text-indigo-400">
                      <MapPin className="w-4 h-4" />
                      <span>Station Fixe</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Verrouillé sur une station précise de votre choix
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Choix du Thème Visuel */}
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-2">
                  2. Design & Thème Visuel
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'glass', label: 'Verre Givré', desc: 'Glassmorphism' },
                    { id: 'oled', label: 'OLED Noir', desc: 'Noir 100% pur' },
                    { id: 'neon', label: 'Néon Cyber', desc: 'Cyan & Violet' },
                    { id: 'classic', label: 'Métro Paris', desc: 'RATP Classique' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setConfig({ ...config, theme: theme.id as WidgetTheme })}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        config.theme === theme.id
                          ? 'bg-dark-800 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/50'
                          : 'bg-dark-850 border-dark-750 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{theme.label}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{theme.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Densité d'Affichage */}
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-2">
                  3. Densité d'Affichage
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'Compact', desc: '1 ligne par transport' },
                    { id: 'standard', label: 'Détaillé', desc: 'Prochain + Suivant' },
                    { id: 'ticker', label: 'Bandeau Ticker', desc: 'Ligne défilante' },
                  ].map((density) => (
                    <button
                      key={density.id}
                      type="button"
                      onClick={() => setConfig({ ...config, density: density.id as WidgetDensity })}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        config.density === density.id
                          ? 'bg-dark-800 border-indigo-400 text-indigo-300 ring-2 ring-indigo-500/50'
                          : 'bg-dark-850 border-dark-750 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{density.label}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{density.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. GESTION DE L'ORDRE DES TRANSPORTS (PRIORITÉ TOTALE) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    4. Ordre des Transports (Flèches Haut / Bas)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddLineOpen(true)}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {config.lines.map((line, idx) => {
                    const style = getLineStyle(line.lineKey);

                    return (
                      <div
                        key={line.id}
                        className="p-2.5 rounded-xl bg-dark-850 border border-dark-750 flex items-center justify-between gap-2"
                      >
                        {/* Numéro d'ordre & Badge ligne */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 text-center font-mono font-bold text-xs text-slate-400">
                            #{idx + 1}
                          </span>
                          <span
                            style={{ backgroundColor: style.bg, color: style.text }}
                            className="min-w-[28px] h-6 px-1.5 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0"
                          >
                            {style.label}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">
                              {line.stopName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              ➜ {line.direction}
                            </div>
                          </div>
                        </div>

                        {/* Boutons de réordonnancement ⬆️ / ⬇️ et Suppression */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveLine(idx, 'up')}
                            className="w-7 h-7 rounded-lg bg-dark-800 hover:bg-dark-750 disabled:opacity-30 disabled:hover:bg-dark-800 text-slate-200 flex items-center justify-center cursor-pointer transition active:scale-90"
                            title="Monter en priorité"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === config.lines.length - 1}
                            onClick={() => moveLine(idx, 'down')}
                            className="w-7 h-7 rounded-lg bg-dark-800 hover:bg-dark-750 disabled:opacity-30 disabled:hover:bg-dark-800 text-slate-200 flex items-center justify-center cursor-pointer transition active:scale-90"
                            title="Descendre en priorité"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="w-7 h-7 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 flex items-center justify-center cursor-pointer transition active:scale-90 ml-1"
                            title="Supprimer du widget"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer Builder */}
            <div className="px-5 py-3 border-t border-dark-800 bg-dark-950/90 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {config.lines.length} transport(s) configuré(s)
              </span>
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition active:scale-95 cursor-pointer"
              >
                Valider & Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODALE D'AJOUT DE LIGNE                                */}
      {/* ========================================================= */}
      {isAddLineOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsAddLineOpen(false)}
          />

          <div className="relative w-full max-w-sm bg-dark-900 border border-dark-750 rounded-2xl p-4 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-dark-800">
              <h4 className="font-bold text-white text-sm">Ajouter une ligne au widget</h4>
              <button 
                type="button"
                onClick={() => setIsAddLineOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sélecteur de Ligne */}
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Ligne RATP / IDFM
              </label>
              <select
                value={selectedAddLineKey}
                onChange={(e) => {
                  setSelectedAddLineKey(e.target.value);
                  setSelectedAddDirectionIndex(0);
                  const firstStop = IDF_LINES_DIRECTORY[normalizeLineKey(e.target.value)]?.stops[0];
                  if (firstStop) setSelectedAddStopId(firstStop.id);
                }}
                className="w-full p-2 bg-dark-950 border border-dark-800 rounded-xl text-white text-xs font-semibold"
              >
                {Object.values(IDF_LINES_DIRECTORY).map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.type.toUpperCase()} {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélecteur de Direction */}
            {IDF_LINES_DIRECTORY[normalizeLineKey(selectedAddLineKey)] && (
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Direction / Terminus
                </label>
                <select
                  value={selectedAddDirectionIndex}
                  onChange={(e) => setSelectedAddDirectionIndex(Number(e.target.value))}
                  className="w-full p-2 bg-dark-950 border border-dark-800 rounded-xl text-white text-xs"
                >
                  {IDF_LINES_DIRECTORY[normalizeLineKey(selectedAddLineKey)].directions.map((d, i) => (
                    <option key={d.code} value={i}>
                      ➜ {d.destination}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sélecteur d'Arrêt */}
            {IDF_LINES_DIRECTORY[normalizeLineKey(selectedAddLineKey)] && (
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Arrêt ou Station
                </label>
                <select
                  value={selectedAddStopId}
                  onChange={(e) => setSelectedAddStopId(e.target.value)}
                  className="w-full p-2 bg-dark-950 border border-dark-800 rounded-xl text-white text-xs"
                >
                  {IDF_LINES_DIRECTORY[normalizeLineKey(selectedAddLineKey)].stops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmAddLine}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-md"
            >
              Ajouter au Widget
            </button>
          </div>
        </div>
      )}
    </>
  );
};
