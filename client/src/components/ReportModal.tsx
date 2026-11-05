import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Send, 
  Search, 
  Loader2, 
  Radio, 
  Flag, 
  Flame, 
  Train,
  Shield,
  Clock,
  Ban
} from 'lucide-react';
import { useIncidentStore } from '../store/useIncidentStore';
import { Severity, IncidentCategory } from '../types';
import { safeFetchJson } from '../services/api';

interface AddressSuggestion {
  lat: number;
  lng: number;
  label: string;
  score: number;
  postcode?: string;
  city?: string;
}

type ReportMode = 'controleurs' | 'arret_perturbe' | 'greve_retard' | 'securite';

const POPULAR_TRANSIT_STATIONS = [
  { name: 'Porte de Clichy', lat: 48.8944, lng: 2.3134, lines: ['M13', 'M14', 'T3b', 'RER C', 'Bus 54', 'Bus 66', 'Bus 74', 'Bus 173'] },
  { name: 'Saint-Lazare', lat: 48.8756, lng: 2.3258, lines: ['M3', 'M9', 'M12', 'M13', 'M14', 'RER E', 'Train J', 'Train L', 'Bus 66'] },
  { name: 'Châtelet - Les Halles', lat: 48.8606, lng: 2.3476, lines: ['M1', 'M4', 'M7', 'M11', 'M14', 'RER A', 'RER B', 'RER D', 'Bus 74'] },
  { name: 'Gare du Nord', lat: 48.8809, lng: 2.3553, lines: ['M4', 'M5', 'RER B', 'RER D', 'RER E', 'Train H', 'Bus 54'] },
  { name: 'Montparnasse - Bienvenüe', lat: 48.8421, lng: 2.3219, lines: ['M4', 'M6', 'M12', 'M13', 'Train N'] },
  { name: 'Gare de Lyon', lat: 48.8449, lng: 2.3734, lines: ['M1', 'M14', 'RER A', 'RER D', 'Train R'] },
  { name: 'Place de Clichy', lat: 48.8834, lng: 2.3275, lines: ['M2', 'M13', 'Bus 54', 'Bus 80'] },
  { name: 'Mairie de Saint-Ouen', lat: 48.9118, lng: 2.3338, lines: ['M13', 'M14', 'Bus 66', 'Bus 173'] },
  { name: 'La Défense (Grande Arche)', lat: 48.8918, lng: 2.2380, lines: ['M1', 'RER A', 'Train L', 'Train U', 'T2'] },
  { name: 'Saint-Denis Pleyel', lat: 48.9198, lng: 2.3456, lines: ['M14', 'RER D'] },
];

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, closeReportModal, addIncident, reportModalPrefill, t } = useIncidentStore();

  const [activeMode, setActiveMode] = useState<ReportMode>('controleurs');

  // Common fields
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<AddressSuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Controller report state
  const [controllerLine, setControllerLine] = useState('M13');
  const [controllerDirection, setControllerDirection] = useState('Châtillon - Montrouge');
  const [controllerLocation, setControllerLocation] = useState<'turnstiles' | 'platform' | 'train' | 'hall'>('turnstiles');
  const [controllerAgentsCount, setControllerAgentsCount] = useState('3 à 5 agents (équipe standard)');
  const [controllerCustomNotes, setControllerCustomNotes] = useState('');

  // Station disruption state
  const [disruptedLine, setDisruptedLine] = useState('M13');
  const [disruptionReason, setDisruptionReason] = useState('Ascenseur / Escalator en panne (PMR)');
  const [disruptionNotes, setDisruptionNotes] = useState('');

  // Train delay / strike state
  const [delayedLine, setDelayedLine] = useState('RER C');
  const [delayDurationMin, setDelayDurationMin] = useState('15');
  const [delayReason, setDelayReason] = useState('Panne de signalisation');

  // Generic security state
  const [severity, setSeverity] = useState<Severity>('warning');
  const [category, setCategory] = useState<IncidentCategory>('manifestation');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronisation avec les données pré-remplies si ouverture depuis un arrêt
  useEffect(() => {
    if (isReportModalOpen && reportModalPrefill) {
      if (reportModalPrefill.category) {
        if (reportModalPrefill.category === 'controleurs') setActiveMode('controleurs');
        else if (reportModalPrefill.category === 'arret_perturbe' || reportModalPrefill.category === 'fermeture_station') setActiveMode('arret_perturbe');
        else if (reportModalPrefill.category === 'greve_retard') setActiveMode('greve_retard');
        else setActiveMode('securite');
      }
      if (reportModalPrefill.address) {
        setAddressQuery(reportModalPrefill.address);
        setSelectedLocation({
          label: reportModalPrefill.address,
          lat: reportModalPrefill.lat || 48.8944,
          lng: reportModalPrefill.lng || 2.3134,
          score: 1,
        });
      }
      if (reportModalPrefill.line) {
        setControllerLine(reportModalPrefill.line);
        setDisruptedLine(reportModalPrefill.line);
        setDelayedLine(reportModalPrefill.line);
      }
    }
  }, [isReportModalOpen, reportModalPrefill]);

  // Pré-remplir l'adresse par défaut si vide (Porte de Clichy)
  useEffect(() => {
    if (!addressQuery && activeMode !== 'securite' && !reportModalPrefill) {
      const defaultHub = POPULAR_TRANSIT_STATIONS[0];
      setAddressQuery(defaultHub.name);
      setSelectedLocation({
        label: defaultHub.name,
        lat: defaultHub.lat,
        lng: defaultHub.lng,
        score: 1,
      });
    }
  }, [activeMode, addressQuery, reportModalPrefill]);

  // Debounced search for Base Adresse Nationale
  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 2 || selectedLocation?.label === addressQuery) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await safeFetchJson<{ success: boolean; data: AddressSuggestion[] }>(
          `/api/geocode/search?q=${encodeURIComponent(addressQuery)}&limit=5`
        );
        if (result.ok && result.data && Array.isArray(result.data.data)) {
          setSuggestions(result.data.data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Erreur autocomplétion BAN:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [addressQuery, selectedLocation]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isReportModalOpen) return null;

  const handleSelectPresetStation = (station: typeof POPULAR_TRANSIT_STATIONS[0]) => {
    setSelectedLocation({
      label: station.name,
      lat: station.lat,
      lng: station.lng,
      score: 1,
    });
    setAddressQuery(station.name);
    if (station.lines.length > 0) {
      setControllerLine(station.lines[0]);
      setDisruptedLine(station.lines[0]);
    }
    setShowDropdown(false);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSelectedLocation(suggestion);
    setAddressQuery(suggestion.label);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalAddress = addressQuery.trim();
    if (!finalAddress) {
      setErrorMessage(t.reportModal.requiredAddressError);
      return;
    }

    let finalCategory: IncidentCategory = 'autre';
    let finalSeverity: Severity = 'warning';
    let finalDescription = '';
    let finalSource = 'Signalement Citoyen';

    if (activeMode === 'controleurs') {
      finalCategory = 'controleurs';
      finalSeverity = 'warning';
      finalSource = 'Radar Contrôleurs Citoyen';

      const locText = 
        controllerLocation === 'turnstiles' ? 'aux sorties et tourniquets de validation' :
        controllerLocation === 'platform' ? 'sur les quais d\'embarquement' :
        controllerLocation === 'train' ? 'à bord de la rame / train' : 'dans les couloirs de correspondance';

      finalDescription = `👮 Contrôleurs RATP/SNCF signalés ${locText} sur la ligne ${controllerLine} (sens ${controllerDirection || 'les deux sens'}). Équipe: ${controllerAgentsCount}.${controllerCustomNotes ? ' Note: ' + controllerCustomNotes.trim() : ''}`;
    } else if (activeMode === 'arret_perturbe') {
      finalCategory = 'arret_perturbe';
      finalSeverity = 'warning';
      finalSource = 'Signalement Usager Transport';
      finalDescription = `🚫 Arrêt / Station perturbé(e) : ${disruptionReason} sur la ligne ${disruptedLine} à ${finalAddress}.${disruptionNotes ? ' Détails: ' + disruptionNotes.trim() : ''}`;
    } else if (activeMode === 'greve_retard') {
      finalCategory = 'greve_retard';
      finalSeverity = 'warning';
      finalSource = 'Alerte Trafic Citoyenne';
      finalDescription = `⏱️ Retard estimé à +${delayDurationMin} min sur la ligne ${delayedLine} (${delayReason}). Circulation ralentie / trains supprimés.`;
    } else {
      finalCategory = category;
      finalSeverity = severity;
      finalSource = 'Signalement Citoyen Direct';
      finalDescription = description.trim();
      if (finalDescription.length < 5) {
        setErrorMessage("La description doit comporter au moins 5 caractères.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        address: finalAddress,
        severity: finalSeverity,
        category: finalCategory,
        description: finalDescription,
        source: finalSource,
      };

      if (selectedLocation) {
        payload.lat = selectedLocation.lat;
        payload.lng = selectedLocation.lng;
      }

      const result = await safeFetchJson<{
        status?: string;
        incident?: any;
        success?: boolean;
        data?: any;
        error?: string;
      }>('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!result.ok) {
        throw new Error(result.error || 'Erreur lors de la soumission du signalement');
      }

      const createdIncident = result.data?.incident || result.data?.data;
      if (!createdIncident) {
        throw new Error('Réponse invalide du serveur (incident manquant dans le retour).');
      }

      addIncident(createdIncident);
      closeReportModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l\'envoi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={closeReportModal}
        aria-hidden="true"
      />

      <div 
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[min(94dvh,820px)] sm:max-w-lg bg-dark-900 border-0 sm:border border-dark-750 sm:rounded-2xl rounded-none shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header avec Safe Area */}
        <div 
          className="px-5 sm:px-6 pb-3 border-b border-dark-800 flex items-center justify-between bg-dark-950/90 backdrop-blur-md shrink-0"
          style={{
            paddingTop: 'max(1rem, calc(0.75rem + env(safe-area-inset-top, 24px)))',
          }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Signaler en Temps Réel</h2>
              <p className="text-[11px] text-slate-400">
                Alertez la communauté : Contrôleurs, Pannes, Retards & Sécurité
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeReportModal}
            className="w-8 h-8 rounded-full bg-dark-800 hover:bg-dark-750 active:bg-dark-700 border border-dark-700 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Onglets Spécialisés de Signalement */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-dark-950/60 border-b border-dark-800/80 shrink-0">
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-dark-950 border border-dark-800 text-center">
            <button
              type="button"
              onClick={() => setActiveMode('controleurs')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                activeMode === 'controleurs'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[10px] leading-tight">Contrôleurs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('arret_perturbe')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                activeMode === 'arret_perturbe'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span className="text-[10px] leading-tight">Arrêt HS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('greve_retard')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                activeMode === 'greve_retard'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md shadow-amber-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] leading-tight">Retards</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('securite')}
              className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                activeMode === 'securite'
                  ? 'bg-dark-800 text-white border border-dark-650 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[10px] leading-tight">Sécurité</span>
            </button>
          </div>
        </div>

        {/* Form Body Scrollable */}
        <form 
          onSubmit={handleSubmit} 
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4"
          style={{
            paddingBottom: 'max(2.5rem, calc(2rem + env(safe-area-inset-bottom, 24px)))',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Saisie de la Station / Lieu */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {activeMode === 'securite' ? 'Lieu ou Adresse' : 'Station ou Arrêt de Transport'} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-slate-500">Paris & IDF</span>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => {
                  setAddressQuery(e.target.value);
                  setSelectedLocation(null);
                }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder={activeMode === 'securite' ? 'Ex: Place de la République, 75011...' : 'Ex: Porte de Clichy, Saint-Lazare, Châtelet...'}
                className="w-full pl-9 pr-9 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition"
                required
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-3" />
              )}
            </div>

            {/* Suggestions BAN */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-dark-850 border border-dark-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-dark-800 max-h-48 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-2.5 hover:bg-dark-800 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-slate-200">{item.label}</span>
                    </div>
                    {item.postcode && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-950 text-slate-400">
                        {item.postcode}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Puces de stations rapides */}
            {activeMode !== 'securite' && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
                <span className="text-[10px] font-mono text-slate-500 shrink-0">Rapide:</span>
                {POPULAR_TRANSIT_STATIONS.slice(0, 5).map((st) => (
                  <button
                    key={st.name}
                    type="button"
                    onClick={() => handleSelectPresetStation(st)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 border transition active:scale-95 cursor-pointer ${
                      addressQuery === st.name
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-dark-950 border-dark-750 text-slate-400 hover:border-dark-650'
                    }`}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* CAS 1 : RADAR CONTRÔLEURS EXPRESS                         */}
          {/* ========================================================= */}
          {activeMode === 'controleurs' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Ligne & Direction */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ligne concernée
                  </label>
                  <select
                    value={controllerLine}
                    onChange={(e) => setControllerLine(e.target.value)}
                    className="w-full p-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {['M13', 'M14', 'M1', 'M2', 'M4', 'M7', 'M8', 'M9', 'M12', 'RER A', 'RER B', 'RER C', 'RER D', 'RER E', 'T3b', 'T1', 'T2', 'Bus 54', 'Bus 66', 'Bus 74', 'Bus 173', 'Train H', 'Train J', 'Train L'].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Direction / Sens
                  </label>
                  <input
                    type="text"
                    value={controllerDirection}
                    onChange={(e) => setControllerDirection(e.target.value)}
                    placeholder="Ex: Châtillon, Orly, Pontoise..."
                    className="w-full p-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Emplacement Exact des Contrôleurs */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Localisation exacte dans la station
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'turnstiles', label: '🚪 Aux sorties / Tourniquets', desc: 'Contrôle à la validation' },
                    { id: 'platform', label: '🚉 Sur les quais', desc: 'Attente à l\'arrivée' },
                    { id: 'train', label: '🚆 À bord de la rame', desc: 'Contrôle en circulation' },
                    { id: 'hall', label: '🚶 Couloirs / Correspondances', desc: 'Filtrage dans les tunnels' },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setControllerLocation(loc.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition active:scale-95 cursor-pointer ${
                        controllerLocation === loc.id
                          ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-md shadow-indigo-950/80'
                          : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:border-dark-700'
                      }`}
                    >
                      <div className="font-bold text-white text-[11px]">{loc.label}</div>
                      <div className="text-[10px] text-slate-400">{loc.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Taille de l'équipe */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Taille estimée du groupe d'agents
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['1 à 2 agents', '3 à 5 agents (équipe)', '6+ agents / Cynophile'].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setControllerAgentsCount(count)}
                      className={`py-2 px-1.5 rounded-xl border text-center text-[10px] font-semibold transition active:scale-95 cursor-pointer ${
                        controllerAgentsCount === count
                          ? 'bg-indigo-900/60 border-indigo-400 text-white'
                          : 'bg-dark-950 border-dark-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarque facultative */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Précision facultative (tenue, attitude, quai précis)
                </label>
                <input
                  type="text"
                  value={controllerCustomNotes}
                  onChange={(e) => setControllerCustomNotes(e.target.value)}
                  placeholder="Ex: Gilets bordeaux RATP, postés en haut des escalators sortie 2..."
                  className="w-full p-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-900/60 text-[11px] text-indigo-300 flex items-center gap-2">
                <span className="text-sm">⏱️</span>
                <span>Signalement valable 35 minutes avec prolongation ou suppression communautaire en direct.</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CAS 2 : SIGNALER UN ARRÊT HS / EN PANNE                   */}
          {/* ========================================================= */}
          {activeMode === 'arret_perturbe' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ligne de transport
                </label>
                <select
                  value={disruptedLine}
                  onChange={(e) => setDisruptedLine(e.target.value)}
                  className="w-full p-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {['M13', 'M14', 'M1', 'M2', 'M4', 'M7', 'M8', 'M9', 'M12', 'RER A', 'RER B', 'RER C', 'RER D', 'RER E', 'T3b', 'Bus 54', 'Bus 66', 'Bus 74', 'Bus 173', 'Train H', 'Train J', 'Train L'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nature du problème
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'pmr', label: '♿ Ascenseur / Escalator HS', desc: 'Inaccessible PMR & poussettes' },
                    { id: 'ferme', label: '⛔ Station fermée', desc: 'Accès barré / Évacuation' },
                    { id: 'quai', label: '👥 Quai saturé / Rame bloquée', desc: 'Foule dense & attente > 15min' },
                    { id: 'bornes', label: '🎫 Bornes Navigo HS', desc: 'Portiques bloqués' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setDisruptionReason(r.label)}
                      className={`p-2.5 rounded-xl border text-left transition active:scale-95 cursor-pointer ${
                        disruptionReason === r.label
                          ? 'bg-rose-950/60 border-rose-500 text-rose-100 shadow-md shadow-rose-950/80'
                          : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:border-dark-700'
                      }`}
                    >
                      <div className="font-bold text-white text-[11px]">{r.label}</div>
                      <div className="text-[10px] text-slate-400">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Détails ou précisions utiles
                </label>
                <input
                  type="text"
                  value={disruptionNotes}
                  onChange={(e) => setDisruptionNotes(e.target.value)}
                  placeholder="Ex: Ascenseur accès boulevard Bessières en panne depuis ce matin..."
                  className="w-full p-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CAS 3 : RETARD / TRAIN SUPPRIMÉ / GRÈVE                   */}
          {/* ========================================================= */}
          {activeMode === 'greve_retard' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ligne perturbée
                  </label>
                  <select
                    value={delayedLine}
                    onChange={(e) => setDelayedLine(e.target.value)}
                    className="w-full p-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {['RER B', 'RER C', 'RER D', 'RER A', 'RER E', 'Train H', 'Train J', 'Train L', 'Train N', 'Train P', 'Train R', 'Train U', 'M13', 'M14', 'M8', 'T3b', 'Bus 54'].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Retard estimé
                  </label>
                  <select
                    value={delayDurationMin}
                    onChange={(e) => setDelayDurationMin(e.target.value)}
                    className="w-full p-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="10">+10 minutes</option>
                    <option value="15">+15 à 20 minutes</option>
                    <option value="30">+30 minutes</option>
                    <option value="supprime">Train supprimé / Annulé</option>
                    <option value="greve">Mouvement social / Grève</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motif ou cause
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Panne de signalisation', 'Panne de matériel / train', 'Incident voyageur / Malaise', 'Mouvement de grève', 'Colis suspect', 'Trafic interrompu'].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setDelayReason(reason)}
                      className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition active:scale-95 cursor-pointer ${
                        delayReason === reason
                          ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                          : 'bg-dark-950 border-dark-800 text-slate-400'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CAS 4 : INCIDENT RUE / SÉCURITÉ URBAINE                   */}
          {/* ========================================================= */}
          {activeMode === 'securite' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.reportModal.severityLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity('danger')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 ${
                      severity === 'danger'
                        ? 'bg-rose-950/50 border-rose-500 text-rose-200 shadow-md shadow-rose-950/60'
                        : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:border-dark-700'
                    }`}
                  >
                    <AlertCircle className={`w-4 h-4 mb-1 ${severity === 'danger' ? 'text-rose-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-white">{t.reportModal.dangerTitle}</span>
                    <span className="text-[10px] font-mono text-rose-400/80 uppercase font-semibold">{t.reportModal.dangerBadge}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeverity('warning')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 ${
                      severity === 'warning'
                        ? 'bg-amber-950/50 border-amber-500 text-amber-200 shadow-md shadow-amber-950/60'
                        : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:border-dark-700'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 mb-1 ${severity === 'warning' ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-white">{t.reportModal.warningTitle}</span>
                    <span className="text-[10px] font-mono text-amber-400/80 uppercase font-semibold">{t.reportModal.warningBadge}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeverity('safe')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer active:scale-95 ${
                      severity === 'safe'
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/60'
                        : 'bg-dark-950/80 border-dark-800 text-slate-400 hover:border-dark-700'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 mb-1 ${severity === 'safe' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-white">{t.reportModal.safeTitle}</span>
                    <span className="text-[10px] font-mono text-emerald-400/80 uppercase font-semibold">{t.reportModal.safeBadge}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.reportModal.categoryLabel}
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'manifestation', label: t.reportModal.categories.manifestation, icon: Flag },
                    { id: 'tension', label: t.reportModal.categories.tension, icon: AlertTriangle },
                    { id: 'blocage', label: t.reportModal.categories.blocage, icon: MapPin },
                    { id: 'fermeture_station', label: t.reportModal.categories.fermeture_station, icon: Train },
                    { id: 'degradation', label: t.reportModal.categories.degradation, icon: Flame },
                    { id: 'calme', label: t.reportModal.categories.calme, icon: CheckCircle },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as IncidentCategory)}
                        className={`py-2 px-2 rounded-lg border text-left flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-dark-800 border-rose-500/60 text-white shadow-sm'
                            : 'bg-dark-950/60 border-dark-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="text-[11px] truncate font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.reportModal.descriptionLabel} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.reportModal.descriptionPlaceholder}
                  className="w-full p-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/60 transition resize-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Footer Submit & Action */}
          <div 
            className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-dark-800"
            style={{
              paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 12px))'
            }}
          >
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Diffusion immédiate temps réel (Socket.IO)</span>
            </div>

            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={closeReportModal}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-dark-800 transition cursor-pointer"
              >
                {t.reportModal.cancel}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 ${
                  activeMode === 'controleurs'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-indigo-950'
                    : activeMode === 'arret_perturbe'
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-rose-950'
                    : activeMode === 'greve_retard'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-amber-950'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Diffusion en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {activeMode === 'controleurs' ? 'Alerter Contrôleurs (Radar)' :
                       activeMode === 'arret_perturbe' ? 'Signaler l\'Arrêt HS' :
                       activeMode === 'greve_retard' ? 'Signaler le Retard / Grève' :
                       t.reportModal.submit}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
