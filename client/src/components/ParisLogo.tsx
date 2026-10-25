import React from 'react';

/**
 * Logo officiel de la Ville de Paris chargé depuis /logo.jpg,
 * redimensionné proprement avec coins arrondis et point d'exclamation (!) d'alerte urbaine.
 */
export const ParisLogo: React.FC<{ className?: string; showAlertDot?: boolean }> = ({ 
  className = 'w-8 h-8 sm:w-9 sm:h-9',
  showAlertDot = false,
}) => {
  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <img 
        src="/logo.jpg" 
        alt="Logo Officiel Ville de Paris" 
        className={`${className} rounded-xl object-cover shadow-sm border border-dark-700/90 bg-dark-900`}
        onError={(e) => {
          // Fallback gracieux si l'image ne charge pas
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />

      {/* Point d'exclamation (!) associé pour signaler les alertes/incidents */}
      {showAlertDot && (
        <span 
          className="absolute -top-1 -right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[9px] shadow-lg shadow-rose-950 border border-dark-900 animate-pulse select-none"
          title="Alertes actives"
        >
          !
        </span>
      )}
    </div>
  );
};
