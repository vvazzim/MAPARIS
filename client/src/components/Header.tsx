import React from 'react';
import { 
  ShieldAlert, 
  Radio, 
  AlertTriangle, 
  CheckCircle, 
  Wifi, 
  WifiOff, 
  Train, 
  PlusCircle, 
  Compass, 
  Loader2,
  Menu,
  X,
  Github
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
  } = useIncidentStore();

  const dangerCount = incidents.filter((i) => i.severity === 'danger').length;
  const warningCount = incidents.filter((i) => i.severity === 'warning').length;
  const safeCount = incidents.filter((i) => i.severity === 'safe').length;

  const disruptedStations = PARIS_TRANSPORT_HUBS.filter((s) => s.status !== 'normal').length;

  return (
    <header className="h-16 border-b border-dark-800 bg-dark-900/95 backdrop-blur-md px-6 flex items-center justify-between z-20 select-none">
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Paris Security Pulse
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800">
              Live OSINT
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Monitoring temps réel de la sécurité & manifestations à Paris
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="hidden lg:flex items-center space-x-3 text-xs font-medium">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span>{dangerCount} Alertes Rouges</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Radio className="w-3.5 h-3.5 text-amber-500" />
          <span>{warningCount} Tensions</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>{safeCount} Zones Claires</span>
        </div>
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center space-x-3">
        {/* Simulate OSINT Bot CTA */}
        <button
          onClick={async () => {
            try {
              await fetch('/api/osint/simulate', { method: 'POST' });
            } catch (err) {
              console.error('Erreur simulation OSINT:', err);
            }
          }}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/60 text-xs font-semibold shadow-md transition active:scale-95"
          title="Simuler l'ingestion d'un flux Telegram/Twitter OSINT en temps réel"
        >
          <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Simuler OSINT</span>
        </button>

        {/* Safe Routing CTA */}
        <button
          onClick={openSafeRouteModal}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold shadow-md transition active:scale-95"
          title="Calculer un itinéraire sécurisé contournant les manifestations"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Itinéraire Safe</span>
        </button>

        {/* Quick Report CTA */}
        <button
          onClick={openReportModal}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-950/60 transition active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Signaler</span>
        </button>

        {/* RATP Transports quick toggle */}
        <button
          onClick={toggleTransportWidget}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
            showTransportWidget
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
          }`}
          title="Ouvrir le panneau d'état des métros RATP"
        >
          <Train className="w-3.5 h-3.5 text-indigo-400" />
          <span>Hubs RATP</span>
          {disruptedStations > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-600 text-white font-bold">
              {disruptedStations}
            </span>
          )}
        </button>

        {/* Socket Status Indicator avec gestion reconnexion Free Tier Render */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-colors ${
            connectionStatus === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : connectionStatus === 'reconnecting'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
          title={
            connectionStatus === 'connected'
              ? 'Connecté au serveur WebSocket'
              : connectionStatus === 'reconnecting'
              ? 'Reconnexion automatique en cours (réveil du serveur Render)...'
              : 'Déconnecté'
          }
        >
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="hidden sm:inline">LIVE SYNC</span>
            </>
          ) : connectionStatus === 'reconnecting' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="hidden sm:inline">RÉVEIL SERVEUR...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">HORS LIGNE</span>
            </>
          )}
        </div>

        {/* GitHub Repository & Creator Link */}
        <a
          href="https://github.com/vvazzim/MAPARIS"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white border border-dark-700 text-xs font-mono transition"
          title="Code source ouvert créé par VVAZZIM"
        >
          <Github className="w-3.5 h-3.5" />
          <span>VVAZZIM</span>
        </a>

        {/* Mobile Sandwich Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-dark-800 text-slate-300 hover:text-white hover:bg-dark-700 transition"
          title="Ouvrir le menu responsive"
          aria-label="Menu principal"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
