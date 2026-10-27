import React from 'react';
import { Plus } from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';

/**
 * Bouton Flottant "Signaler" Minimaliste (Mobile FAB Pill).
 * Design ultra-épuré, semi-transparent avec flou d'arrière-plan (glassmorphism).
 * Flotte discrètement en bas au centre sans obstruer la carte ni les attributions Leaflet.
 */
export const MobileBottomNav: React.FC = () => {
  const {
    openReportModal,
    mobileActiveTab,
    isReportModalOpen,
    isSafeRouteModalOpen,
    isMobileMenuOpen,
    showTransportWidget,
  } = useIncidentStore();

  // Masquer lorsque l'utilisateur consulte le flux ou qu'une modale/tiroir est ouvert
  if (
    mobileActiveTab === 'feed' || 
    isReportModalOpen || 
    isSafeRouteModalOpen || 
    isMobileMenuOpen || 
    showTransportWidget
  ) {
    return null;
  }

  return (
    <div 
      className="lg:hidden fixed left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none"
      style={{
        bottom: 'max(1.75rem, calc(1rem + env(safe-area-inset-bottom, 16px)))',
      }}
    >
      <button
        type="button"
        onClick={openReportModal}
        className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-dark-900/80 hover:bg-dark-850/90 active:bg-dark-800 backdrop-blur-xl border border-dark-700/80 hover:border-rose-500/50 text-slate-200 text-xs font-semibold shadow-xl shadow-black/50 transition-all duration-150 active:scale-95 cursor-pointer"
        aria-label="Signaler un incident"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </span>
        <span className="tracking-wide text-[11px] font-medium text-slate-100">Signaler</span>
      </button>
    </div>
  );
};
