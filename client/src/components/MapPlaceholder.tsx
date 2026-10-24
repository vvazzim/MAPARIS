import React from 'react';
import { MapPin, Navigation, Layers, Compass } from 'lucide-react';

export const MapPlaceholder: React.FC = () => {
  return (
    <div className="relative w-full h-full bg-dark-950 flex flex-col items-center justify-center overflow-hidden border-r border-dark-800">
      {/* Background CartoDB Grid Mockup */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #1e293b 1px, transparent 1px), radial-gradient(circle at 20% 30%, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Center Radar / Compass Graphic */}
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-md">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-slate-800/60 border border-slate-700/80 flex items-center justify-center backdrop-blur-sm">
            <Compass className="w-12 h-12 text-rose-500 animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <div className="absolute inset-0 rounded-full border border-rose-500/30 animate-radar" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-rose-500" />
          Carte Interactive (CartoDB Dark Matter)
        </h3>
        
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Composant Leaflet prêt à être initialisé à l'<strong>Étape 2 & 3</strong> avec centrage sur Paris (48.8566, 2.3522), tuiles sombres haute résolution et calques de sévérité dynamiques.
        </p>

        <div className="grid grid-cols-2 gap-3 w-full text-xs font-mono">
          <div className="flex items-center space-x-2 bg-dark-900/80 border border-dark-800 rounded-lg p-2.5 text-slate-300">
            <Navigation className="w-4 h-4 text-pulse-accent" />
            <span>Center: 48.8566, 2.3522</span>
          </div>
          <div className="flex items-center space-x-2 bg-dark-900/80 border border-dark-800 rounded-lg p-2.5 text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>CartoDB Dark Matter</span>
          </div>
        </div>
      </div>

      {/* Floating Status pill */}
      <div className="absolute bottom-6 left-6 z-10 bg-dark-900/90 border border-dark-700/70 backdrop-blur-md px-3.5 py-2 rounded-xl flex items-center space-x-3 text-xs text-slate-300 shadow-xl">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Leaflet Engine : Prêt pour montage Étape 2</span>
      </div>
    </div>
  );
};
