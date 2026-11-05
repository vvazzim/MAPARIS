import React from 'react';
import { 
  Map, 
  Train, 
  Plus, 
  AlertTriangle, 
  Compass 
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';

/**
 * Mobile Bottom Navigation Dock (Native App Experience)
 * Visible uniquement sur mobiles (< lg).
 * Offre une ergonomie 1-tap inspirée des meilleures applications de mobilité :
 * - 🗺️ Carte
 * - 🚆 Transports IDF (Quotidien M13/Tram/Bus & Trajets ponctuels)
 * - ➕ Signaler (FAB central surélevé & contrasté)
 * - 🚨 Alertes (Flux en direct avec badge d'incidents)
 * - 🧭 Itinéraire Piéton Sûr
 */
export const MobileBottomNav: React.FC = () => {
  const {
    mobileActiveTab,
    setMobileActiveTab,
    openReportModal,
    openMetroRouteModal,
    openSafeRouteModal,
    isReportModalOpen,
    isSafeRouteModalOpen,
    isMetroRouteModalOpen,
    isMobileMenuOpen,
    incidents,
  } = useIncidentStore();

  // Masquer lorsque des modales plein écran sont ouvertes pour laisser 100% de la surface
  if (isReportModalOpen || isSafeRouteModalOpen || isMetroRouteModalOpen || isMobileMenuOpen) {
    return null;
  }

  const dangerOrWarningCount = incidents.filter(
    (i) => i.severity === 'danger' || i.severity === 'warning'
  ).length;

  return (
    <nav 
      aria-label="Navigation principale mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 select-none bg-dark-950/92 backdrop-blur-2xl border-t border-dark-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.7)]"
      style={{
        paddingBottom: 'max(0.6rem, calc(0.35rem + env(safe-area-inset-bottom, 16px)))',
        paddingTop: '0.45rem',
      }}
    >
      <div className="max-w-md mx-auto px-3 flex items-center justify-around">
        {/* 1. Carte */}
        <button
          type="button"
          onClick={() => setMobileActiveTab('map')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer min-w-[56px] ${
            mobileActiveTab === 'map'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Voir la carte interactive"
        >
          <div className="relative">
            <Map className={`w-5 h-5 ${mobileActiveTab === 'map' ? 'stroke-[2.4] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'stroke-[1.8]'}`} />
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-sans">Carte</span>
        </button>

        {/* 2. Transports IDF (Quotidien & Horaires) */}
        <button
          type="button"
          onClick={() => {
            setMobileActiveTab('map');
            openMetroRouteModal();
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-indigo-300 transition-all duration-150 active:scale-95 cursor-pointer min-w-[56px]"
          aria-label="Transports IDF & Horaires en temps réel"
        >
          <div className="relative">
            <Train className="w-5 h-5 stroke-[1.9] text-indigo-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-dark-950" />
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-sans text-indigo-200 font-medium">Transports</span>
        </button>

        {/* 3. Bouton Central "Signaler" (FAB Tactile) */}
        <div className="relative -top-2 flex items-center justify-center px-1">
          <button
            type="button"
            onClick={openReportModal}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-rose-950/80 border-2 border-dark-900 transition-all duration-150 active:scale-90 hover:scale-105 cursor-pointer"
            aria-label="Signaler un incident en direct"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* 4. Alertes (Incident Feed) */}
        <button
          type="button"
          onClick={() => setMobileActiveTab('feed')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer min-w-[56px] ${
            mobileActiveTab === 'feed'
              ? 'text-rose-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Voir les alertes et signalements"
        >
          <div className="relative">
            <AlertTriangle className={`w-5 h-5 ${mobileActiveTab === 'feed' ? 'stroke-[2.4] text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'stroke-[1.8]'}`} />
            {dangerOrWarningCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold leading-tight border border-dark-950 tabular-nums">
                {dangerOrWarningCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-sans">Alertes</span>
        </button>

        {/* 5. Itinéraire Piéton Sûr */}
        <button
          type="button"
          onClick={() => {
            setMobileActiveTab('map');
            openSafeRouteModal();
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-emerald-300 transition-all duration-150 active:scale-95 cursor-pointer min-w-[56px]"
          aria-label="Calculer un itinéraire sécurisé"
        >
          <div className="relative">
            <Compass className="w-5 h-5 stroke-[1.9] text-emerald-400" />
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-sans text-emerald-200 font-medium">Itinéraire</span>
        </button>
      </div>
    </nav>
  );
};
