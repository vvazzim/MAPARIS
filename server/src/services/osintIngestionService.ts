import { geocodingService } from './geocodingService.js';
import { incidentRepository } from '../repositories/incidentRepository.js';
import { broadcastNewIncident } from '../sockets/socketHandler.js';
import { Incident, Severity, IncidentCategory } from '../types/index.js';

export interface RawOSINTMessage {
  id: string;
  source: string;
  author: string;
  text: string;
  timestamp: string;
  channel?: string;
}

export interface IngestedOSINTResult {
  raw: RawOSINTMessage;
  parsedLocation: string;
  detectedSeverity: Severity;
  detectedCategory: IncidentCategory;
  incident: Incident;
}

// Dictionnaire de lieux & repères parisiens fréquents
const PARIS_HOTSPOTS = [
  'Place de la République',
  'Place de la Bastille',
  'Place de la Nation',
  'Place de la Concorde',
  'Place d\'Italie',
  'Châtelet',
  'Gare de Lyon',
  'Gare du Nord',
  'Gare de l\'Est',
  'Gare Montparnasse',
  'Gare Saint-Lazare',
  'Boulevard Saint-Germain',
  'Boulevard Voltaire',
  'Boulevard Saint-Michel',
  'Avenue des Champs-Élysées',
  'Place de Clichy',
  'Strasbourg - Saint-Denis',
  'Porte de Bagnolet',
  'Porte de Saint-Ouen',
  'Place Vendôme',
];

// Mots-clés de classification de sévérité
const DANGER_KEYWORDS = [
  'lacrymo', 'lacrymogène', 'mortier', 'charge', 'feux', 'feu', 'barricade',
  'affrontement', 'projectile', 'incendie', 'black bloc', 'vitrine', 'dégradation',
  'caillassage', 'canon à eau', 'grenade'
];

const WARNING_KEYWORDS = [
  'nasse', 'filtrage', 'blocage', 'cortège', 'rassemblement', 'tension',
  'présence policière', 'fdo', 'crs', 'gendarmerie', 'ralentissement',
  'station fermée', 'accès bloqué', 'mouvement de foule', 'vigilance'
];

const SAFE_KEYWORDS = [
  'calme', 'dispersion', 'fin de rassemblement', 'trafic fluide', 'réouverture',
  'circulation normale', 'évacuation sans heurt', 'dégagé', 'aucun incident'
];

export class OSINTIngestionService {
  private rawLogs: IngestedOSINTResult[] = [];
  private isAutoIngestionRunning = false;
  private autoInterval: NodeJS.Timeout | null = null;

  /**
   * Analyse automatique d'un message brut OSINT (NLP heuristique)
   */
  parseMessage(text: string): {
    location: string;
    severity: Severity;
    category: IncidentCategory;
  } {
    const lower = text.toLowerCase();

    // 1. Détection de la localisation
    let matchedLocation = 'Centre de Paris';
    for (const spot of PARIS_HOTSPOTS) {
      const spotLower = spot.toLowerCase();
      if (lower.includes(spotLower)) {
        matchedLocation = `${spot}, Paris`;
        break;
      }
    }

    // Si aucun point d'intérêt strict n'est trouvé, recherche par regex de rue/boulevard/avenue
    if (matchedLocation === 'Centre de Paris') {
      const streetMatch = text.match(/(?:boulevard|rue|avenue|place|porte|quai)\s+[a-zÀ-ÿ\-'\s]{3,25}/i);
      if (streetMatch) {
        matchedLocation = `${streetMatch[0].trim()}, Paris`;
      }
    }

    // 2. Détection de la sévérité
    let severity: Severity = 'warning';
    const isDanger = DANGER_KEYWORDS.some((kw) => lower.includes(kw));
    const isSafe = SAFE_KEYWORDS.some((kw) => lower.includes(kw));

    if (isDanger) {
      severity = 'danger';
    } else if (isSafe && !isDanger) {
      severity = 'safe';
    }

    // 3. Détection de la catégorie
    let category: IncidentCategory = 'autre';
    if (lower.includes('station') || lower.includes('métro') || lower.includes('rer')) {
      category = 'fermeture_station';
    } else if (lower.includes('feu') || lower.includes('vitrine') || lower.includes('dégradation')) {
      category = 'degradation';
    } else if (lower.includes('blocage') || lower.includes('barricade')) {
      category = 'blocage';
    } else if (isDanger || lower.includes('charge') || lower.includes('crs')) {
      category = 'tension';
    } else if (lower.includes('manif') || lower.includes('cortège') || lower.includes('syndicat')) {
      category = 'manifestation';
    } else if (isSafe) {
      category = 'calme';
    }

    return { location: matchedLocation, severity, category };
  }

  /**
   * Pipeline complet : Parsing -> Géocodage BAN -> Enregistrement -> Broadcast Socket.io
   */
  async ingest(message: RawOSINTMessage): Promise<IngestedOSINTResult> {
    const { location, severity, category } = this.parseMessage(message.text);

    // Géocodage automatique via BAN
    const geo = await geocodingService.geocodeAddress(location);

    // Enregistrement de l'incident (description concise limitée à 160 caractères)
    const incident = await incidentRepository.create({
      lat: geo.lat,
      lng: geo.lng,
      location_name: geo.label,
      severity,
      category,
      description: message.text.slice(0, 160),
      source: `${message.source} (${message.author})`,
    });

    // Score initial plus élevé pour les sources d'information réputées
    if (message.source.includes('Préfecture') || message.source.includes('RATP')) {
      incident.reliability_score = 0.95;
      incident.upvotes = 15;
    }

    // Diffusion immédiate WebSockets
    broadcastNewIncident(incident);

    const result: IngestedOSINTResult = {
      raw: message,
      parsedLocation: location,
      detectedSeverity: severity,
      detectedCategory: category,
      incident,
    };

    this.rawLogs.unshift(result);
    if (this.rawLogs.length > 100) this.rawLogs.pop();

    console.log(`📡 [OSINT Pipeline] Message ingéré depuis [${message.source}] : "${geo.label}" [${severity.toUpperCase()}]`);
    return result;
  }

  /**
   * Déclenche une alerte de simulation réaliste pour tester en direct
   */
  async simulateIncomingEvent(): Promise<IngestedOSINTResult> {
    const mockFeeds: Array<{ source: string; author: string; text: string }> = [
      {
        source: 'Telegram OSINT',
        author: '@ParisManifDirect',
        text: 'Tensions en cours Place de la Nation : barricade enflammée et gaz lacrymogènes en tête de cortège. Évitez le secteur.',
      },
      {
        source: 'Twitter / X',
        author: '@AlertesIDF75',
        text: 'Fort dispositif policier et filtrages des sacs boulevard Saint-Michel aux abords du Sénat. Circulation des bus déviée.',
      },
      {
        source: 'Telegram OSINT',
        author: '@SecuriteParisLive',
        text: 'Dégradations signalées boulevard Voltaire : tirs de mortiers d\'artifice et feux de poubelles.',
      },
      {
        source: 'RATP Alert',
        author: '@RATP_Ligne1',
        text: 'Mesure de sécurité RATP : la station Châtelet ferme temporairement ses accès nord suite à un flux exceptionnel.',
      },
      {
        source: 'Préfecture de Police',
        author: '@prefpolice',
        text: 'Fin des opérations de sécurisation Place de la Concorde : dispersion calme des manifestants, trafic routier rétabli.',
      },
      {
        source: 'Twitter / X',
        author: '@InfoCirculationParis',
        text: 'Blocage spontané d\'une voie par des tracteurs et manifestants à Porte de Saint-Ouen. Embouteillages majeurs.',
      },
    ];

    const pick = mockFeeds[Math.floor(Math.random() * mockFeeds.length)];
    const raw: RawOSINTMessage = {
      id: `osint-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source: pick.source,
      author: pick.author,
      text: pick.text,
      timestamp: new Date().toISOString(),
    };

    return this.ingest(raw);
  }

  getLogs(): IngestedOSINTResult[] {
    return this.rawLogs;
  }

  startAutoSimulation(intervalMs: number = 30000) {
    if (this.isAutoIngestionRunning) return;
    this.isAutoIngestionRunning = true;
    this.autoInterval = setInterval(() => {
      this.simulateIncomingEvent().catch((err) => {
        console.error('[OSINT Auto] Erreur simulation:', err.message);
      });
    }, intervalMs);
    console.log(`🤖 [OSINT Pipeline] Simulation automatique démarrée (intervalle ${intervalMs}ms)`);
  }

  stopAutoSimulation() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
    this.isAutoIngestionRunning = false;
    console.log('🛑 [OSINT Pipeline] Simulation automatique arrêtée.');
  }

  isAutoRunning(): boolean {
    return this.isAutoIngestionRunning;
  }
}

export const osintIngestionService = new OSINTIngestionService();
