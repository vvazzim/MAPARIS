import React from 'react';
import { 
  Train, 
  PlusCircle, 
  Compass, 
  Menu,
  X
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { PARIS_TRANSPORT_HUBS } from '../data/ratpHubs';
import { ParisLogo } from './ParisLogo';

export const Header: React.FC = () => {
  const { 
    incidents, 
    toggleTransportWidget, 
    showTransportWidget,
    openReportModal,
    openSafeRouteModal,
    openMetroRouteModal,
    isMobileMenuOpen,
    toggleMobileMenu,
    setMobileActiveTab,
    language,
    setLanguage,
    t,
  } = useIncidentStore();

  const dangerCount = incidents.filter((i) => i.severity === 'danger').length;
  const warningCount = incidents.filter((i) => i.severity === 'warning').length;
  const safeCount = incidents.filter((i) => i.severity === 'safe').length;
  const disruptedStations = PARIS_TRANSPORT_HUBS.filter((s) => s.status !== 'normal').length;

  return (
    <header 
      className="border-b border-dark-800 bg-dark-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-50 select-none shrink-0 touch-none"
      style={{
        height: 'calc(4rem + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Logo officiel Ville de Paris avec marque MAParis */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        <ParisLogo className="w-8 h-8 sm:w-9 sm:h-9" showAlertDot={dangerCount > 0 || warningCount > 0} />
        <div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>MAParis</span>
            {/* Indicateur Live OSINT en VERT */}
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t.header.liveOsint}</span>
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {t.header.subtitle}
          </p>
        </div>
      </div>

      {/* Info Status Badges (Passifs sur Desktop) */}
      <div className="hidden xl:flex items-center space-x-2.5 text-xs font-mono cursor-default select-none">
        <div 
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-950/30 border border-red-900/40 text-red-400"
          title="Nombre d'alertes rouges actives"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>{t.header.dangerCount.replace('{count}', String(dangerCount))}</span>
        </div>
        <div 
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-900/40 text-amber-400"
          title="Nombre de zones de tension en cours"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>{t.header.warningCount.replace('{count}', String(warningCount))}</span>
        </div>
        <div 
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-400"
          title="Nombre de zones sûres confirmées"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{t.header.safeCount.replace('{count}', String(safeCount))}</span>
        </div>
      </div>

      {/* Actions & Menu Principal Unique */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        {/* Trajet Métro & RER (Visible Mobile & Desktop avec Heure de départ & Compte à rebours) */}
        <button
          onClick={() => {
            setMobileActiveTab('map');
            if (showTransportWidget) toggleTransportWidget();
            openMetroRouteModal();
          }}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950/60 border border-indigo-400/40 transition active:scale-95 cursor-pointer"
          title="Calculer un trajet Métro & RER avec heure exacte et compte à rebours"
        >
          <Train className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Trajet Métro</span>
          <span className="sm:hidden text-[11px] font-bold">Métro</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden xs:inline-block" />
        </button>

        {/* Itinéraire Sûr Piéton CTA */}
        <button
          onClick={() => {
            setMobileActiveTab('map');
            if (showTransportWidget) toggleTransportWidget();
            openSafeRouteModal();
          }}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 hover:bg-emerald-900/70 text-emerald-300 text-xs font-semibold shadow-md transition active:scale-95 cursor-pointer"
          title="Calculer un itinéraire piéton sécurisé"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.header.safeRoute}</span>
        </button>

        {/* Bouton Signaler Rapide (Accessible Mobile & Desktop) */}
        <button
          onClick={() => {
            setMobileActiveTab('map');
            if (showTransportWidget) toggleTransportWidget();
            openReportModal();
          }}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/80 border border-rose-400/30 transition active:scale-95 cursor-pointer"
          title="Diffuser une alerte citoyenne"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.header.report}</span>
        </button>

        {/* Hubs RATP */}
        <button
          onClick={toggleTransportWidget}
          className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer active:scale-95 ${
            showTransportWidget
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40'
          }`}
          title="Afficher les correspondances et métros RATP"
        >
          <Train className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t.header.ratpHubs}</span>
          {disruptedStations > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-600 text-white font-bold">
              {disruptedStations}
            </span>
          )}
        </button>

        {/* Choix Langue FR / EN */}
        <div className="flex items-center bg-dark-950 p-0.5 rounded-xl border border-dark-750">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              language === 'fr'
                ? 'bg-pulse-accent text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Passer en Français"
          >
            FR
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              language === 'en'
                ? 'bg-pulse-accent text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to English"
          >
            EN
          </button>
        </div>

        {/* Menu Unique Principal (Accessible Mobile & Desktop) */}
        <button
          onClick={toggleMobileMenu}
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-200 border border-dark-700 transition active:scale-95 cursor-pointer shadow-sm"
          title="Menu Principal"
          aria-label="Menu Principal"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-rose-400" />
          ) : (
            <>
              <Menu className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-semibold font-mono hidden sm:inline">Menu</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
