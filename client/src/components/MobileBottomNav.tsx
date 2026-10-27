import React from 'react';
import { PlusCircle } from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';

/**
 * Bouton d'action flottant (FAB) unique pour mobile.
 * Remplace l'ancienne barre d'onglets pour une carte 100% immersive et dégagée.
 * Toutes les autres options (flux, itinéraires, hubs, filtres) sont dans le menu escamotable.
 */
export const MobileBottomNav: React.FC = () => {
  const {
    openReportModal,
    mobileActiveTab,
    isReportModalOpen,
    isSafeRouteModalOpen,
    isMobileMenuOpen,
    showTransportWidget,
    t,
  } = useIncidentStore();

  // Ne pas afficher si l'utilisateur est déjà dans le flux plein écran ou si un tiroir/modale est ouvert
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
        bottom: 'max(1.25rem, calc(0.75rem + env(safe-area-inset-bottom, 14px)))',
      }}
    >
      <button
        type="button"
        onClick={openReportModal}
        className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-2xl border border-rose-400/30 active:scale-95 transition-all duration-150 cursor-pointer backdrop-blur-md"
        style={{
          boxShadow: '0 12px 28px -4px rgba(225, 29, 72, 0.45), 0 8px 16px -6px rgba(0, 0, 0, 0.6)',
        }}
        aria-label={t.mobile.reportAction}
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 shrink-0">
          <PlusCircle className="w-4 h-4 text-white" />
        </span>
        <span className="font-extrabold">{t.mobile.reportAction}</span>
      </button>
    </div>
  );
};
