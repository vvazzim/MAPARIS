import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Compass, 
  Train, 
  Navigation, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
  Lock,
  List,
  Globe,
  ChevronRight,
  ChevronDown,
  Shield
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { PARIS_TRANSPORT_HUBS } from '../data/ratpHubs';
import { ParisLogo } from './ParisLogo';

export const MobileDrawer: React.FC = () => {
  const {
    isMobileMenuOpen,
    closeMobileMenu,
    incidents,
    connectionStatus,
    openReportModal,
    openSafeRouteModal,
    showTransportWidget,
    toggleTransportWidget,
    toggleDangerRadius,
    toggleTransports,
    showDangerRadius,
    showTransports,
    flyTo,
    setMobileActiveTab,
    language,
    setLanguage,
    t,
  } = useIncidentStore();

  const [isLegendOpen, setIsLegendOpen] = useState(false);

  if (!isMobileMenuOpen) return null;

  const dangerCount = incidents.filter((i) => i.severity === 'danger').length;
  const warningCount = incidents.filter((i) => i.severity === 'warning').length;
  const safeCount = incidents.filter((i) => i.severity === 'safe').length;
  const disruptedStations = PARIS_TRANSPORT_HUBS.filter((s) => s.status !== 'normal').length;

  return (
    <div className="fixed inset-0 z-[1000] animate-in fade-in duration-200">
      {/* Backdrop overlay assombri */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Slide-over panel (Mobile & Desktop) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
        <div className="w-screen max-w-sm sm:max-w-md bg-dark-900 border-l border-dark-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
          
          {/* Header du Menu Unique */}
          <div className="p-4 sm:p-5 border-b border-dark-800 flex items-center justify-between bg-dark-950/80 shrink-0">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <ParisLogo className="w-8 h-8" showAlertDot={dangerCount > 0 || warningCount > 0} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">MA<span className="text-rose-500">!</span>Paris</h3>
                  {/* Indicateur Live OSINT en VERT */}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live OSINT</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">{t.mobile.menuTitle}</p>
              </div>
            </div>

            <button 
              onClick={closeMobileMenu}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition active:scale-95 cursor-pointer"
              title="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps du Menu */}
          <div className="p-4 sm:p-5 space-y-5 flex-1">
            
            {/* 1. Sélecteur de Langue Explicite FR / EN */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-850 border border-dark-800">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <Globe className="w-4 h-4 text-pulse-accent" />
                <span>{language === 'fr' ? 'Langue / Language' : 'Language / Langue'}</span>
              </div>
              <div className="flex items-center bg-dark-950 p-1 rounded-lg border border-dark-750">
                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                    language === 'fr'
                      ? 'bg-pulse-accent text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🇫🇷 FR
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                    language === 'en'
                      ? 'bg-pulse-accent text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>

            {/* 2. Situation en direct (Indicateurs passifs) - Sans mention "Lecture seule" */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2 block">
                {t.mobile.liveSituation}
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-center select-none cursor-default">
                  <div className="flex items-center justify-center text-red-500 mb-1">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold font-mono text-red-400 block">{dangerCount}</span>
                  <span className="text-[10px] text-red-300 font-medium">{t.mobile.dangers}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center select-none cursor-default">
                  <div className="flex items-center justify-center text-amber-500 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold font-mono text-amber-400 block">{warningCount}</span>
                  <span className="text-[10px] text-amber-300 font-medium">{t.mobile.warnings}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center select-none cursor-default">
                  <div className="flex items-center justify-center text-emerald-500 mb-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold font-mono text-emerald-400 block">{safeCount}</span>
                  <span className="text-[10px] text-emerald-300 font-medium">{t.mobile.safeZones}</span>
                </div>
              </div>
            </div>

            {/* 3. Actions Principales */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2 block">
                {t.mobile.mainActions}
              </span>
              <div className="space-y-2">
                {/* Itinéraire Sûr */}
                <button
                  onClick={() => {
                    closeMobileMenu();
                    setMobileActiveTab('map');
                    if (showTransportWidget) toggleTransportWidget();
                    openSafeRouteModal();
                  }}
                  className="w-full p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-200 font-semibold text-xs flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t.mobile.safeRouteAction}</div>
                      <div className="text-[10px] text-emerald-300/80 font-normal">{t.mobile.safeRouteDesc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>

                {/* Signaler un incident */}
                <button
                  onClick={() => {
                    closeMobileMenu();
                    setMobileActiveTab('map');
                    if (showTransportWidget) toggleTransportWidget();
                    openReportModal();
                  }}
                  className="w-full p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-between shadow-lg shadow-rose-950/50 transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-white" />
                    <div className="text-left">
                      <div className="font-bold">{t.mobile.reportAction}</div>
                      <div className="text-[10px] text-rose-100 font-normal">{t.mobile.reportDesc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-200" />
                </button>

                {/* Statut Transports RATP */}
                <button
                  onClick={() => {
                    closeMobileMenu();
                    setMobileActiveTab('map');
                    toggleTransportWidget();
                  }}
                  className="w-full p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/40 hover:bg-indigo-900/60 text-indigo-200 font-semibold text-xs flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Train className="w-4 h-4 text-indigo-400" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t.mobile.ratpAction}</div>
                      <div className="text-[10px] text-indigo-300/80 font-normal">{t.mobile.ratpDesc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {disruptedStations > 0 ? (
                      <span className="text-[10px] bg-rose-600 text-white font-mono font-bold px-1.5 py-0.5 rounded-full">
                        {disruptedStations}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-900 text-emerald-300 font-mono px-1.5 py-0.5 rounded">
                        {t.transport.normal}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </div>
                </button>

                {/* Consulter le Flux Complet */}
                <button
                  onClick={() => {
                    setMobileActiveTab('feed');
                    closeMobileMenu();
                  }}
                  className="w-full p-3 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 font-semibold text-xs flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <List className="w-4 h-4 text-pulse-accent" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t.mobile.viewAlertsAction}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{t.mobile.viewAlertsDesc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-dark-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {incidents.length}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* 4. Outils de Carte (Affichage cartographique intégré) */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2 block">
                {t.mobile.mapControls}
              </span>
              <div className="space-y-2">
                {/* Périmètres de sécurité */}
                <button
                  onClick={toggleDangerRadius}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer active:scale-[0.99] ${
                    showDangerRadius 
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' 
                      : 'bg-dark-800/80 border-dark-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>{t.mobile.dangerCircles}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${showDangerRadius ? 'bg-rose-900/60 text-rose-300' : 'bg-dark-700 text-slate-400'}`}>
                    {showDangerRadius ? t.mobile.enabled : t.mobile.disabled}
                  </span>
                </button>

                {/* Marqueurs RATP */}
                <button
                  onClick={toggleTransports}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer active:scale-[0.99] ${
                    showTransports 
                      ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' 
                      : 'bg-dark-800/80 border-dark-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4" />
                    <span>{t.mobile.ratpMarkers}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${showTransports ? 'bg-indigo-900/60 text-indigo-300' : 'bg-dark-700 text-slate-400'}`}>
                    {showTransports ? t.mobile.enabled : t.mobile.disabled}
                  </span>
                </button>

                {/* Recentrer Paris */}
                <button
                  onClick={() => {
                    closeMobileMenu();
                    setMobileActiveTab('map');
                    flyTo(48.8566, 2.3522, 13);
                  }}
                  className="w-full p-2.5 rounded-xl bg-dark-800/80 border border-dark-700 hover:bg-dark-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <Navigation className="w-4 h-4 text-pulse-accent" />
                  <span>{t.mobile.recenterParis}</span>
                </button>
              </div>
            </div>

            {/* 5. Légende Rétractable / Expansible */}
            <div className="border border-dark-800 rounded-xl overflow-hidden bg-dark-850/60">
              <button
                type="button"
                onClick={() => setIsLegendOpen(!isLegendOpen)}
                className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-dark-800 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-pulse-accent" />
                  <span>{language === 'fr' ? 'Légende de la Carte' : 'Map Legend'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isLegendOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLegendOpen && (
                <div className="p-3 pt-0 space-y-2 text-xs border-t border-dark-800/60 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/20 border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50" />
                      <span className="text-red-300 font-medium">{language === 'fr' ? 'Danger Critique' : 'High Danger'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{language === 'fr' ? 'Rayon 400m' : '400m radius'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/20 border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                      <span className="text-amber-300 font-medium">{language === 'fr' ? 'Tension / Vigilance' : 'Tension / Warning'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{language === 'fr' ? 'Rayon 250m' : '250m radius'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      <span className="text-emerald-300 font-medium">{language === 'fr' ? 'Zone Sûre' : 'Safe Area'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{language === 'fr' ? 'Fluide & Sécurisée' : 'Clear & Secure'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                      <span className="text-indigo-300 font-medium">Hubs RATP</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{language === 'fr' ? 'Gares & Métros' : 'Stations'}</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer : Statut Wi-Fi / Connexion (qui disparaît dès la rétraction du menu) */}
          <div className="p-4 border-t border-dark-800 bg-dark-950/80 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 select-none">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.mobile.anonymous}</span>
              </span>

              {/* Indicateur Wi-Fi / Statut Réseau intégré au panneau */}
              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full select-none cursor-default ${
                connectionStatus === 'connected' 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                  : connectionStatus === 'reconnecting'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>{language === 'fr' ? 'LIVE ACTIF' : 'LIVE'}</span>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>{language === 'fr' ? 'RECONNEXION' : 'RECONNECTING'}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>{language === 'fr' ? 'HORS LIGNE' : 'OFFLINE'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Crédit Open Source */}
            <div className="pt-2 border-t border-dark-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono">{t.mobile.openSourceProject}</span>
              <a 
                href="https://github.com/vvazzim/MAPARIS" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-white transition flex items-center gap-1 text-slate-300 font-mono"
              >
                <span>{t.mobile.openSourceCreatedBy}</span>
                <span className="font-bold text-pulse-accent">@vvazzim</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
