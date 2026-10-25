import React from 'react';

/**
 * Logo officiel inspiré du blason de la Ville de Paris :
 * La Nef historique (navire à voiles déployées) navigant sur les flots de la Seine,
 * accompagnée du point d'exclamation (!) d'alerte urbaine.
 */
export const ParisLogo: React.FC<{ className?: string; showAlertDot?: boolean }> = ({ 
  className = 'w-6 h-6',
  showAlertDot = true,
}) => {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg 
        className={className} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo officiel Ville de Paris"
      >
        {/* Vagues de la Seine */}
        <path 
          d="M4 24C8 26 12 26 16 24C20 22 24 22 28 24" 
          stroke="#38bdf8" 
          strokeWidth="2.2" 
          strokeLinecap="round" 
        />
        <path 
          d="M6 27C10 29 14 29 18 27C22 25 26 25 30 27" 
          stroke="#0284c7" 
          strokeWidth="1.6" 
          strokeLinecap="round" 
          opacity="0.8" 
        />
        {/* Coque de la Nef parisienne */}
        <path 
          d="M6 18C8 23.5 13 25 16 25C19 25 24 23.5 26 18H6Z" 
          fill="#f1f5f9" 
        />
        {/* Mât central */}
        <path 
          d="M16 6V18" 
          stroke="#cbd5e1" 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
        {/* Voiles déployées de la Nef */}
        <path 
          d="M16 7L24 14H16Z" 
          fill="#ffffff" 
        />
        <path 
          d="M16 8L9 14H16Z" 
          fill="#94a3b8" 
        />
        {/* Fanion au sommet du mât */}
        <path 
          d="M16 6L21 4.5L16 3V6Z" 
          fill="#f43f5e" 
        />
      </svg>

      {/* Point d'exclamation (!) associé pour signaler les alertes/incidents */}
      {showAlertDot && (
        <span 
          className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 text-white font-mono font-bold text-[10px] shadow-lg shadow-rose-950 border border-dark-900 animate-pulse select-none"
          title="Alertes actives"
        >
          !
        </span>
      )}
    </div>
  );
};
