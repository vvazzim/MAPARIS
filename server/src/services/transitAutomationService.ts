import { transitService } from './transitService.js';
import { incidentRepository } from '../repositories/incidentRepository.js';
import { broadcastNewIncident, broadcastIncidentUpdated } from '../sockets/socketHandler.js';
import { Incident, Severity, IncidentCategory } from '../types/index.js';

export class TransitAutomationService {
  private isPollingActive: boolean = false;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private lastSyncTime: string | null = null;

  constructor() {
    console.log('📡 [Transit Automation] Service de synchronisation automatique Grèves & Perturbations initialisé');
  }

  /**
   * Synchronise automatiquement les grèves, retards majeurs et pannes d'arrêts
   * du réseau RATP/SNCF dans le référentiel d'incidents temps réel
   */
  async syncDisruptionsToIncidents(): Promise<{
    success: boolean;
    syncedCount: number;
    createdCount: number;
    updatedCount: number;
    timestamp: string;
  }> {
    const disruptions = transitService.getNetworkDisruptions();
    let createdCount = 0;
    let updatedCount = 0;

    const allIncidents = await incidentRepository.getAll({ limit: 100 });

    for (const disrup of disruptions) {
      const incidentId = `inc-transit-${disrup.id}`;
      const existing = allIncidents.find((i) => i.id === incidentId);

      const severity: Severity = disrup.severity === 'critical' ? 'danger' : 'warning';
      const category: IncidentCategory = disrup.type === 'station_closure' ? 'arret_perturbe' : 'greve_retard';
      const locationName = `${disrup.stationName || 'Paris IDF'} (${disrup.lineLabel})`;
      const fullDescription = `${disrup.title} — ${disrup.description}${
        disrup.impactedSection ? ` [Tronçon: ${disrup.impactedSection}]` : ''
      }${disrup.estimatedResolution ? ` • ${disrup.estimatedResolution}` : ''}`;

      // 24 heures de TTL renouvelables (garantie 24h d'affichage pour les fermetures préfecture et grèves)
      const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

      if (!existing) {
        const newIncident: Incident = {
          id: incidentId,
          lat: disrup.lat,
          lng: disrup.lng,
          lon: disrup.lng,
          location_name: locationName,
          severity,
          category,
          description: fullDescription,
          source: 'Info Trafic RATP / SNCF Officiel',
          reports_count: 1,
          upvotes: 1,
          downvotes: 0,
          reliability_score: 0.95,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const created = await incidentRepository.saveDirect(newIncident);
        broadcastNewIncident(created);
        createdCount++;
      } else {
        const updated = await incidentRepository.update(existing.id, {
          severity,
          category,
          description: fullDescription,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        });
        if (updated) {
          broadcastIncidentUpdated(updated);
          updatedCount++;
        }
      }
    }

    this.lastSyncTime = new Date().toISOString();
    console.log(
      `🚆 [Transit Automation] Synchronisation terminée : ${disruptions.length} alertes analysées (${createdCount} créées, ${updatedCount} mises à jour).`
    );

    return {
      success: true,
      syncedCount: disruptions.length,
      createdCount,
      updatedCount,
      timestamp: this.lastSyncTime,
    };
  }

  /**
   * Démarre la tâche de fond automatique (toutes les X minutes)
   */
  startPolling(intervalMinutes: number = 5): void {
    if (this.isPollingActive) {
      console.warn('⚠️ [Transit Automation] Le polling est déjà en cours.');
      return;
    }

    this.isPollingActive = true;
    console.log(`⏱️ [Transit Automation] Surveillance automatique active (intervalle: ${intervalMinutes} min)`);

    // Synchronisation immédiate au démarrage
    this.syncDisruptionsToIncidents().catch((err) => {
      console.error('❌ [Transit Automation] Erreur synchronisation initiale:', err);
    });

    // Planification récurrente
    this.pollIntervalTimer = setInterval(() => {
      this.syncDisruptionsToIncidents().catch((err) => {
        console.error('❌ [Transit Automation] Erreur synchronisation récurrente:', err);
      });
    }, intervalMinutes * 60 * 1000);

    if (this.pollIntervalTimer && typeof this.pollIntervalTimer.unref === 'function') {
      this.pollIntervalTimer.unref();
    }
  }

  /**
   * Arrête le polling automatique
   */
  stopPolling(): void {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
    this.isPollingActive = false;
    console.log('🛑 [Transit Automation] Surveillance automatique arrêtée.');
  }

  getStatus() {
    return {
      isPollingActive: this.isPollingActive,
      lastSyncTime: this.lastSyncTime,
    };
  }
}

export const transitAutomationService = new TransitAutomationService();
