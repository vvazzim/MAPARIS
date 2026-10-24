import React from 'react';
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  Train, 
  PlusCircle, 
  Compass, 
  Loader2,
  Menu,
  X
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { PARIS_TRANSPORT_HUBS } from '../data/ratpHubs';

export const Header: React.FC = () => {
  const { 
    connectionStatus, 
    incidents, 
    toggleTransportWidget, 
    showTransportWidget,
    openReportModal,
    openSafeRouteModal,
    isMobileMenuOpen,
    toggleMobileMenu,
    setMobileActiveTab,
    language,
    setLanguage,
    t,
  } = useIncidentStore();

  const dangerCount = incidents.filter((i) => i.severity === 'danger').length;
  const warningCount = incidents.filter((i) => i.severity === 'warning').length;
  const safeCount = incidents.filter((i) => i.severity === 'safe').length;

  const disruptedStations = PARIS_TRANSPORT_HUBS.filter((s) => s.status !== 'normal').length;

  return (
    <header className="h-16 border-b border-dark-800 bg-dark-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 select-none">
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            {t.header.title}
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800">
              {t.header.liveOsint}
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {t.header.subtitle}
          </p>
        </div>
      </div>

      {/* Info Status Badges (Non-cliquables - Indicateurs passifs) */}
      <div className="hidden lg:flex items-center space-x-2.5 text-xs font-mono cursor-default select-none">
        <div 
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400"
          title="Nombre d'alertes rouges actives"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>{t.header.dangerCount.replace('{count}', String(dangerCount))}</span>
        </div>
        <div 
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-900/40 text-amber-400"
          title="Nombre de zones de tension en cours"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>{t.header.warningCount.replace('{count}', String(warningCount))}</span>
        </div>
        <div 
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-400"
          title="Nombre de zones calmes confirmées"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{t.header.safeCount.replace('{count}', String(safeCount))}</span>
        </div>
      </div>

      {/* Boutons d'Action (Clairement cliquables avec effet hover & active) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Safe Routing CTA */}
        <button
          onClick={() => {
            setMobileActiveTab('map');
            if (showTransportWidget) toggleTransportWidget();
            openSafeRouteModal();
          }}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 hover:bg-emerald-900/70 text-emerald-300 text-xs font-semibold shadow-md transition active:scale-95 cursor-pointer"
          title="Calculer un itinéraire piéton sécurisé"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.header.safeRoute}</span>
        </button>

        {/* Quick Report CTA (Bouton Principal en évidence) */}
        <button
          onClick={() => {
            setMobileActiveTab('map');
            if (showTransportWidget) toggleTransportWidget();
            openReportModal();
          }}
          className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/80 border border-rose-400/30 transition active:scale-95 cursor-pointer"
          title="Diffuser une alerte citoyenne"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.header.report}</span>
        </button>

        {/* RATP Transports quick toggle */}
        <button
          onClick={toggleTransportWidget}
          className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer active:scale-95 ${
            showTransportWidget
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40'
          }`}
          title="Afficher les correspondances et métros RATP"
        >
          <Train className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t.header.ratpHubs}</span>
          {disruptedStations > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-600 text-white font-bold">
              {disruptedStations}
            </span>
          )}
        </button>

        {/* Sélecteur de Langue Explicite (Choix intuitif FR / EN) */}
        <div className="flex items-center bg-dark-950 p-0.5 rounded-xl border border-dark-750">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              language === 'fr'
                ? 'bg-pulse-accent text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Passer le site en Français"
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              language === 'en'
                ? 'bg-pulse-accent text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch website to English"
          >
            EN
          </button>
        </div>

        {/* Socket Status Indicator (Indicateur passif) */}
        <div
          className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-mono select-none cursor-default ${
            connectionStatus === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : connectionStatus === 'reconnecting'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="hidden sm:inline">{t.header.liveSync}</span>
            </>
          ) : connectionStatus === 'reconnecting' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="hidden sm:inline">{t.header.serverWaking}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{t.header.offline}</span>
            </>
          )}
        </div>

        {/* Mobile Sandwich Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-dark-800 text-slate-300 hover:text-white hover:bg-dark-700 transition active:scale-95 cursor-pointer"
          title="Menu"
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
