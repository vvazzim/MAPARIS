import React from 'react';
import { 
  Map as MapIcon, 
  List, 
  PlusCircle, 
  Compass
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';

export const MobileBottomNav: React.FC = () => {
  const {
    mobileActiveTab,
    setMobileActiveTab,
    openReportModal,
    openSafeRouteModal,
    incidents,
    t,
  } = useIncidentStore();

  return (
    <nav 
      className="lg:hidden bg-dark-900/95 backdrop-blur-xl border-t border-dark-800 flex items-center justify-around px-3 z-40 select-none shrink-0 shadow-2xl pt-1.5"
      style={{
        paddingBottom: 'max(0.85rem, calc(0.5rem + env(safe-area-inset-bottom, 20px)))',
        minHeight: 'calc(4.25rem + env(safe-area-inset-bottom, 20px))',
      }}
    >
      {/* 1. Tab: Carte */}
      <button
        onClick={() => setMobileActiveTab('map')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          mobileActiveTab === 'map' ? 'text-pulse-accent' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <MapIcon className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium font-mono">{t.mobile.map}</span>
      </button>

      {/* 2. Tab: Flux d'Alertes */}
      <button
        onClick={() => setMobileActiveTab('feed')}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition ${
          mobileActiveTab === 'feed' ? 'text-pulse-accent' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <List className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium font-mono">{t.mobile.alerts}</span>
        {incidents.length > 0 && (
          <span className="absolute top-0.5 right-4 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold bg-rose-600 text-white shadow-sm">
            {incidents.length}
          </span>
        )}
      </button>

      {/* 3. Action Principale : Signaler (Bouton Central Flottant) */}
      <div className="flex flex-col items-center justify-center px-2 -mt-4">
        <button
          onClick={() => {
            setMobileActiveTab('map');
            openReportModal();
          }}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/80 border-2 border-dark-900 hover:scale-105 active:scale-95 transition cursor-pointer"
          title={t.mobile.reportAction}
        >
          <PlusCircle className="w-6 h-6" />
        </button>
        <span className="text-[9px] font-bold text-rose-400 mt-1 font-mono">{t.mobile.report}</span>
      </div>

      {/* 4. Action : Itinéraire Sûr */}
      <button
        onClick={() => {
          setMobileActiveTab('map');
          openSafeRouteModal();
        }}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-emerald-400 transition"
      >
        <Compass className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium font-mono">{t.mobile.safe}</span>
      </button>
    </nav>
  );
};
