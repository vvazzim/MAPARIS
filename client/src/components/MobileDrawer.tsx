import React from 'react';
import { 
  X, 
  ShieldAlert, 
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
  ChevronRight
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { PARIS_TRANSPORT_HUBS } from '../data/ratpHubs';

export const MobileDrawer: React.FC = () => {
  const {
    isMobileMenuOpen,
    closeMobileMenu,
    incidents,
    connectionStatus,
    openReportModal,
    openSafeRouteModal,
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

  if (!isMobileMenuOpen) return null;

  const dangerCount = incidents.filter((i) => i.severity === 'danger').length;
  const warningCount = incidents.filter((i) => i.severity === 'warning').length;
  const safeCount = incidents.filter((i) => i.severity === 'safe').length;
  const disruptedStations = PARIS_TRANSPORT_HUBS.filter((s) => s.status !== 'normal').length;

  return (
    <div className="fixed inset-0 z-[1000] lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={closeMobileMenu}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-dark-900 border-l border-dark-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
          
          {/* Header */}
          <div className="p-5 border-b border-dark-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">MaParis</h3>
                <p className="text-[11px] text-slate-400 font-mono">{t.mobile.menuTitle}</p>
              </div>
            </div>

            <button 
              onClick={closeMobileMenu}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition active:scale-95 cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 flex-1">
            
            {/* Language Switcher Bar (Explicit choice FR / EN) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-850 border border-dark-800">
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

            {/* Live Metrics Cards (Passive Telemetry - Non cliquables) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  {t.mobile.liveSituation}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {language === 'fr' ? 'Lecture seule' : 'Read-only'}
                </span>
              </div>
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

            {/* Quick Actions (Clearly Cliquables with Chevrons and Hover/Active States) */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5 block">
                {t.mobile.mainActions}
              </span>
              <div className="space-y-2.5">
                
                {/* Signaler */}
                <button
                  onClick={openReportModal}
                  className="w-full p-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm flex items-center justify-between shadow-lg shadow-rose-950/50 transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-5 h-5 text-white" />
                    <div className="text-left">
                      <div className="font-bold">{t.mobile.reportAction}</div>
                      <div className="text-[10px] text-rose-100 font-normal">{t.mobile.reportDesc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-200" />
                </button>

                {/* Itinéraire Safe */}
                <button
                  onClick={openSafeRouteModal}
                  className="w-full p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-200 font-semibold text-sm flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t.mobile.safeRouteAction}</div>
                      <div className="text-[10px] text-emerald-300/80 font-normal">{t.mobile.safeRouteDesc}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </button>

                {/* Transports RATP */}
                <button
                  onClick={() => {
                    closeMobileMenu();
                    toggleTransportWidget();
                  }}
                  className="w-full p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 hover:bg-indigo-900/60 text-indigo-200 font-semibold text-sm flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Train className="w-5 h-5 text-indigo-400" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t.mobile.ratpAction}</div>
                      <div className="text-[10px] text-indigo-300/80 font-normal">{t.mobile.ratpDesc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {disruptedStations > 0 ? (
                      <span className="text-xs bg-rose-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">
                        {disruptedStations}
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-900 text-emerald-300 font-mono px-2 py-0.5 rounded">
                        {t.transport.normal}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </div>
                </button>

                {/* Afficher Flux complet */}
                <button
                  onClick={() => {
                    setMobileActiveTab('feed');
                    closeMobileMenu();
                  }}
                  className="w-full p-3.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-700 text-slate-200 font-semibold text-sm flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <List className="w-5 h-5 text-pulse-accent" />
                    <div className="text-left">
                      <div className="font-bold text-white">{t.mobile.viewAlertsAction}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{t.mobile.viewAlertsDesc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-dark-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {incidents.length}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* Cartographie Controls */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5 block">
                {t.mobile.mapControls}
              </span>
              <div className="space-y-2">
                <button
                  onClick={toggleDangerRadius}
                  className={`w-full p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer active:scale-[0.99] ${
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

                <button
                  onClick={toggleTransports}
                  className={`w-full p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition cursor-pointer active:scale-[0.99] ${
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

                <button
                  onClick={() => {
                    closeMobileMenu();
                    flyTo(48.8566, 2.3522, 13);
                  }}
                  className="w-full p-3 rounded-xl bg-dark-800/80 border border-dark-700 hover:bg-dark-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
                >
                  <Navigation className="w-4 h-4 text-pulse-accent" />
                  <span>{t.mobile.recenterParis}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Anonymat & Statut */}
          <div className="p-4 border-t border-dark-800 bg-dark-950/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5 select-none">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.mobile.anonymous}</span>
              </span>

              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full select-none cursor-default ${
                connectionStatus === 'connected' 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                  : connectionStatus === 'reconnecting'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </>
                ) : connectionStatus === 'reconnecting' ? (
                  <>
                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                    <span>{language === 'fr' ? 'RÉVEIL' : 'WAKING'}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    <span>OFFLINE</span>
                  </>
                )}
              </div>
            </div>

            {/* Author Credit */}
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
