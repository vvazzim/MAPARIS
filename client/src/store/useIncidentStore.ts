import { create } from 'zustand';
import { Incident, FilterOptions, SafeRouteResult } from '../types';
import { safeFetchJson } from '../services/api';
import { detectDefaultLanguage, Language, translations } from '../i18n/translations';

interface IncidentState {
  incidents: Incident[];
  selectedIncident: Incident | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  filters: FilterOptions;
  
  // Internationalization i18n
  language: Language;
  t: typeof translations['fr'];
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;

  // Modals & Drawers
  isReportModalOpen: boolean;
  isSafeRouteModalOpen: boolean;
  showTransportWidget: boolean;
  isMobileMenuOpen: boolean;
  mobileActiveTab: 'map' | 'feed';

  // Map Viewport state
  flyTarget: { lat: number; lng: number; zoom?: number } | null;
  showDangerRadius: boolean;
  showTransports: boolean;

  // Active Safe Route on Map
  activeSafeRoute: SafeRouteResult | null;
  selectedRouteIndex: number;
  setSelectedRouteIndex: (idx: number) => void;

  // Actions
  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (incident: Incident) => void;
  removeIncident: (id: string) => void;
  setSelectedIncident: (incident: Incident | null) => void;
  setIsConnected: (connected: boolean) => void;
  setConnectionStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  toggleDangerRadius: () => void;
  toggleTransports: () => void;
  toggleTransportWidget: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  setMobileActiveTab: (tab: 'map' | 'feed') => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  openSafeRouteModal: () => void;
  closeSafeRouteModal: () => void;
  setActiveSafeRoute: (route: SafeRouteResult | null) => void;
  clearSafeRoute: () => void;
  voteIncident: (id: string, type: 'up' | 'down') => Promise<void>;
}

export const useIncidentStore = create<IncidentState>((set, get) => {
  const initialLang = detectDefaultLanguage();

  return {
    incidents: [],
    selectedIncident: null,
    isConnected: false,
    connectionStatus: 'connecting' as any,
    filters: {
      severity: 'all',
      minUpvotes: 0,
      searchQuery: '',
    },
    language: initialLang,
    t: translations[initialLang],
    setLanguage: (lang: Language) => {
      localStorage.setItem('maparis_lang', lang);
      set({ language: lang, t: translations[lang] });
    },
    toggleLanguage: () => {
      const next: Language = get().language === 'fr' ? 'en' : 'fr';
      localStorage.setItem('maparis_lang', next);
      set({ language: next, t: translations[next] });
    },
    isReportModalOpen: false,
    isSafeRouteModalOpen: false,
    showTransportWidget: false,
    isMobileMenuOpen: false,
    mobileActiveTab: 'map',
    flyTarget: null,
    showDangerRadius: true,
    showTransports: true,
    activeSafeRoute: null,
    selectedRouteIndex: 0,
    setSelectedRouteIndex: (selectedRouteIndex) => set({ selectedRouteIndex }),

  setIncidents: (incidents) => set({ incidents }),
  
  addIncident: (incident) =>
    set((state) => {
      const exists = state.incidents.some((i) => i.id === incident.id);
      if (exists) {
        return {
          incidents: state.incidents.map((i) => (i.id === incident.id ? incident : i)),
        };
      }
      return { 
        incidents: [incident, ...state.incidents],
        flyTarget: { lat: incident.lat, lng: incident.lng, zoom: 15 },
        selectedIncident: incident,
      };
    }),

  updateIncident: (incident) =>
    set((state) => ({
      incidents: state.incidents.map((i) => (i.id === incident.id ? incident : i)),
      selectedIncident: state.selectedIncident?.id === incident.id ? incident : state.selectedIncident,
    })),

  removeIncident: (id) =>
    set((state) => ({
      incidents: state.incidents.filter((i) => i.id !== id),
      selectedIncident: state.selectedIncident?.id === id ? null : state.selectedIncident,
    })),

  setSelectedIncident: (incident) =>
    set({
      selectedIncident: incident,
      flyTarget: incident ? { lat: incident.lat, lng: incident.lng, zoom: 15 } : null,
    }),
  
  setIsConnected: (isConnected) => set({ isConnected }),

  setConnectionStatus: (connectionStatus) =>
    set({
      connectionStatus,
      isConnected: connectionStatus === 'connected',
    }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  flyTo: (lat, lng, zoom = 15) => set({ flyTarget: { lat, lng, zoom } }),

  toggleDangerRadius: () => set((state) => ({ showDangerRadius: !state.showDangerRadius })),
  toggleTransports: () => set((state) => ({ showTransports: !state.showTransports })),
  toggleTransportWidget: () => set((state) => ({ showTransportWidget: !state.showTransportWidget })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  setMobileActiveTab: (mobileActiveTab) => set({ mobileActiveTab }),

  openReportModal: () => set({ isReportModalOpen: true, isMobileMenuOpen: false }),
  closeReportModal: () => set({ isReportModalOpen: false }),

  openSafeRouteModal: () => set({ isSafeRouteModalOpen: true, isMobileMenuOpen: false }),
  closeSafeRouteModal: () => set({ isSafeRouteModalOpen: false }),

  setActiveSafeRoute: (route) => set({ activeSafeRoute: route, selectedRouteIndex: 0 }),
  clearSafeRoute: () => set({ activeSafeRoute: null, selectedRouteIndex: 0 }),

  voteIncident: async (id: string, type: 'up' | 'down') => {
    try {
      const res = await safeFetchJson<{ success?: boolean; data?: Incident }>(
        `/api/incidents/${id}/${type}vote`,
        { method: 'POST' }
      );
      if (res.ok && res.data?.data) {
        get().updateIncident(res.data.data);
      }
    } catch (err) {
      console.error(`Erreur vote ${type}:`, err);
    }
  },
};
});
