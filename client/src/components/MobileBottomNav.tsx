import React from 'react';
import { Plus } from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';

/**
 * Mobile Action Button ("Bouton Signaler seul au centre")
 * 
 * Conforme à la demande utilisateur :
 * - La barre encombrante à 5 boutons disparaît totalement de l'écran mobile.
 * - SEUL le bouton central "Signaler" subsiste, flottant au centre bas.
 * - Respecte strictement la palette sombre (dark-950 / dark-900 / border-dark-800).
 * - Dégage 100% de la surface cartographique et évite toute occlusion.
 */
export const MobileBottomNav: React.FC = () => {
  const {
    openReportModal,
    isReportModalOpen,
    isSafeRouteModalOpen,
    isMetroRouteModalOpen,
    isMobileMenuOpen,
  } = useIncidentStore();

  // Masquer lorsque des modales plein écran ou le menu sont ouverts
  if (isReportModalOpen || isSafeRouteModalOpen || isMetroRouteModalOpen || isMobileMenuOpen) {
    return null;
  }

  return (
    <div 
      className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-auto"
      style={{
        bottom: 'max(1rem, calc(0.6rem + env(safe-area-inset-bottom, 16px)))',
      }}
    >
      <div className="p-1 rounded-full bg-dark-950/90 backdrop-blur-2xl border border-dark-800/90 shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex items-center">
        <button
          type="button"
          onClick={() => openReportModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-rose-950/80 border border-white/20 transition-all duration-150 active:scale-95 hover:scale-105 cursor-pointer"
          aria-label="Signaler un incident, contrôleurs ou panne"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-ping absolute" />
            <Plus className="w-4 h-4 stroke-[3] relative z-10" />
          </div>
          <span className="tracking-wide uppercase font-mono text-[11px]">Signaler</span>
        </button>
      </div>
    </div>
  );
};
