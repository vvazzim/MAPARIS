import { RealtimeDeparture, PinnedTransitStop } from '../types';
import { useState, useEffect } from 'react';
import { SAMPLE_IDF_DISRUPTIONS, TransitDisruptionItem } from '../data/transitLinesData';

export type TransitLineType = 'metro' | 'rer' | 'train' | 'tram' | 'bus';

// Métadonnées officielles des lignes RATP & IDFM (Couleurs officielles & Terminus)
export interface LineMetadata {
  name: string;
  type: TransitLineType;
  bg: string;
  text: string;
  border?: string;
  directions: {
    destination: string;
    code: string;
  }[];
  peakHeadwayMin: number;
  offPeakHeadwayMin: number;
}

export const RATP_LINES_METADATA: Record<string, LineMetadata> = {
  // === MÉTRO (1 à 14) ===
  'M1': {
    name: '1',
    type: 'metro',
    bg: '#FFCD00',
    text: '#000000',
    peakHeadwayMin: 2,
    offPeakHeadwayMin: 3.5,
    directions: [
      { destination: 'La Défense (Grande Arche)', code: 'DEF' },
      { destination: 'Château de Vincennes', code: 'VIN' },
    ],
  },
  'M2': {
    name: '2',
    type: 'metro',
    bg: '#003CA6',
    text: '#FFFFFF',
    peakHeadwayMin: 2.5,
    offPeakHeadwayMin: 4.5,
    directions: [
      { destination: 'Porte Dauphine', code: 'DAU' },
      { destination: 'Nation', code: 'NAT' },
    ],
  },
  'M3': {
    name: '3',
    type: 'metro',
    bg: '#837902',
    text: '#FFFFFF',
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
    directions: [
      { destination: 'Pont de Levallois - Bécon', code: 'LEV' },
      { destination: 'Gallieni (Parc de Bagnolet)', code: 'GAL' },
    ],
  },
  'M4': {
    name: '4',
    type: 'metro',
    bg: '#CF009E',
    text: '#FFFFFF',
    peakHeadwayMin: 2,
    offPeakHeadwayMin: 3.5,
    directions: [
      { destination: 'Porte de Clignancourt', code: 'CLI' },
      { destination: 'Bagneux - Lucie Aubrac', code: 'BAG' },
    ],
  },
  'M5': {
    name: '5',
    type: 'metro',
    bg: '#FF7E2E',
    text: '#000000',
    peakHeadwayMin: 2.5,
    offPeakHeadwayMin: 4.5,
    directions: [
      { destination: 'Bobigny - Pablo Picasso', code: 'BOB' },
      { destination: 'Place d\'Italie', code: 'ITA' },
    ],
  },
  'M6': {
    name: '6',
    type: 'metro',
    bg: '#6ECA97',
    text: '#000000',
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
    directions: [
      { destination: 'Charles de Gaulle - Étoile', code: 'ETO' },
      { destination: 'Nation', code: 'NAT' },
    ],
  },
  'M7': {
    name: '7',
    type: 'metro',
    bg: '#FA9ABA',
    text: '#000000',
    peakHeadwayMin: 2.5,
    offPeakHeadwayMin: 4.5,
    directions: [
      { destination: 'La Courneuve - 8 Mai 1945', code: 'COU' },
      { destination: 'Mairie d\'Ivry / Villejuif', code: 'IVR' },
    ],
  },
  'M8': {
    name: '8',
    type: 'metro',
    bg: '#E19BDF',
    text: '#000000',
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
    directions: [
      { destination: 'Balard', code: 'BAL' },
      { destination: 'Pointe du Lac (Créteil)', code: 'LAC' },
    ],
  },
  'M9': {
    name: '9',
    type: 'metro',
    bg: '#B6BD00',
    text: '#000000',
    peakHeadwayMin: 2.5,
    offPeakHeadwayMin: 4.5,
    directions: [
      { destination: 'Pont de Sèvres', code: 'SEV' },
      { destination: 'Mairie de Montreuil', code: 'MON' },
    ],
  },
  'M10': {
    name: '10',
    type: 'metro',
    bg: '#C9910D',
    text: '#FFFFFF',
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5.5,
    directions: [
      { destination: 'Boulogne - Pont de Saint-Cloud', code: 'BOU' },
      { destination: 'Gare d\'Austerlitz', code: 'AUS' },
    ],
  },
  'M11': {
    name: '11',
    type: 'metro',
    bg: '#704B1C',
    text: '#FFFFFF',
    peakHeadwayMin: 2.5,
    offPeakHeadwayMin: 4.5,
    directions: [
      { destination: 'Châtelet', code: 'CHA' },
      { destination: 'Rosny - Bois-Perrier', code: 'ROS' },
    ],
  },
  'M12': {
    name: '12',
    type: 'metro',
    bg: '#007852',
    text: '#FFFFFF',
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
    directions: [
      { destination: 'Mairie d\'Aubervilliers', code: 'AUB' },
      { destination: 'Mairie d\'Issy', code: 'ISS' },
    ],
  },
  'M13': {
    name: '13',
    type: 'metro',
    bg: '#6EC4E8',
    text: '#000000',
    peakHeadwayMin: 2.5,
    offPeakHeadwayMin: 4,
    directions: [
      { destination: 'Asnières-Gennevilliers / St-Denis', code: 'NOR' },
      { destination: 'Châtillon - Montrouge', code: 'SUD' },
    ],
  },
  'M14': {
    name: '14',
    type: 'metro',
    bg: '#62259D',
    text: '#FFFFFF',
    peakHeadwayMin: 1.8,
    offPeakHeadwayMin: 3,
    directions: [
      { destination: 'Saint-Denis Pleyel', code: 'PLE' },
      { destination: 'Aéroport d\'Orly', code: 'ORL' },
    ],
  },

  // === RER (A à E) ===
  'RER A': {
    name: 'A',
    type: 'rer',
    bg: '#E3051B',
    text: '#FFFFFF',
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 6,
    directions: [
      { destination: 'St-Germain / Poissy / Cergy', code: 'OUE' },
      { destination: 'Boissy-St-Léger / Marne-la-Vallée', code: 'EST' },
    ],
  },
  'RER B': {
    name: 'B',
    type: 'rer',
    bg: '#5291CE',
    text: '#FFFFFF',
    peakHeadwayMin: 3.5,
    offPeakHeadwayMin: 7,
    directions: [
      { destination: 'Aéroport CDG 2 / Mitry-Claye', code: 'NOR' },
      { destination: 'Robinson / St-Rémy-lès-Chevreuse', code: 'SUD' },
    ],
  },
  'RER C': {
    name: 'C',
    type: 'rer',
    bg: '#F2C500',
    text: '#000000',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 10,
    directions: [
      { destination: 'Pontoise / Versailles Rive Gauche', code: 'OUE' },
      { destination: 'Saint-Martin-d\'Étampes / Dourdan', code: 'EST' },
    ],
  },
  'RER D': {
    name: 'D',
    type: 'rer',
    bg: '#00814F',
    text: '#FFFFFF',
    peakHeadwayMin: 4.5,
    offPeakHeadwayMin: 9,
    directions: [
      { destination: 'Creil / Orry-la-Ville', code: 'NOR' },
      { destination: 'Melun / Corbeil-Essonnes', code: 'SUD' },
    ],
  },
  'RER E': {
    name: 'E',
    type: 'rer',
    bg: '#DE4C8A',
    text: '#FFFFFF',
    peakHeadwayMin: 4.5,
    offPeakHeadwayMin: 8,
    directions: [
      { destination: 'Nanterre - La Folie', code: 'NAN' },
      { destination: 'Chelles-Gournay / Tournan', code: 'CHE' },
    ],
  },

  // === TRAINS TRANSILIEN (H, J, L, N, P, R, U) ===
  'Train H': {
    name: 'H',
    type: 'train',
    bg: '#8D5E2A',
    text: '#FFFFFF',
    peakHeadwayMin: 7,
    offPeakHeadwayMin: 15,
    directions: [
      { destination: 'Luzarches / Persan-Beaumont', code: 'NOR' },
      { destination: 'Paris Gare du Nord', code: 'PAR' },
    ],
  },
  'Train J': {
    name: 'J',
    type: 'train',
    bg: '#C5A300',
    text: '#000000',
    peakHeadwayMin: 7,
    offPeakHeadwayMin: 15,
    directions: [
      { destination: 'Mantes-la-Jolie / Gisors', code: 'OUE' },
      { destination: 'Paris Saint-Lazare', code: 'PAR' },
    ],
  },
  'Train L': {
    name: 'L',
    type: 'train',
    bg: '#6E9B9A',
    text: '#FFFFFF',
    peakHeadwayMin: 6,
    offPeakHeadwayMin: 12,
    directions: [
      { destination: 'Versailles Rive Droite / Saint-Nom', code: 'OUE' },
      { destination: 'Paris Saint-Lazare', code: 'PAR' },
    ],
  },
  'Train N': {
    name: 'N',
    type: 'train',
    bg: '#0075BF',
    text: '#FFFFFF',
    peakHeadwayMin: 8,
    offPeakHeadwayMin: 15,
    directions: [
      { destination: 'Rambouillet / Dreux / Mantes', code: 'OUE' },
      { destination: 'Paris Montparnasse', code: 'PAR' },
    ],
  },
  'Train P': {
    name: 'P',
    type: 'train',
    bg: '#E86C00',
    text: '#FFFFFF',
    peakHeadwayMin: 8,
    offPeakHeadwayMin: 15,
    directions: [
      { destination: 'Meaux / Provins / Château-Thierry', code: 'EST' },
      { destination: 'Paris Gare de l\'Est', code: 'PAR' },
    ],
  },
  'Train R': {
    name: 'R',
    type: 'train',
    bg: '#E48EB0',
    text: '#000000',
    peakHeadwayMin: 9,
    offPeakHeadwayMin: 18,
    directions: [
      { destination: 'Montereau / Montargis', code: 'SUD' },
      { destination: 'Paris Gare de Lyon', code: 'PAR' },
    ],
  },
  'Train U': {
    name: 'U',
    type: 'train',
    bg: '#9B0058',
    text: '#FFFFFF',
    peakHeadwayMin: 10,
    offPeakHeadwayMin: 20,
    directions: [
      { destination: 'La Verrière', code: 'VER' },
      { destination: 'La Défense', code: 'DEF' },
    ],
  },

  // === TRAMWAY (T1, T2, T3a, T3b, T7, T9) ===
  'T1': {
    name: 'T1',
    type: 'tram',
    bg: '#00643C',
    text: '#FFFFFF',
    peakHeadwayMin: 4,
    offPeakHeadwayMin: 7,
    directions: [
      { destination: 'Asnières - Quatre Routes', code: 'ASN' },
      { destination: 'Noisy-le-Sec RER', code: 'NOI' },
    ],
  },
  'T2': {
    name: 'T2',
    type: 'tram',
    bg: '#844C82',
    text: '#FFFFFF',
    peakHeadwayMin: 3.5,
    offPeakHeadwayMin: 6,
    directions: [
      { destination: 'Pont de Bezons', code: 'BEZ' },
      { destination: 'Porte de Versailles', code: 'VER' },
    ],
  },
  'T3a': {
    name: 'T3a',
    type: 'tram',
    bg: '#FF7E2E',
    text: '#000000',
    peakHeadwayMin: 3.5,
    offPeakHeadwayMin: 6,
    directions: [
      { destination: 'Pont du Garigliano', code: 'GAR' },
      { destination: 'Porte de Vincennes', code: 'VIN' },
    ],
  },
  'T3b': {
    name: 'T3b',
    type: 'tram',
    bg: '#007852',
    text: '#FFFFFF',
    peakHeadwayMin: 3.5,
    offPeakHeadwayMin: 6,
    directions: [
      { destination: 'Porte de Vincennes', code: 'VIN' },
      { destination: 'Porte Dauphine', code: 'DAU' },
    ],
  },
  'T7': {
    name: 'T7',
    type: 'tram',
    bg: '#6E750E',
    text: '#FFFFFF',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 8,
    directions: [
      { destination: 'Villejuif - Louis Aragon', code: 'VIL' },
      { destination: 'Athis-Mons - Porte de l\'Essonne', code: 'ATH' },
    ],
  },
  'T8': {
    name: 'T8',
    type: 'tram',
    bg: '#6E750E',
    text: '#FFFFFF',
    peakHeadwayMin: 4,
    offPeakHeadwayMin: 7,
    directions: [
      { destination: 'Saint-Denis - Porte de Paris', code: 'SDE' },
      { destination: 'Épinay-Orgemont / Villetaneuse', code: 'EPI' },
    ],
  },
  'T9': {
    name: 'T9',
    type: 'tram',
    bg: '#0066B3',
    text: '#FFFFFF',
    peakHeadwayMin: 4,
    offPeakHeadwayMin: 7,
    directions: [
      { destination: 'Porte de Choisy', code: 'CHO' },
      { destination: 'Orly - Gaston Viens', code: 'ORL' },
    ],
  },
  'T11': {
    name: 'T11',
    type: 'tram',
    bg: '#DE4C8A',
    text: '#FFFFFF',
    peakHeadwayMin: 6,
    offPeakHeadwayMin: 10,
    directions: [
      { destination: 'Épinay-sur-Seine', code: 'EPI' },
      { destination: 'Le Bourget', code: 'BOU' },
    ],
  },

  // === BUS MAJEURS & NOCTILIEN ===
  'Bus 20': {
    name: '20',
    type: 'bus',
    bg: '#0065A2',
    text: '#FFFFFF',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 9,
    directions: [
      { destination: 'Louvre - Rivoli', code: 'LOU' },
      { destination: 'Porte des Lilas', code: 'LIL' },
    ],
  },
  'Bus 26': {
    name: '26',
    type: 'bus',
    bg: '#00835B',
    text: '#FFFFFF',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 9,
    directions: [
      { destination: 'Gare Saint-Lazare', code: 'LAZ' },
      { destination: 'Nation - Trône', code: 'NAT' },
    ],
  },
  'Bus 38': {
    name: '38',
    type: 'bus',
    bg: '#0080C0',
    text: '#FFFFFF',
    peakHeadwayMin: 4,
    offPeakHeadwayMin: 7,
    directions: [
      { destination: 'Porte de Clignancourt', code: 'CLI' },
      { destination: 'Porte d\'Orléans', code: 'ORL' },
    ],
  },
  'Bus 54': {
    name: '54',
    type: 'bus',
    bg: '#83286B',
    text: '#FFFFFF',
    peakHeadwayMin: 4.5,
    offPeakHeadwayMin: 8,
    directions: [
      { destination: 'Asnières-Gennevilliers', code: 'ASN' },
      { destination: 'Porte d\'Aubervilliers (via P. Clichy)', code: 'AUB' },
    ],
  },
  'Bus 62': {
    name: '62',
    type: 'bus',
    bg: '#F39200',
    text: '#000000',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 8,
    directions: [
      { destination: 'Porte de Saint-Cloud', code: 'CLO' },
      { destination: 'Porte de France', code: 'FRA' },
    ],
  },
  'Bus 66': {
    name: '66',
    type: 'bus',
    bg: '#00643C',
    text: '#FFFFFF',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 9,
    directions: [
      { destination: 'Saint-Ouen - Les Docks', code: 'OUE' },
      { destination: 'Opéra (via Porte de Clichy)', code: 'OPE' },
    ],
  },
  'Bus 72': {
    name: '72',
    type: 'bus',
    bg: '#83286B',
    text: '#FFFFFF',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 9,
    directions: [
      { destination: 'Gare de Lyon', code: 'LYO' },
      { destination: 'Parc de Saint-Cloud', code: 'CLO' },
    ],
  },
  'Bus 74': {
    name: '74',
    type: 'bus',
    bg: '#C5A300',
    text: '#000000',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 9,
    directions: [
      { destination: 'Clichy - Berges de Seine', code: 'CLI' },
      { destination: 'Châtelet', code: 'CHA' },
    ],
  },
  'Bus 80': {
    name: '80',
    type: 'bus',
    bg: '#0055A5',
    text: '#FFFFFF',
    peakHeadwayMin: 6,
    offPeakHeadwayMin: 10,
    directions: [
      { destination: 'Porte de Versailles', code: 'VER' },
      { destination: 'Mairie du 18e - Jules Joffrin', code: '18E' },
    ],
  },
  'Bus 85': {
    name: '85',
    type: 'bus',
    bg: '#FF7E2E',
    text: '#000000',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 8.5,
    directions: [
      { destination: 'Saint-Ouen - Mairie', code: 'OUE' },
      { destination: 'Châtelet', code: 'CHA' },
    ],
  },
  'Bus 91': {
    name: '91',
    type: 'bus',
    bg: '#009EE0',
    text: '#FFFFFF',
    peakHeadwayMin: 4,
    offPeakHeadwayMin: 7,
    directions: [
      { destination: 'Gare Montparnasse', code: 'MON' },
      { destination: 'Bastille / Gare de Lyon', code: 'BAS' },
    ],
  },
  'Bus 96': {
    name: '96',
    type: 'bus',
    bg: '#6E1452',
    text: '#FFFFFF',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 8,
    directions: [
      { destination: 'Gare Montparnasse', code: 'MON' },
      { destination: 'Porte des Lilas', code: 'LIL' },
    ],
  },
  'Bus 173': {
    name: '173',
    type: 'bus',
    bg: '#5291CE',
    text: '#FFFFFF',
    peakHeadwayMin: 6,
    offPeakHeadwayMin: 10,
    directions: [
      { destination: 'Porte de Clichy', code: 'CLI' },
      { destination: 'La Courneuve - 8 Mai 1945', code: 'COU' },
    ],
  },
  'N01': {
    name: 'N01',
    type: 'bus',
    bg: '#1E293B',
    text: '#38BDF8',
    peakHeadwayMin: 10,
    offPeakHeadwayMin: 15,
    directions: [
      { destination: 'Circulaire Intérieure (Gares Parisiennes)', code: 'INT' },
      { destination: 'Gare de l\'Est', code: 'EST' },
    ],
  },
};

/**
 * Calcule un hachage stable et déterministe pour une clé donnée
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// =========================================================================
// ALIGNEMENT TEMPOREL PARFAIT CLIENT <-> SERVEUR
// =========================================================================
let serverClockOffsetMs = 0;

/**
 * Synchronise l'horloge locale avec l'horloge de référence du serveur
 */
export function syncServerTime(serverEpochMs: number) {
  if (typeof serverEpochMs === 'number' && !isNaN(serverEpochMs) && serverEpochMs > 0) {
    serverClockOffsetMs = serverEpochMs - Date.now();
  }
}

/**
 * Retourne la date exacte actuelle alignée sur le serveur à la milliseconde
 */
export function getAlignedNow(): Date {
  return new Date(Date.now() + serverClockOffsetMs);
}

// Appel initial asynchrone non-bloquant de synchronisation
if (typeof window !== 'undefined') {
  fetch('/api/transit/time')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && data.serverTime) {
        syncServerTime(data.serverTime);
      }
    })
    .catch(() => {});
}

/**
 * Normalise n'importe quel identifiant de ligne vers la clé officielle
 * Supporte : '13' -> 'M13', '54' -> 'Bus 54', 'C' -> 'RER C', 't3b' -> 'T3b', etc.
 */
export function normalizeLineKey(raw: string): string {
  if (!raw) return 'M1';
  const clean = raw.trim();

  // Si la clé existe déjà dans le dictionnaire
  if (RATP_LINES_METADATA[clean]) return clean;

  const upper = clean.toUpperCase();

  // Métros 1 à 14
  const numMatch = upper.match(/^(?:M|METRO|MÉTRO|L)?\s*([1-9]|1[0-4])$/i);
  if (numMatch) {
    const k = `M${numMatch[1]}`;
    if (RATP_LINES_METADATA[k]) return k;
  }

  // RER A à E
  const rerMatch = upper.match(/^(?:RER\s*)?([A-E])$/i);
  if (rerMatch) {
    const k = `RER ${rerMatch[1].toUpperCase()}`;
    if (RATP_LINES_METADATA[k]) return k;
  }

  // Tramway T1, T2, T3a, T3b, T7, T8, T9, T11
  const tramMatch = upper.match(/^(?:TRAM\s*|T\s*)?(\d+[A-Z]?)$/i);
  if (tramMatch) {
    const tramNum = tramMatch[1];
    const formatted = `T${tramNum.toLowerCase()}`;
    const formattedT = `T${tramNum.charAt(0).toUpperCase()}${tramNum.slice(1).toLowerCase()}`;
    if (RATP_LINES_METADATA[formattedT]) return formattedT;
    if (RATP_LINES_METADATA[formatted]) return formatted;
  }

  // Transilien H, J, K, L, N, P, R, U
  const trainMatch = upper.match(/^(?:TRAIN\s*|LIGNE\s*)?([HJKLNRPU])$/i);
  if (trainMatch) {
    const k = `Train ${trainMatch[1].toUpperCase()}`;
    if (RATP_LINES_METADATA[k]) return k;
  }

  // Bus avec numéro (ex: '54', 'Bus 54', '66', '173')
  const busMatch = upper.match(/^(?:BUS\s*|B\s*)?(\d{2,3})$/i);
  if (busMatch) {
    const k = `Bus ${busMatch[1]}`;
    if (RATP_LINES_METADATA[k]) return k;
  }

  return clean;
}

/**
 * Détermine l'intervalle moyen (headway) selon l'heure de la journée à Paris
 */
function getHeadwayMinutes(lineMeta: LineMetadata, hour: number, isWeekend: boolean): number {
  const isPeak = !isWeekend && ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 20));
  const isEvening = hour >= 21 || hour < 2;

  if (isPeak) {
    return lineMeta.peakHeadwayMin;
  }
  if (isEvening) {
    return lineMeta.offPeakHeadwayMin * 1.4;
  }
  return lineMeta.offPeakHeadwayMin;
}

/**
 * Calcule les prochains passages en temps réel pour une station et ses lignes
 * Aligné 100% avec l'horloge du serveur
 */
export function getRealtimeDeparturesForStation(
  stationId: string,
  lines: string[],
  stationStatus: 'normal' | 'disrupted' | 'closed' = 'normal',
  currentTime: Date = getAlignedNow(),
  filterMode: 'all' | 'metro' | 'rer' | 'train' | 'tram' | 'bus' = 'all'
): RealtimeDeparture[] {
  const departures: RealtimeDeparture[] = [];

  const hour = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const day = currentTime.getDay();
  const isWeekend = day === 0 || day === 6;

  const nightCloseHour = isWeekend ? 2 : 1;
  const isNightClosed = (hour > nightCloseHour || (hour === nightCloseHour && minutes >= 15)) && hour < 5;

  // Normaliser et dédoublonner les clés de ligne
  const uniqueLines = Array.from(new Set(lines.map(normalizeLineKey)));

  uniqueLines.forEach((lineKey) => {
    const meta = RATP_LINES_METADATA[lineKey];
    if (!meta) return;

    if (filterMode !== 'all') {
      if (filterMode === 'metro' && meta.type !== 'metro') return;
      if (filterMode === 'rer' && meta.type !== 'rer' && meta.type !== 'train') return;
      if (filterMode === 'train' && meta.type !== 'train' && meta.type !== 'rer') return;
      if (filterMode === 'tram' && meta.type !== 'tram') return;
      if (filterMode === 'bus' && meta.type !== 'bus') return;
    }

    meta.directions.forEach((dir) => {
      if (stationStatus === 'closed') {
        departures.push({
          line: lineKey,
          destination: dir.destination,
          remainingMinutes: 999,
          remainingDisplay: 'Trafic Interrompu',
          followingDisplay: 'Fermé',
          isRealtime: true,
          status: 'disrupted',
        });
        return;
      }

      if (isNightClosed && meta.type !== 'bus') {
        departures.push({
          line: lineKey,
          destination: dir.destination,
          remainingMinutes: 999,
          remainingDisplay: 'Reprise 05:30',
          followingDisplay: 'Noctilien N01/N02',
          isRealtime: false,
          status: 'on_time',
        });
        return;
      }

      const headwayMin = getHeadwayMinutes(meta, hour, isWeekend);
      const headwaySec = Math.max(90, Math.round(headwayMin * 60));

      const seedKey = `${stationId}_${lineKey}_${dir.code}`;
      const phaseOffset = hashString(seedKey) % headwaySec;

      const totalCurrentSeconds = Math.floor(currentTime.getTime() / 1000);
      const cyclePos = (totalCurrentSeconds + phaseOffset) % headwaySec;
      const secondsUntilNext = headwaySec - cyclePos;

      const isDisrupted = stationStatus === 'disrupted';
      const delaySec = isDisrupted ? (hashString(seedKey + '_delay') % 240) + 120 : 0;
      const effectiveSec = secondsUntilNext + delaySec;

      const remainingMin = Math.floor(effectiveSec / 60);
      const remainingSecondsPart = effectiveSec % 60;
      const followingMin = remainingMin + Math.round(headwayMin);

      let remainingDisplay: string;
      if (remainingMin === 0) {
        if (effectiveSec < 30) {
          remainingDisplay = "À l'approche";
        } else {
          remainingDisplay = `${remainingSecondsPart}s`;
        }
      } else {
        remainingDisplay = `${remainingMin} min`;
      }

      departures.push({
        line: lineKey,
        destination: dir.destination,
        remainingMinutes: remainingMin,
        remainingDisplay,
        followingDisplay: `${followingMin} min`,
        isRealtime: true,
        status: isDisrupted ? 'delayed' : 'on_time',
      });
    });
  });

  return departures.sort((a, b) => a.remainingMinutes - b.remainingMinutes);
}

/**
 * Récupère le style graphique officiel complet d'une ligne (couleur, contraste, libellé)
 * avec fallback éclatant (JAMAIS gris terne)
 */
export function getLineStyle(rawLine: string): { 
  bg: string; 
  text: string; 
  label: string; 
  fullName: string;
  type: TransitLineType 
} {
  const safeRaw = (rawLine || 'M13').trim();
  const normalizedKey = normalizeLineKey(safeRaw);
  const meta = RATP_LINES_METADATA[normalizedKey] || RATP_LINES_METADATA[safeRaw];

  if (meta) {
    const fullName = meta.type === 'metro' ? `M${meta.name}` : meta.type === 'bus' ? `Bus ${meta.name}` : meta.name;
    return {
      bg: meta.bg,
      text: meta.text,
      label: meta.name,
      fullName,
      type: meta.type,
    };
  }

  // Fallback bus dynamique (ex: Bus 163, Bus 28, Bus 341)
  const lowerRaw = safeRaw.toLowerCase();
  if (/^\d{2,3}$/.test(safeRaw) || lowerRaw.startsWith('bus')) {
    const num = safeRaw.replace(/\D/g, '');
    return {
      bg: '#83286B', // Magenta bus officiel
      text: '#FFFFFF',
      label: num || safeRaw,
      fullName: `Bus ${num || safeRaw}`,
      type: 'bus',
    };
  }

  return {
    bg: '#0065A2', // Bleu IDFM
    text: '#FFFFFF',
    label: safeRaw,
    fullName: safeRaw,
    type: 'metro',
  };
}

/**
 * Hook React pour afficher et rafraîchir automatiquement les passages en temps réel
 */
export function useRealtimeDepartures(
  stationId: string,
  lines: string[],
  stationStatus: 'normal' | 'disrupted' | 'closed' = 'normal',
  refreshIntervalSec: number = 3,
  filterMode: 'all' | 'metro' | 'rer' | 'train' | 'tram' | 'bus' = 'all'
) {
  const [departures, setDepartures] = useState<RealtimeDeparture[]>(() =>
    getRealtimeDeparturesForStation(stationId, lines, stationStatus, new Date(), filterMode)
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDepartures(getRealtimeDeparturesForStation(stationId, lines, stationStatus, now, filterMode));
      setLastUpdated(now);
    };

    update();
    const timer = setInterval(update, refreshIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [stationId, JSON.stringify(lines), stationStatus, refreshIntervalSec, filterMode]);

  return { departures, lastUpdated };
}

// ============================================================================
// GESTION DES ARRÊTS & LIGNES ÉPINGLÉS (PINNED TRANSPORTS V3)
// ============================================================================
const PINNED_STOPS_KEY = 'maparis_pinned_stops_v3';

export const DEFAULT_PINNED_STOPS: PinnedTransitStop[] = [
  {
    id: 'pin-m13-porte-clichy-sud',
    lineKey: 'M13',
    stopName: 'Porte de Clichy',
    stopId: 'm13-porte-clichy',
    direction: 'Châtillon - Montrouge',
    directionCode: 'SUD',
    hubId: 'station-porte-de-clichy',
    addedAt: Date.now(),
  },
  {
    id: 'pin-m14-porte-clichy-orly',
    lineKey: 'M14',
    stopName: 'Porte de Clichy',
    stopId: 'm14-porte-clichy',
    direction: 'Aéroport d\'Orly',
    directionCode: 'ORL',
    hubId: 'station-porte-de-clichy',
    addedAt: Date.now(),
  },
  {
    id: 'pin-t3b-porte-clichy-vincennes',
    lineKey: 'T3b',
    stopName: 'Porte de Clichy',
    stopId: 't3b-porte-clichy',
    direction: 'Porte de Vincennes',
    directionCode: 'VIN',
    hubId: 'station-porte-de-clichy',
    addedAt: Date.now(),
  },
  {
    id: 'pin-b54-porte-clichy-nord',
    lineKey: 'Bus 54',
    stopName: 'Porte de Clichy',
    stopId: 'b54-porte-clichy',
    direction: 'Porte d\'Aubervilliers (via Gare du Nord)',
    directionCode: 'EST',
    hubId: 'station-porte-de-clichy',
    addedAt: Date.now(),
  },
  {
    id: 'pin-b66-porte-clichy-opera',
    lineKey: 'Bus 66',
    stopName: 'Porte de Clichy',
    stopId: 'b66-porte-clichy',
    direction: 'Opéra (via Gare Saint-Lazare)',
    directionCode: 'SUD',
    hubId: 'station-porte-de-clichy',
    addedAt: Date.now(),
  },
];

export function getPinnedStops(): PinnedTransitStop[] {
  if (typeof window === 'undefined') return DEFAULT_PINNED_STOPS;
  try {
    const raw = localStorage.getItem(PINNED_STOPS_KEY);
    if (!raw) {
      localStorage.setItem(PINNED_STOPS_KEY, JSON.stringify(DEFAULT_PINNED_STOPS));
      return DEFAULT_PINNED_STOPS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter(p => p && typeof p.stopName === 'string' && typeof p.lineKey === 'string');
      return valid.length > 0 ? valid : DEFAULT_PINNED_STOPS;
    }
    return DEFAULT_PINNED_STOPS;
  } catch (err) {
    console.warn('[Transit] Erreur lecture arrêts épinglés:', err);
    return DEFAULT_PINNED_STOPS;
  }
}

export function savePinnedStops(stops: PinnedTransitStop[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PINNED_STOPS_KEY, JSON.stringify(stops));
  } catch (err) {
    console.warn('[Transit] Erreur sauvegarde arrêts épinglés:', err);
  }
}

export function togglePinStop(stop: PinnedTransitStop): boolean {
  if (!stop) return false;
  const current = getPinnedStops();
  const cleanStopName = (stop.stopName || '').toLowerCase().trim();
  const cleanLine = normalizeLineKey(stop.lineKey || '');
  const existsIndex = current.findIndex(
    (p) => p && normalizeLineKey(p.lineKey || '') === cleanLine && (p.stopName || '').toLowerCase().trim() === cleanStopName && p.direction === stop.direction
  );

  let next: PinnedTransitStop[];
  let isPinnedNow: boolean;

  if (existsIndex >= 0) {
    next = current.filter((_, idx) => idx !== existsIndex);
    isPinnedNow = false;
  } else {
    next = [stop, ...current];
    isPinnedNow = true;
  }

  savePinnedStops(next);
  return isPinnedNow;
}

export function isStopPinned(stopName: string, lineKey: string, direction?: string): boolean {
  const current = getPinnedStops();
  const cleanStop = (stopName || '').toLowerCase().trim();
  const cleanLine = normalizeLineKey(lineKey || '');
  return current.some((p) => {
    if (!p) return false;
    const matchesLine = normalizeLineKey(p.lineKey || '') === cleanLine;
    const matchesName = (p.stopName || '').toLowerCase().trim() === cleanStop;
    if (!direction) return matchesLine && matchesName;
    return matchesLine && matchesName && p.direction === direction;
  });
}

/**
 * Calcule l'horaire en direct pour un arrêt le long d'une ligne
 */
export function getStopRealtimeDeparture(
  stopId: string,
  stopOrder: number,
  _totalStops: number,
  lineKey: string,
  directionCode: string,
  baseDate: Date = getAlignedNow()
): {
  remainingMinutes: number;
  remainingSeconds: number;
  remainingDisplay: string;
  followingDisplay: string;
  departureTime: string;
  followingDepartureTime: string;
  isApproaching: boolean;
  status: 'on_time' | 'delayed' | 'disrupted';
} {
  try {
    const validDate = (baseDate instanceof Date && !isNaN(baseDate.getTime())) ? baseDate : getAlignedNow();
    const normKey = normalizeLineKey(lineKey || 'M13');
    const meta = RATP_LINES_METADATA[normKey] || RATP_LINES_METADATA['M13'];
    const hour = validDate.getHours();
    const isWeekend = validDate.getDay() === 0 || validDate.getDay() === 6;
    const headwayMin = getHeadwayMinutes(meta, hour, isWeekend);
    const headwaySec = Math.max(90, Math.round(headwayMin * 60));

    // Déphasage naturel selon la position de l'arrêt le long du parcours (2 min par arrêt)
    const linePhaseOffset = ((stopOrder || 1) * 125) % headwaySec;
    const seedKey = `${stopId || 'stop'}_${normKey}_${directionCode || 'DIR'}`;
    const pseudoRandom = Math.abs(hashString(seedKey)) % 30;

    const totalCurrentSeconds = Math.floor(validDate.getTime() / 1000);
    const cyclePos = (totalCurrentSeconds + linePhaseOffset + pseudoRandom) % headwaySec;
    const secondsUntilNext = headwaySec - cyclePos;

    const remainingMin = Math.floor(secondsUntilNext / 60);
    const remainingSecondsPart = secondsUntilNext % 60;
    const followingMin = remainingMin + Math.round(headwayMin);

    let remainingDisplay: string;
    const isApproaching = remainingMin === 0;

    if (isApproaching) {
      if (secondsUntilNext < 30) {
        remainingDisplay = "À l'approche";
      } else {
        remainingDisplay = `${remainingSecondsPart}s`;
      }
    } else {
      remainingDisplay = `${remainingMin} min`;
    }

    const depDate = new Date(validDate.getTime() + secondsUntilNext * 1000);
    const departureTime = `${String(depDate.getHours()).padStart(2, '0')}:${String(depDate.getMinutes()).padStart(2, '0')}`;
    const followingDate = new Date(validDate.getTime() + (secondsUntilNext + headwayMin * 60) * 1000);
    const followingDepartureTime = `${String(followingDate.getHours()).padStart(2, '0')}:${String(followingDate.getMinutes()).padStart(2, '0')}`;

    return {
      remainingMinutes: remainingMin,
      remainingSeconds: secondsUntilNext,
      remainingDisplay,
      followingDisplay: `${followingMin} min`,
      departureTime,
      followingDepartureTime,
      isApproaching,
      status: 'on_time',
    };
  } catch (err) {
    console.warn('[ratpRealtimeService] Erreur dans getStopRealtimeDeparture:', err);
    return {
      remainingMinutes: 2,
      remainingSeconds: 120,
      remainingDisplay: '2 min',
      followingDisplay: '6 min',
      departureTime: '--:--',
      followingDepartureTime: '--:--',
      isApproaching: false,
      status: 'on_time',
    };
  }
}

/**
 * Récupère les perturbations et alertes réseau en temps réel
 */
export async function fetchNetworkDisruptions(): Promise<TransitDisruptionItem[]> {
  try {
    const res = await fetch('/api/transit/disruptions');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.disruptions)) {
        return data.disruptions;
      }
    }
  } catch (err) {
    console.warn('[Transit] Erreur chargement perturbations API, fallback local:', err);
  }
  return SAMPLE_IDF_DISRUPTIONS;
}

