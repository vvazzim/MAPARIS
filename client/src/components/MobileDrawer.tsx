import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  PlusCircle, 
  Compass, 
  Train, 
  Radio, 
  Navigation, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Wifi,
  WifiOff,
  Loader2,
  Lock,
  List
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
  } = useIncidentStore();

  const [simulating, setSimulating] = useState(false);

  if (!isMobileMenuOpen) return null;

  const dangerCount = incidents.filter((i) => i.severity === 'danger').length;
  const warningCount = incidents.filter((i) => i.severity === 'warning').length;
  const safeCount = incidents.filter((i) => i.severity === 'safe').length;
  const disruptedStations = PARIS_TRANSPORT_HUBS.filter((s) => s.status !== 'normal').length;

  const handleSimulateOSINT = async () => {
    try {
      setSimulating(true);
      await fetch('/api/osint/simulate', { method: 'POST' });
    } catch (err) {
      console.error('Erreur simulation OSINT:', err);
    } finally {
      setTimeout(() => setSimulating(false), 800);
    }
  };

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
                <h3 className="font-bold text-white text-base">Paris Security Pulse</h3>
                <p className="text-[11px] text-slate-400 font-mono">Menu & Navigation Rapide</p>
              </div>
            </div>

            <button 
              onClick={closeMobileMenu}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition"
              title="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 flex-1">
            
            {/* Live Metrics Cards */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5 block">
                Situation en direct à Paris
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-center">
                  <div className="flex items-center justify-center text-red-500 mb-1">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold font-mono text-red-400 block">{dangerCount}</span>
                  <span className="text-[10px] text-red-300 font-medium">Dangers</span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
                  <div className="flex items-center justify-center text-amber-500 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold font-mono text-amber-400 block">{warningCount}</span>
                  <span className="text-[10px] text-amber-300 font-medium">Tensions</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                  <div className="flex items-center justify-center text-emerald-500 mb-1">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold font-mono text-emerald-400 block">{safeCount}</span>
                  <span className="text-[10px] text-emerald-300 font-medium">Zones Sûres</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5 block">
                Actions Principales
              </span>
              <div className="space-y-2.5">
                
                {/* Signaler */}
                <button
                  onClick={openReportModal}
                  className="w-full p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm flex items-center justify-between shadow-lg shadow-rose-950/50 transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-5 h-5 text-white" />
                    <div className="text-left">
                      <div>Signaler un incident</div>
                      <div className="text-[10px] text-rose-200 font-normal">Crowdsourcing citoyen anonyme</div>
                    </div>
                  </div>
                  <span className="text-xs bg-rose-700 px-2 py-0.5 rounded font-mono">POST</span>
                </button>

                {/* Itinéraire Safe */}
                <button
                  onClick={openSafeRouteModal}
                  className="w-full p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-200 font-semibold text-sm flex items-center justify-between transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <div className="text-left">
                      <div>Itinéraire Safe Piéton</div>
                      <div className="text-[10px] text-emerald-300/80 font-normal">Contournement automatique des zones rouges</div>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded font-mono">MAP</span>
                </button>

                {/* Transports RATP */}
                <button
                  onClick={() => {
                    closeMobileMenu();
                    toggleTransportWidget();
                  }}
                  className="w-full p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/40 hover:bg-indigo-900/60 text-indigo-200 font-semibold text-sm flex items-center justify-between transition active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Train className="w-5 h-5 text-indigo-400" />
                    <div className="text-left">
                      <div>Statut Hubs RATP</div>
                      <div className="text-[10px] text-indigo-300/80 font-normal">Châtelet, Bastille, République, etc.</div>
                    </div>
                  </div>
                  {disruptedStations > 0 ? (
                    <span className="text-xs bg-rose-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">
                      {disruptedStations} perturbées
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-900 text-emerald-300 font-mono px-2 py-0.5 rounded">
                      Normal
                    </span>
                  )}
                </button>

                {/* Afficher Flux complet */}
                <button
                  onClick={() => {
                    setMobileActiveTab('feed');
                    closeMobileMenu();
                  }}
                  className="w-full p-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 font-semibold text-sm flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <List className="w-5 h-5 text-pulse-accent" />
                    <div className="text-left">
                      <div>Consulter le Flux d'Alertes</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tous les signalements horodatés</div>
                    </div>
                  </div>
                  <span className="text-xs bg-dark-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {incidents.length}
                  </span>
                </button>

                {/* Simuler OSINT */}
                <button
                  onClick={handleSimulateOSINT}
                  disabled={simulating}
                  className="w-full p-3 rounded-xl bg-purple-950/60 border border-purple-500/30 hover:bg-purple-900/50 text-purple-200 font-semibold text-sm flex items-center justify-between transition disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    {simulating ? (
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    ) : (
                      <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
                    )}
                    <div className="text-left">
                      <div>Simuler Alerte OSINT</div>
                      <div className="text-[10px] text-purple-300/80 font-normal">Injecter un flux Telegram / Twitter</div>
                    </div>
                  </div>
                  <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded font-mono">BOT</span>
                </button>
              </div>
            </div>

            {/* Cartographie Controls */}
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5 block">
                Affichage Cartographique
              </span>
              <div className="space-y-2">
                <button
                  onClick={toggleDangerRadius}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                    showDangerRadius 
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' 
                      : 'bg-dark-800/80 border-dark-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Périmètres de Sécurité (Cercles)</span>
                  </div>
                  <span className="font-mono">{showDangerRadius ? 'ACTIVÉ' : 'DÉSACTIVÉ'}</span>
                </button>

                <button
                  onClick={toggleTransports}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                    showTransports 
                      ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' 
                      : 'bg-dark-800/80 border-dark-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4" />
                    <span>Marqueurs Stations RATP</span>
                  </div>
                  <span className="font-mono">{showTransports ? 'ACTIVÉ' : 'DÉSACTIVÉ'}</span>
                </button>

                <button
                  onClick={() => {
                    closeMobileMenu();
                    flyTo(48.8566, 2.3522, 13);
                  }}
                  className="w-full p-2.5 rounded-xl bg-dark-800/80 border border-dark-700 hover:bg-dark-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <Navigation className="w-4 h-4 text-pulse-accent" />
                  <span>Recentrer la Carte sur Paris</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Anonymat & Statut */}
          <div className="p-4 border-t border-dark-800 bg-dark-950/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Anonyme · Zéro-Log</span>
              </span>

              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
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
                    <span>RÉVEIL</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    <span>OFFLINE</span>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
