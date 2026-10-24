import React from 'react';
import { 
  Map as MapIcon, 
  List, 
  PlusCircle, 
  Compass, 
  Menu 
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';

export const MobileBottomNav: React.FC = () => {
  const {
    mobileActiveTab,
    setMobileActiveTab,
    toggleMobileMenu,
    openReportModal,
    openSafeRouteModal,
    incidents,
  } = useIncidentStore();

  return (
    <nav className="lg:hidden h-16 bg-dark-900/95 backdrop-blur-xl border-t border-dark-800 flex items-center justify-around px-2 z-40 select-none shrink-0 shadow-2xl safe-area-bottom">
      
      {/* Tab: Carte */}
      <button
        onClick={() => setMobileActiveTab('map')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          mobileActiveTab === 'map' ? 'text-pulse-accent' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <MapIcon className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium font-mono">Carte</span>
      </button>

      {/* Tab: Flux d'Alertes */}
      <button
        onClick={() => setMobileActiveTab('feed')}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition ${
          mobileActiveTab === 'feed' ? 'text-pulse-accent' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <List className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium font-mono">Alertes</span>
        {incidents.length > 0 && (
          <span className="absolute top-0.5 right-4 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold bg-rose-600 text-white shadow-sm">
            {incidents.length}
          </span>
        )}
      </button>

      {/* Primary Action: Signaler (Center Button) */}
      <div className="flex flex-col items-center justify-center px-1 -mt-4">
        <button
          onClick={openReportModal}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/80 border-2 border-dark-900 hover:scale-105 active:scale-95 transition"
          title="Signaler un incident"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
        <span className="text-[9px] font-bold text-rose-400 mt-1 font-mono">SIGNALER</span>
      </div>

      {/* Action: Itinéraire Safe */}
      <button
        onClick={openSafeRouteModal}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-emerald-400 transition"
      >
        <Compass className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium font-mono">Safe</span>
      </button>

      {/* Action: Sandwich Menu */}
      <button
        onClick={toggleMobileMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-white transition"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium font-mono">Menu</span>
      </button>

    </nav>
  );
};
