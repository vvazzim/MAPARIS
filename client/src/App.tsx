import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { SecurityMap } from './components/Map/SecurityMap';
import { IncidentFeed } from './components/IncidentFeed';
import { TransportWidget } from './components/TransportWidget';
import { ReportModal } from './components/ReportModal';
import { SafeRouteModal } from './components/SafeRouteModal';
import { MobileDrawer } from './components/MobileDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { socket, initSocketListeners } from './services/socket';
import { useIncidentStore } from './store/useIncidentStore';
import { Incident } from './types';

export const App: React.FC = () => {
  const { 
    setConnectionStatus, 
    addIncident, 
    setIncidents, 
    updateIncident, 
    removeIncident 
  } = useIncidentStore();

  useEffect(() => {
    // Socket lifecycle listeners avec gestion du statut de reconnexion Render
    initSocketListeners((status) => {
      setConnectionStatus(status);
    });

    // Initial incidents list or live updates from server
    socket.on('incidents:init', (initialIncidents: Incident[]) => {
      console.log('[Socket] Reçu incidents initiaux:', initialIncidents.length);
      setIncidents(initialIncidents);
    });

    socket.on('incident:new', (newIncident: Incident) => {
      console.log('[Socket] Nouvel incident en temps réel:', newIncident);
      addIncident(newIncident);
    });

    socket.on('incident:updated', (updatedIncident: Incident) => {
      console.log('[Socket] Incident mis à jour / fusionné:', updatedIncident);
      updateIncident(updatedIncident);
    });

    socket.on('incident:expired', ({ id }: { id: string }) => {
      console.log('[Socket] Incident expiré retiré de la carte:', id);
      removeIncident(id);
    });

    return () => {
      socket.off('incidents:init');
      socket.off('incident:new');
      socket.off('incident:updated');
      socket.off('incident:expired');
    };
  }, [setConnectionStatus, addIncident, setIncidents, updateIncident, removeIncident]);

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-dark-950 font-sans">
      <Header />
      
      <main className="flex-1 flex overflow-hidden relative min-h-0 w-full">
        {/* Interactive Leaflet Map with CartoDB Dark Matter */}
        <section className="flex-1 relative h-full w-full min-h-0">
          <SecurityMap />
        </section>

        {/* Live Incident Feed Sidebar */}
        <IncidentFeed />

        {/* RATP Transport Hubs Drawer */}
        <TransportWidget />
      </main>

      {/* Mobile Bottom Navigation Bar (< lg screens) */}
      <MobileBottomNav />

      {/* Responsive Sandwich Drawer (< lg screens) */}
      <MobileDrawer />

      {/* Crowdsourcing Report Modal */}
      <ReportModal />

      {/* Safe Routing Planner Modal */}
      <SafeRouteModal />
    </div>
  );
};

export default App;
