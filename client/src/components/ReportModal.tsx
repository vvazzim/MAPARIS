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
  Train 
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

export const ReportModal: React.FC = () => {
  const { isReportModalOpen, closeReportModal, addIncident, t } = useIncidentStore();

  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<AddressSuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [severity, setSeverity] = useState<Severity>('warning');
  const [category, setCategory] = useState<IncidentCategory>('manifestation');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('Témoin citoyen sur place');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close suggestions dropdown when clicking outside
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
      setErrorMessage("Veuillez saisir une adresse ou un lieu à Paris.");
      return;
    }

    if (description.trim().length < 5) {
      setErrorMessage("La description doit comporter au moins 5 caractères.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        address: finalAddress,
        severity,
        category,
        description: description.trim(),
        source: source.trim() || 'Signalement citoyen',
      };

      // Si l'utilisateur a sélectionné une suggestion, on inclut les coordonnées déjà résolues
      if (selectedLocation) {
        payload.lat = selectedLocation.lat;
        payload.lng = selectedLocation.lng;
      }

      // Appel API sécurisé avec gestion automatique des réponses vides ou non-JSON
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

      // Ajout immédiat au store pour affichage et auto-centrage sur la carte
      addIncident(createdIncident);

      // Réinitialisation du formulaire & fermeture du modal
      setAddressQuery('');
      setSelectedLocation(null);
      setDescription('');
      setSeverity('warning');
      closeReportModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l\'envoi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop overlay assombri */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={closeReportModal}
        aria-hidden="true"
      />

      <div 
        className="relative w-full max-w-lg bg-dark-900 border border-dark-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200"
        style={{
          maxHeight: 'min(92dvh, 780px)',
        }}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-950/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.reportModal.title}</h2>
              <p className="text-xs text-slate-400">
                {t.reportModal.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form 
          onSubmit={handleSubmit} 
          className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5"
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

          {/* 1. Adresse / Lieu avec autocomplétion BAN */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.reportModal.locationLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={addressQuery}
                onChange={(e) => {
                  setAddressQuery(e.target.value);
                  setSelectedLocation(null);
                }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder={t.reportModal.locationPlaceholder}
                className="w-full pl-9 pr-9 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pulse-accent transition"
                required
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-3" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-dark-850 border border-dark-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-dark-800 max-h-48 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-2.5 hover:bg-dark-800 cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Search className="w-3.5 h-3.5 text-pulse-accent shrink-0" />
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
          </div>

          {/* 2. Niveau de Sévérité */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {t.reportModal.severityLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSeverity('danger')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  severity === 'danger'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300 shadow-md shadow-rose-950'
                    : 'bg-dark-950 border-dark-800 text-slate-400 hover:border-dark-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <AlertCircle className={`w-4 h-4 ${severity === 'danger' ? 'text-rose-500' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-500">{t.reportModal.dangerBadge}</span>
                </div>
                <span className="text-xs font-bold text-white">{t.reportModal.dangerTitle}</span>
                <span className="text-[10px] text-slate-400">{t.reportModal.dangerDesc}</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('warning')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                    : 'bg-dark-950 border-dark-800 text-slate-400 hover:border-dark-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <AlertTriangle className={`w-4 h-4 ${severity === 'warning' ? 'text-amber-500' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-500">{t.reportModal.warningBadge}</span>
                </div>
                <span className="text-xs font-bold text-white">{t.reportModal.warningTitle}</span>
                <span className="text-[10px] text-slate-400">{t.reportModal.warningDesc}</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('safe')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                  severity === 'safe'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                    : 'bg-dark-950 border-dark-800 text-slate-400 hover:border-dark-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <CheckCircle className={`w-4 h-4 ${severity === 'safe' ? 'text-emerald-500' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-500">{t.reportModal.safeBadge}</span>
                </div>
                <span className="text-xs font-bold text-white">{t.reportModal.safeTitle}</span>
                <span className="text-[10px] text-slate-400">{t.reportModal.safeDesc}</span>
              </button>
            </div>
          </div>

          {/* 3. Catégorie */}
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
                    className={`py-2 px-2.5 rounded-lg border text-left flex items-center space-x-1.5 transition ${
                      isSelected
                        ? 'bg-dark-800 border-pulse-accent text-white'
                        : 'bg-dark-950/60 border-dark-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="text-[11px] truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Description détaillée */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.reportModal.descriptionLabel} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.reportModal.descriptionPlaceholder}
              className="w-full p-3 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pulse-accent transition"
              required
            />
          </div>

          {/* 5. Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t.reportModal.sourceLabel}
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={t.reportModal.sourcePlaceholder}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pulse-accent transition"
            />
          </div>

          {/* Footer Submit & Legend with Safe-Area Protection */}
          <div 
            className="pt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-dark-800"
            style={{
              paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 12px))'
            }}
          >
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{t.reportModal.note}</span>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={closeReportModal}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-dark-800 transition"
              >
                {t.reportModal.cancel}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-rose-950 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.reportModal.submitting}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.reportModal.submit}</span>
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
