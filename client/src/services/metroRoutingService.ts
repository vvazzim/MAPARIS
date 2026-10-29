import { RATP_LINES_METADATA, getRealtimeDeparturesForStation, TransitLineType } from './ratpRealtimeService';

export interface TransitStation {
  id: string;
  name: string;
  lines: string[];
  types: TransitLineType[];
  lat: number;
  lng: number;
  district?: string;
}

// Alias de rétrocompatibilité
export type MetroStation = TransitStation;

export interface MetroRouteLeg {
  line: string;
  type: TransitLineType;
  fromStation: string;
  toStation: string;
  direction: string;
  stopsCount: number;
  durationMin: number;
  remainingMinutes: number;
  remainingSeconds: number;
  exactDepartureTime: string; // e.g. "15:24"
  followingDepartureTime: string; // e.g. "15:28"
  isRealtime: boolean;
  status: 'on_time' | 'delayed' | 'disrupted';
  polyline: [number, number][];
}

export interface MetroRoutePlan {
  origin: TransitStation;
  destination: TransitStation;
  totalDurationMin: number;
  transfersCount: number;
  departureTime: string; // e.g. "15:24"
  arrivalTime: string;   // e.g. "15:33"
  countdownMinutes: number; // e.g. 2
  countdownSeconds: number; // e.g. 45
  countdownDisplay: string; // e.g. "dans 2 min" ou "À l'approche"
  legs: MetroRouteLeg[];
  fullPolyline: [number, number][];
  recommendation: string;
}

// Répertoire enrichi des stations et hubs multimodaux d'Île-de-France
export const TRANSIT_STATIONS: TransitStation[] = [
  {
    id: 'station-chatelet',
    name: 'Châtelet - Les Halles',
    lines: ['M1', 'M4', 'M7', 'M11', 'M14', 'RER A', 'RER B', 'RER D', 'Bus 38', 'Bus 72', 'Bus 96'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8606,
    lng: 2.3476,
    district: 'Paris 1er',
  },
  {
    id: 'station-republique',
    name: 'République',
    lines: ['M3', 'M5', 'M8', 'M9', 'M11', 'Bus 20', 'Bus 72'],
    types: ['metro', 'bus'],
    lat: 48.8675,
    lng: 2.3638,
    district: 'Paris 3e/11e',
  },
  {
    id: 'station-bastille',
    name: 'Bastille',
    lines: ['M1', 'M5', 'M8', 'Bus 91', 'Bus 96'],
    types: ['metro', 'bus'],
    lat: 48.8532,
    lng: 2.3698,
    district: 'Paris 4e/11e/12e',
  },
  {
    id: 'station-gare-de-lyon',
    name: 'Gare de Lyon',
    lines: ['M1', 'M14', 'RER A', 'RER D', 'Train R', 'Bus 72', 'Bus 91'],
    types: ['metro', 'rer', 'train', 'bus'],
    lat: 48.8449,
    lng: 2.3734,
    district: 'Paris 12e',
  },
  {
    id: 'station-gare-du-nord',
    name: 'Gare du Nord',
    lines: ['M4', 'M5', 'RER B', 'RER D', 'RER E', 'Train H', 'Bus 26', 'Bus 38', 'Bus 91'],
    types: ['metro', 'rer', 'train', 'bus'],
    lat: 48.8809,
    lng: 2.3553,
    district: 'Paris 10e',
  },
  {
    id: 'station-gare-de-lest',
    name: 'Gare de l\'Est',
    lines: ['M4', 'M5', 'M7', 'Train P', 'Bus 38', 'Bus 91'],
    types: ['metro', 'train', 'bus'],
    lat: 48.8768,
    lng: 2.3592,
    district: 'Paris 10e',
  },
  {
    id: 'station-gare-dausterlitz',
    name: 'Gare d\'Austerlitz',
    lines: ['M5', 'M10', 'RER C', 'Bus 91'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8423,
    lng: 2.3653,
    district: 'Paris 13e',
  },
  {
    id: 'station-saint-lazare',
    name: 'Saint-Lazare',
    lines: ['M3', 'M12', 'M13', 'M14', 'RER E', 'Train J', 'Train L', 'Bus 26'],
    types: ['metro', 'rer', 'train', 'bus'],
    lat: 48.8763,
    lng: 2.3255,
    district: 'Paris 8e',
  },
  {
    id: 'station-montparnasse',
    name: 'Montparnasse - Bienvenüe',
    lines: ['M4', 'M6', 'M12', 'M13', 'Train N', 'Bus 91', 'Bus 96'],
    types: ['metro', 'train', 'bus'],
    lat: 48.8421,
    lng: 2.3219,
    district: 'Paris 14e/15e',
  },
  {
    id: 'station-nation',
    name: 'Nation',
    lines: ['M1', 'M2', 'M6', 'M9', 'RER A', 'Bus 26', 'Bus 96'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8484,
    lng: 2.3959,
    district: 'Paris 11e/12e',
  },
  {
    id: 'station-etoile',
    name: 'Charles de Gaulle - Étoile',
    lines: ['M1', 'M2', 'M6', 'RER A', 'Bus 72'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8738,
    lng: 2.2950,
    district: 'Paris 8e/16e/17e',
  },
  {
    id: 'station-concorde',
    name: 'Concorde',
    lines: ['M1', 'M8', 'M12', 'Bus 72'],
    types: ['metro', 'bus'],
    lat: 48.8656,
    lng: 2.3212,
    district: 'Paris 1er/8e',
  },
  {
    id: 'station-opera',
    name: 'Opéra',
    lines: ['M3', 'M7', 'M8', 'RER A', 'Bus 20', 'Bus 26'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8706,
    lng: 2.3322,
    district: 'Paris 9e',
  },
  {
    id: 'station-la-defense',
    name: 'La Défense (Grande Arche)',
    lines: ['M1', 'RER A', 'Train L', 'Train U', 'T2', 'Bus 72'],
    types: ['metro', 'rer', 'train', 'tram', 'bus'],
    lat: 48.8918,
    lng: 2.2380,
    district: 'Hauts-de-Seine (92)',
  },
  {
    id: 'station-porte-de-versailles',
    name: 'Porte de Versailles',
    lines: ['M12', 'T2', 'T3a', 'Bus 80'],
    types: ['metro', 'tram', 'bus'],
    lat: 48.8322,
    lng: 2.2880,
    district: 'Paris 15e',
  },
  {
    id: 'station-porte-de-vincennes',
    name: 'Porte de Vincennes',
    lines: ['M1', 'T3a', 'T3b', 'Bus 26', 'Bus 96'],
    types: ['metro', 'tram', 'bus'],
    lat: 48.8471,
    lng: 2.4084,
    district: 'Paris 12e/20e',
  },
  {
    id: 'station-bibliotheque-fm',
    name: 'Bibliothèque François Mitterrand',
    lines: ['M14', 'RER C', 'T3a', 'Bus 62'],
    types: ['metro', 'rer', 'tram', 'bus'],
    lat: 48.8299,
    lng: 2.3768,
    district: 'Paris 13e',
  },
  {
    id: 'station-place-ditalie',
    name: 'Place d\'Italie',
    lines: ['M5', 'M6', 'M7', 'Bus 62'],
    types: ['metro', 'bus'],
    lat: 48.8315,
    lng: 2.3556,
    district: 'Paris 13e',
  },
  {
    id: 'station-saint-michel',
    name: 'Saint-Michel - Notre-Dame',
    lines: ['M4', 'RER B', 'RER C', 'Bus 38', 'Bus 96'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8534,
    lng: 2.3444,
    district: 'Paris 5e/6e',
  },
  {
    id: 'station-invalides',
    name: 'Invalides',
    lines: ['M8', 'M13', 'RER C', 'Bus 72'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8617,
    lng: 2.3142,
    district: 'Paris 7e',
  },
  {
    id: 'station-bir-hakeim',
    name: 'Bir-Hakeim - Tour Eiffel',
    lines: ['M6', 'RER C', 'Bus 72'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8540,
    lng: 2.2893,
    district: 'Paris 15e',
  },
  {
    id: 'station-denfert-rochereau',
    name: 'Denfert-Rochereau',
    lines: ['M4', 'M6', 'RER B', 'Bus 38', 'Bus 62'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.8339,
    lng: 2.3324,
    district: 'Paris 14e',
  },
  {
    id: 'station-saint-denis-pleyel',
    name: 'Saint-Denis Pleyel',
    lines: ['M14', 'RER D', 'T1'],
    types: ['metro', 'rer', 'tram'],
    lat: 48.9198,
    lng: 2.3448,
    district: 'Seine-Saint-Denis (93)',
  },
  {
    id: 'station-porte-de-clichy',
    name: 'Porte de Clichy',
    lines: ['M13', 'M14', 'RER C', 'T3b'],
    types: ['metro', 'rer', 'tram'],
    lat: 48.8943,
    lng: 2.3134,
    district: 'Paris 17e',
  },
  {
    id: 'station-porte-de-la-chapelle',
    name: 'Porte de la Chapelle',
    lines: ['M12', 'T3b', 'Bus 38'],
    types: ['metro', 'tram', 'bus'],
    lat: 48.8980,
    lng: 2.3595,
    district: 'Paris 18e',
  },
  {
    id: 'station-pont-de-sevres',
    name: 'Pont de Sèvres',
    lines: ['M9', 'T2', 'Bus 72'],
    types: ['metro', 'tram', 'bus'],
    lat: 48.8298,
    lng: 2.2307,
    district: 'Boulogne-Billancourt (92)',
  },
  {
    id: 'station-bobigny-picasso',
    name: 'Bobigny - Pablo Picasso',
    lines: ['M5', 'T1'],
    types: ['metro', 'tram'],
    lat: 48.9066,
    lng: 2.4497,
    district: 'Bobigny (93)',
  },
  {
    id: 'station-aeroport-orly',
    name: 'Aéroport d\'Orly',
    lines: ['M14', 'T7'],
    types: ['metro', 'tram'],
    lat: 48.7289,
    lng: 2.3656,
    district: 'Val-de-Marne (94)',
  },
  {
    id: 'station-cdg-tgv',
    name: 'Aéroport CDG 2 TGV',
    lines: ['RER B', 'Train H'],
    types: ['rer', 'train'],
    lat: 49.0047,
    lng: 2.5710,
    district: 'Roissy (95)',
  },
  {
    id: 'station-versailles-chantiers',
    name: 'Versailles Chantiers',
    lines: ['RER C', 'Train N', 'Train U'],
    types: ['rer', 'train'],
    lat: 48.7958,
    lng: 2.1356,
    district: 'Versailles (78)',
  },
  {
    id: 'station-saint-ouen',
    name: 'Saint-Ouen (Gare)',
    lines: ['M14', 'RER C', 'Bus 66', 'Bus 173'],
    types: ['metro', 'rer', 'bus'],
    lat: 48.9038,
    lng: 2.3252,
    district: 'Saint-Ouen (93)',
  },
  {
    id: 'station-mairie-de-saint-ouen',
    name: 'Mairie de Saint-Ouen',
    lines: ['M13', 'M14', 'Bus 85', 'Bus 173'],
    types: ['metro', 'bus'],
    lat: 48.9118,
    lng: 2.3338,
    district: 'Saint-Ouen (93)',
  },
  {
    id: 'station-les-courtilles',
    name: 'Asnières-Gennevilliers Les Courtilles',
    lines: ['M13', 'T1', 'Bus 54'],
    types: ['metro', 'tram', 'bus'],
    lat: 48.9308,
    lng: 2.2842,
    district: 'Asnières (92)',
  },
  {
    id: 'station-gabriel-peri',
    name: 'Gabriel Péri',
    lines: ['M13', 'Bus 54'],
    types: ['metro', 'bus'],
    lat: 48.9168,
    lng: 2.2995,
    district: 'Asnières / Gennevilliers (92)',
  },
  {
    id: 'station-place-de-clichy',
    name: 'Place de Clichy',
    lines: ['M2', 'M13', 'Bus 54', 'Bus 80'],
    types: ['metro', 'bus'],
    lat: 48.8834,
    lng: 2.3275,
    district: 'Paris 8e/9e/17e/18e',
  },
  {
    id: 'station-saint-denis-universite',
    name: 'Saint-Denis Université',
    lines: ['M13', 'T11'],
    types: ['metro', 'tram'],
    lat: 48.9458,
    lng: 2.3644,
    district: 'Saint-Denis (93)',
  },
  {
    id: 'station-basilique-saint-denis',
    name: 'Basilique de Saint-Denis',
    lines: ['M13', 'T1', 'T8'],
    types: ['metro', 'tram'],
    lat: 48.9372,
    lng: 2.3592,
    district: 'Saint-Denis (93)',
  },
  {
    id: 'station-porte-de-vanves',
    name: 'Porte de Vanves',
    lines: ['M13', 'T3a', 'Bus 95'],
    types: ['metro', 'tram', 'bus'],
    lat: 48.8282,
    lng: 2.3058,
    district: 'Paris 14e',
  },
  {
    id: 'station-chatillon-montrouge',
    name: 'Châtillon - Montrouge',
    lines: ['M13', 'T6'],
    types: ['metro', 'tram'],
    lat: 48.8108,
    lng: 2.3005,
    district: 'Châtillon (92)',
  },
  {
    id: 'station-juvisy',
    name: 'Juvisy (Grand Hub RER)',
    lines: ['RER C', 'RER D'],
    types: ['rer'],
    lat: 48.6898,
    lng: 2.3785,
    district: 'Essonne (91)',
  },
  {
    id: 'station-massy-palaiseau',
    name: 'Massy - Palaiseau',
    lines: ['RER B', 'RER C'],
    types: ['rer'],
    lat: 48.7252,
    lng: 2.2605,
    district: 'Essonne (91)',
  },
  {
    id: 'station-cergy-prefecture',
    name: 'Cergy Préfecture',
    lines: ['RER A', 'Train L'],
    types: ['rer', 'train'],
    lat: 49.0366,
    lng: 2.0792,
    district: 'Val-d\'Oise (95)',
  },
  {
    id: 'station-poissy',
    name: 'Poissy',
    lines: ['RER A', 'Train J'],
    types: ['rer', 'train'],
    lat: 48.9328,
    lng: 2.0422,
    district: 'Yvelines (78)',
  },
  {
    id: 'station-melun',
    name: 'Melun',
    lines: ['RER D', 'Train R'],
    types: ['rer', 'train'],
    lat: 48.5278,
    lng: 2.6558,
    district: 'Seine-et-Marne (77)',
  },
  {
    id: 'station-chelles-gournay',
    name: 'Chelles - Gournay',
    lines: ['RER E', 'Train P'],
    types: ['rer', 'train'],
    lat: 48.8752,
    lng: 2.5835,
    district: 'Seine-et-Marne (77)',
  },
  {
    id: 'station-epinay-sur-seine',
    name: 'Épinay-sur-Seine',
    lines: ['RER C', 'T8', 'T11'],
    types: ['rer', 'tram'],
    lat: 48.9515,
    lng: 2.3088,
    district: 'Seine-Saint-Denis (93)',
  },
  {
    id: 'station-aulnay-sous-bois',
    name: 'Aulnay-sous-Bois',
    lines: ['RER B', 'Train K'],
    types: ['rer', 'train'],
    lat: 48.9325,
    lng: 2.4948,
    district: 'Seine-Saint-Denis (93)',
  },
  {
    id: 'station-villejuif-aragon',
    name: 'Villejuif - Louis Aragon',
    lines: ['M7', 'T7'],
    types: ['metro', 'tram'],
    lat: 48.7872,
    lng: 2.3678,
    district: 'Val-de-Marne (94)',
  },
  {
    id: 'station-creteil-prefecture',
    name: 'Créteil - Préfecture',
    lines: ['M8'],
    types: ['metro'],
    lat: 48.7798,
    lng: 2.4592,
    district: 'Val-de-Marne (94)',
  },
];

export const METRO_NETWORK_STATIONS = TRANSIT_STATIONS;

interface DirectLink {
  stationA: string;
  stationB: string;
  line: string;
  directionAtoB: string;
  directionBtoA: string;
  durationMin: number;
  stops: number;
}

// Liaisons directes majeures du réseau d'Île-de-France
const DIRECT_LINKS: DirectLink[] = [
  // Ligne 1
  { stationA: 'station-la-defense', stationB: 'station-etoile', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 7, stops: 4 },
  { stationA: 'station-etoile', stationB: 'station-concorde', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 5, stops: 3 },
  { stationA: 'station-concorde', stationB: 'station-chatelet', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 4, stops: 3 },
  { stationA: 'station-chatelet', stationB: 'station-bastille', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 5, stops: 3 },
  { stationA: 'station-bastille', stationB: 'station-gare-de-lyon', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 3, stops: 1 },
  { stationA: 'station-gare-de-lyon', stationB: 'station-nation', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 5, stops: 3 },
  { stationA: 'station-nation', stationB: 'station-porte-de-vincennes', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 2, stops: 1 },

  // Ligne 14
  { stationA: 'station-saint-denis-pleyel', stationB: 'station-porte-de-clichy', line: 'M14', directionAtoB: 'Aéroport d\'Orly', directionBtoA: 'Saint-Denis Pleyel', durationMin: 4, stops: 1 },
  { stationA: 'station-porte-de-clichy', stationB: 'station-saint-lazare', line: 'M14', directionAtoB: 'Aéroport d\'Orly', directionBtoA: 'Saint-Denis Pleyel', durationMin: 3, stops: 1 },
  { stationA: 'station-saint-lazare', stationB: 'station-chatelet', line: 'M14', directionAtoB: 'Aéroport d\'Orly', directionBtoA: 'Saint-Denis Pleyel', durationMin: 4, stops: 2 },
  { stationA: 'station-chatelet', stationB: 'station-gare-de-lyon', line: 'M14', directionAtoB: 'Aéroport d\'Orly', directionBtoA: 'Saint-Denis Pleyel', durationMin: 3, stops: 1 },
  { stationA: 'station-gare-de-lyon', stationB: 'station-bibliotheque-fm', line: 'M14', directionAtoB: 'Aéroport d\'Orly', directionBtoA: 'Saint-Denis Pleyel', durationMin: 3, stops: 1 },
  { stationA: 'station-bibliotheque-fm', stationB: 'station-aeroport-orly', line: 'M14', directionAtoB: 'Aéroport d\'Orly', directionBtoA: 'Saint-Denis Pleyel', durationMin: 14, stops: 4 },

  // Ligne 4
  { stationA: 'station-gare-du-nord', stationB: 'station-gare-de-lest', line: 'M4', directionAtoB: 'Bagneux', directionBtoA: 'Porte de Clignancourt', durationMin: 1, stops: 1 },
  { stationA: 'station-gare-de-lest', stationB: 'station-chatelet', line: 'M4', directionAtoB: 'Bagneux', directionBtoA: 'Porte de Clignancourt', durationMin: 6, stops: 4 },
  { stationA: 'station-chatelet', stationB: 'station-saint-michel', line: 'M4', directionAtoB: 'Bagneux', directionBtoA: 'Porte de Clignancourt', durationMin: 2, stops: 1 },
  { stationA: 'station-saint-michel', stationB: 'station-montparnasse', line: 'M4', directionAtoB: 'Bagneux', directionBtoA: 'Porte de Clignancourt', durationMin: 6, stops: 4 },
  { stationA: 'station-montparnasse', stationB: 'station-denfert-rochereau', line: 'M4', directionAtoB: 'Bagneux', directionBtoA: 'Porte de Clignancourt', durationMin: 3, stops: 2 },

  // Ligne 5
  { stationA: 'station-bobigny-picasso', stationB: 'station-gare-du-nord', line: 'M5', directionAtoB: 'Place d\'Italie', directionBtoA: 'Bobigny', durationMin: 12, stops: 7 },
  { stationA: 'station-gare-du-nord', stationB: 'station-republique', line: 'M5', directionAtoB: 'Place d\'Italie', directionBtoA: 'Bobigny', durationMin: 4, stops: 3 },
  { stationA: 'station-republique', stationB: 'station-bastille', line: 'M5', directionAtoB: 'Place d\'Italie', directionBtoA: 'Bobigny', durationMin: 5, stops: 3 },
  { stationA: 'station-bastille', stationB: 'station-gare-dausterlitz', line: 'M5', directionAtoB: 'Place d\'Italie', directionBtoA: 'Bobigny', durationMin: 3, stops: 1 },
  { stationA: 'station-gare-dausterlitz', stationB: 'station-place-ditalie', line: 'M5', directionAtoB: 'Place d\'Italie', directionBtoA: 'Bobigny', durationMin: 4, stops: 2 },

  // Ligne 6
  { stationA: 'station-etoile', stationB: 'station-bir-hakeim', line: 'M6', directionAtoB: 'Nation', directionBtoA: 'Étoile', durationMin: 6, stops: 4 },
  { stationA: 'station-bir-hakeim', stationB: 'station-montparnasse', line: 'M6', directionAtoB: 'Nation', directionBtoA: 'Étoile', durationMin: 7, stops: 5 },
  { stationA: 'station-montparnasse', stationB: 'station-denfert-rochereau', line: 'M6', directionAtoB: 'Nation', directionBtoA: 'Étoile', durationMin: 3, stops: 2 },
  { stationA: 'station-denfert-rochereau', stationB: 'station-place-ditalie', line: 'M6', directionAtoB: 'Nation', directionBtoA: 'Étoile', durationMin: 4, stops: 3 },
  { stationA: 'station-place-ditalie', stationB: 'station-nation', line: 'M6', directionAtoB: 'Nation', directionBtoA: 'Étoile', durationMin: 9, stops: 6 },

  // Ligne 8
  { stationA: 'station-concorde', stationB: 'station-opera', line: 'M8', directionAtoB: 'Pointe du Lac', directionBtoA: 'Balard', durationMin: 3, stops: 2 },
  { stationA: 'station-opera', stationB: 'station-republique', line: 'M8', directionAtoB: 'Pointe du Lac', directionBtoA: 'Balard', durationMin: 6, stops: 4 },
  { stationA: 'station-republique', stationB: 'station-bastille', line: 'M8', directionAtoB: 'Pointe du Lac', directionBtoA: 'Balard', durationMin: 5, stops: 3 },
  { stationA: 'station-invalides', stationB: 'station-concorde', line: 'M8', directionAtoB: 'Pointe du Lac', directionBtoA: 'Balard', durationMin: 2, stops: 1 },

  // Ligne 12
  { stationA: 'station-porte-de-la-chapelle', stationB: 'station-saint-lazare', line: 'M12', directionAtoB: 'Mairie d\'Issy', directionBtoA: 'Mairie d\'Aubervilliers', durationMin: 8, stops: 5 },
  { stationA: 'station-saint-lazare', stationB: 'station-concorde', line: 'M12', directionAtoB: 'Mairie d\'Issy', directionBtoA: 'Mairie d\'Aubervilliers', durationMin: 4, stops: 3 },
  { stationA: 'station-concorde', stationB: 'station-montparnasse', line: 'M12', directionAtoB: 'Mairie d\'Issy', directionBtoA: 'Mairie d\'Aubervilliers', durationMin: 8, stops: 5 },
  { stationA: 'station-montparnasse', stationB: 'station-porte-de-versailles', line: 'M12', directionAtoB: 'Mairie d\'Issy', directionBtoA: 'Mairie d\'Aubervilliers', durationMin: 6, stops: 4 },

  // Ligne 13 (Axe Nord Asnières/St-Denis ➔ Centre ➔ Sud Châtillon)
  { stationA: 'station-les-courtilles', stationB: 'station-gabriel-peri', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Les Courtilles', durationMin: 3, stops: 2 },
  { stationA: 'station-gabriel-peri', stationB: 'station-porte-de-clichy', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Les Courtilles', durationMin: 4, stops: 2 },
  { stationA: 'station-saint-denis-universite', stationB: 'station-basilique-saint-denis', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Saint-Denis Université', durationMin: 3, stops: 1 },
  { stationA: 'station-basilique-saint-denis', stationB: 'station-mairie-de-saint-ouen', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Saint-Denis Université', durationMin: 6, stops: 3 },
  { stationA: 'station-mairie-de-saint-ouen', stationB: 'station-porte-de-clichy', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Saint-Denis Université', durationMin: 4, stops: 2 },
  { stationA: 'station-porte-de-clichy', stationB: 'station-place-de-clichy', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Asnières / Saint-Denis', durationMin: 3, stops: 1 },
  { stationA: 'station-place-de-clichy', stationB: 'station-saint-lazare', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Asnières / Saint-Denis', durationMin: 3, stops: 1 },
  { stationA: 'station-saint-lazare', stationB: 'station-invalides', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Asnières / Saint-Denis', durationMin: 4, stops: 2 },
  { stationA: 'station-invalides', stationB: 'station-montparnasse', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Asnières / Saint-Denis', durationMin: 5, stops: 3 },
  { stationA: 'station-montparnasse', stationB: 'station-porte-de-vanves', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Asnières / Saint-Denis', durationMin: 4, stops: 2 },
  { stationA: 'station-porte-de-vanves', stationB: 'station-chatillon-montrouge', line: 'M13', directionAtoB: 'Châtillon - Montrouge', directionBtoA: 'Asnières / Saint-Denis', durationMin: 4, stops: 2 },

  // Lignes Bus du secteur Clichy / Saint-Ouen
  { stationA: 'station-porte-de-clichy', stationB: 'station-saint-lazare', line: 'Bus 66', directionAtoB: 'Opéra', directionBtoA: 'Saint-Ouen', durationMin: 12, stops: 6 },
  { stationA: 'station-porte-de-clichy', stationB: 'station-chatelet', line: 'Bus 74', directionAtoB: 'Châtelet', directionBtoA: 'Clichy', durationMin: 18, stops: 9 },
  { stationA: 'station-porte-de-clichy', stationB: 'station-gare-du-nord', line: 'Bus 54', directionAtoB: 'Porte d\'Aubervilliers', directionBtoA: 'Asnières', durationMin: 16, stops: 8 },

  // RER A
  { stationA: 'station-la-defense', stationB: 'station-etoile', line: 'RER A', directionAtoB: 'Marne-la-Vallée / Boissy', directionBtoA: 'Cergy / Poissy', durationMin: 4, stops: 1 },
  { stationA: 'station-etoile', stationB: 'station-chatelet', line: 'RER A', directionAtoB: 'Marne-la-Vallée / Boissy', directionBtoA: 'Cergy / Poissy', durationMin: 4, stops: 1 },
  { stationA: 'station-chatelet', stationB: 'station-gare-de-lyon', line: 'RER A', directionAtoB: 'Marne-la-Vallée / Boissy', directionBtoA: 'Cergy / Poissy', durationMin: 3, stops: 1 },
  { stationA: 'station-gare-de-lyon', stationB: 'station-nation', line: 'RER A', directionAtoB: 'Marne-la-Vallée / Boissy', directionBtoA: 'Cergy / Poissy', durationMin: 3, stops: 1 },

  // RER B
  { stationA: 'station-cdg-tgv', stationB: 'station-gare-du-nord', line: 'RER B', directionAtoB: 'Robinson / St-Rémy', directionBtoA: 'Aéroport CDG 2', durationMin: 28, stops: 5 },
  { stationA: 'station-gare-du-nord', stationB: 'station-chatelet', line: 'RER B', directionAtoB: 'Robinson / St-Rémy', directionBtoA: 'Aéroport CDG 2', durationMin: 4, stops: 1 },
  { stationA: 'station-chatelet', stationB: 'station-saint-michel', line: 'RER B', directionAtoB: 'Robinson / St-Rémy', directionBtoA: 'Aéroport CDG 2', durationMin: 2, stops: 1 },
  { stationA: 'station-saint-michel', stationB: 'station-denfert-rochereau', line: 'RER B', directionAtoB: 'Robinson / St-Rémy', directionBtoA: 'Aéroport CDG 2', durationMin: 5, stops: 2 },

  // RER C
  { stationA: 'station-versailles-chantiers', stationB: 'station-bir-hakeim', line: 'RER C', directionAtoB: 'Paris Austerlitz', directionBtoA: 'Versailles', durationMin: 20, stops: 4 },
  { stationA: 'station-bir-hakeim', stationB: 'station-invalides', line: 'RER C', directionAtoB: 'Paris Austerlitz', directionBtoA: 'Versailles', durationMin: 4, stops: 2 },
  { stationA: 'station-invalides', stationB: 'station-saint-michel', line: 'RER C', directionAtoB: 'Paris Austerlitz', directionBtoA: 'Versailles', durationMin: 4, stops: 2 },
  { stationA: 'station-saint-michel', stationB: 'station-gare-dausterlitz', line: 'RER C', directionAtoB: 'Paris Austerlitz', directionBtoA: 'Versailles', durationMin: 4, stops: 1 },
  { stationA: 'station-gare-dausterlitz', stationB: 'station-bibliotheque-fm', line: 'RER C', directionAtoB: 'Juvisy / Dourdan', directionBtoA: 'Versailles', durationMin: 3, stops: 1 },

  // RER D
  { stationA: 'station-saint-denis-pleyel', stationB: 'station-gare-du-nord', line: 'RER D', directionAtoB: 'Melun / Corbeil', directionBtoA: 'Creil', durationMin: 5, stops: 1 },
  { stationA: 'station-gare-du-nord', stationB: 'station-chatelet', line: 'RER D', directionAtoB: 'Melun / Corbeil', directionBtoA: 'Creil', durationMin: 4, stops: 1 },
  { stationA: 'station-chatelet', stationB: 'station-gare-de-lyon', line: 'RER D', directionAtoB: 'Melun / Corbeil', directionBtoA: 'Creil', durationMin: 3, stops: 1 },

  // Tramway T2
  { stationA: 'station-pont-de-sevres', stationB: 'station-porte-de-versailles', line: 'T2', directionAtoB: 'Porte de Versailles', directionBtoA: 'Pont de Bezons', durationMin: 12, stops: 6 },
  { stationA: 'station-la-defense', stationB: 'station-pont-de-sevres', line: 'T2', directionAtoB: 'Porte de Versailles', directionBtoA: 'Pont de Bezons', durationMin: 14, stops: 7 },

  // Tramway T3a
  { stationA: 'station-porte-de-versailles', stationB: 'station-bibliotheque-fm', line: 'T3a', directionAtoB: 'Porte de Vincennes', directionBtoA: 'Pont du Garigliano', durationMin: 22, stops: 11 },
  { stationA: 'station-bibliotheque-fm', stationB: 'station-porte-de-vincennes', line: 'T3a', directionAtoB: 'Porte de Vincennes', directionBtoA: 'Pont du Garigliano', durationMin: 11, stops: 5 },

  // Tramway T3b
  { stationA: 'station-porte-de-vincennes', stationB: 'station-porte-de-la-chapelle', line: 'T3b', directionAtoB: 'Porte Dauphine', directionBtoA: 'Porte de Vincennes', durationMin: 19, stops: 10 },
  { stationA: 'station-porte-de-la-chapelle', stationB: 'station-porte-de-clichy', line: 'T3b', directionAtoB: 'Porte Dauphine', directionBtoA: 'Porte de Vincennes', durationMin: 13, stops: 6 },

  // Lignes Bus Structurantes
  { stationA: 'station-gare-du-nord', stationB: 'station-chatelet', line: 'Bus 38', directionAtoB: 'Porte d\'Orléans', directionBtoA: 'Porte de Clignancourt', durationMin: 14, stops: 8 },
  { stationA: 'station-chatelet', stationB: 'station-denfert-rochereau', line: 'Bus 38', directionAtoB: 'Porte d\'Orléans', directionBtoA: 'Porte de Clignancourt', durationMin: 12, stops: 7 },
  { stationA: 'station-montparnasse', stationB: 'station-bastille', line: 'Bus 91', directionAtoB: 'Bastille', directionBtoA: 'Montparnasse', durationMin: 18, stops: 10 },
  { stationA: 'station-bastille', stationB: 'station-gare-de-lyon', line: 'Bus 91', directionAtoB: 'Gare de Lyon', directionBtoA: 'Montparnasse', durationMin: 6, stops: 3 },
];

/**
 * Calcul de la distance géodésique en mètres (formule de Haversine)
 */
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Trouve la station la plus proche des coordonnées GPS données (fonction "Ma Position")
 */
export function findNearestTransitStation(lat: number, lng: number): TransitStation {
  let nearest = TRANSIT_STATIONS[0];
  let minDistance = Infinity;

  TRANSIT_STATIONS.forEach((station) => {
    const dist = haversineDistanceMeters(lat, lng, station.lat, station.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  });

  return nearest;
}

/**
 * Moteur de recherche et d'autocomplétion libre
 */
export function searchTransitStations(
  query: string,
  modeFilter: 'all' | 'metro' | 'rer' | 'train' | 'tram' | 'bus' = 'all'
): TransitStation[] {
  const cleanQ = query.trim().toLowerCase();

  let list = TRANSIT_STATIONS;
  if (modeFilter !== 'all') {
    list = list.filter((s) => s.types.includes(modeFilter as TransitLineType));
  }

  if (!cleanQ) return list;

  return list.filter((s) => {
    const nameMatch = s.name.toLowerCase().includes(cleanQ);
    const districtMatch = s.district?.toLowerCase().includes(cleanQ);
    const lineMatch = s.lines.some((l) => l.toLowerCase().replace(/\s+/g, '').includes(cleanQ.replace(/\s+/g, '')));
    return nameMatch || districtMatch || lineMatch;
  });
}

/**
 * Recherche une station par son identifiant ou une sous-chaîne de son nom
 */
export function findMetroStation(queryOrId: string): TransitStation | undefined {
  const q = queryOrId.toLowerCase().trim();
  return TRANSIT_STATIONS.find(
    (s) => s.id.toLowerCase() === q || s.name.toLowerCase().includes(q)
  );
}

/**
 * Calcule l'itinéraire optimal en transport en commun (Métro, Train, RER, Tram, Bus)
 * et génère l'heure exacte de départ et le décompte en temps réel à la seconde.
 */
export function calculateMetroRoute(
  originStationId: string,
  destStationId: string,
  currentTime: Date = new Date()
): MetroRoutePlan | null {
  const origin = findMetroStation(originStationId);
  const dest = findMetroStation(destStationId);

  if (!origin || !dest || origin.id === dest.id) {
    return null;
  }

  // 1. Recherche de liaison directe
  const directLink = DIRECT_LINKS.find(
    (l) => (l.stationA === origin.id && l.stationB === dest.id) ||
           (l.stationB === origin.id && l.stationA === dest.id)
  );

  let legsPlan: {
    line: string;
    from: TransitStation;
    to: TransitStation;
    direction: string;
    stops: number;
    durationMin: number;
  }[] = [];

  if (directLink) {
    const isAtoB = directLink.stationA === origin.id;
    legsPlan.push({
      line: directLink.line,
      from: origin,
      to: dest,
      direction: isAtoB ? directLink.directionAtoB : directLink.directionBtoA,
      stops: directLink.stops,
      durationMin: directLink.durationMin,
    });
  } else {
    // 2. Recherche d'itinéraire avec 1 correspondance (Station Pivot)
    let bestTransfer: {
      leg1: DirectLink;
      leg2: DirectLink;
      transferStation: TransitStation;
      totalDuration: number;
    } | null = null;

    for (const pivot of TRANSIT_STATIONS) {
      if (pivot.id === origin.id || pivot.id === dest.id) continue;

      const link1 = DIRECT_LINKS.find(
        (l) => (l.stationA === origin.id && l.stationB === pivot.id) ||
               (l.stationB === origin.id && l.stationA === pivot.id)
      );
      if (!link1) continue;

      const link2 = DIRECT_LINKS.find(
        (l) => (l.stationA === pivot.id && l.stationB === dest.id) ||
               (l.stationB === pivot.id && l.stationA === dest.id)
      );
      if (!link2) continue;

      const duration = link1.durationMin + link2.durationMin + 3; // +3 min de correspondance à quai
      if (!bestTransfer || duration < bestTransfer.totalDuration) {
        bestTransfer = {
          leg1: link1,
          leg2: link2,
          transferStation: pivot,
          totalDuration: duration,
        };
      }
    }

    if (bestTransfer) {
      const leg1IsAtoB = bestTransfer.leg1.stationA === origin.id;
      const leg2IsAtoB = bestTransfer.leg2.stationA === bestTransfer.transferStation.id;

      legsPlan.push({
        line: bestTransfer.leg1.line,
        from: origin,
        to: bestTransfer.transferStation,
        direction: leg1IsAtoB ? bestTransfer.leg1.directionAtoB : bestTransfer.leg1.directionBtoA,
        stops: bestTransfer.leg1.stops,
        durationMin: bestTransfer.leg1.durationMin,
      });

      legsPlan.push({
        line: bestTransfer.leg2.line,
        from: bestTransfer.transferStation,
        to: dest,
        direction: leg2IsAtoB ? bestTransfer.leg2.directionAtoB : bestTransfer.leg2.directionBtoA,
        stops: bestTransfer.leg2.stops,
        durationMin: bestTransfer.leg2.durationMin,
      });
    } else {
      // Itinéraire de repli par Châtelet si non trouvé
      const chatelet = findMetroStation('station-chatelet')!;
      legsPlan.push({
        line: origin.lines[0],
        from: origin,
        to: chatelet,
        direction: 'Centre de Paris (Châtelet)',
        stops: 4,
        durationMin: 7,
      });
      legsPlan.push({
        line: dest.lines[0],
        from: chatelet,
        to: dest,
        direction: dest.name,
        stops: 3,
        durationMin: 6,
      });
    }
  }

  // 3. Calcul précis des horaires en temps réel (Heure exacte et décompte des minutes)
  const firstLeg = legsPlan[0];
  const realtimeDeps = getRealtimeDeparturesForStation(firstLeg.from.id, [firstLeg.line], 'normal', currentTime);
  const matchingDep = realtimeDeps.find((d) => d.line === firstLeg.line) || realtimeDeps[0];

  const remainingMin = matchingDep ? matchingDep.remainingMinutes : 2;
  const nowMs = currentTime.getTime();

  // Seconde exacte du décompte
  const headwayMeta = RATP_LINES_METADATA[firstLeg.line];
  const headwayMinutes = headwayMeta ? headwayMeta.peakHeadwayMin : 3;
  const effectiveSeconds = Math.max(30, remainingMin * 60 + (currentTime.getSeconds() % 30));

  const departureMs = nowMs + effectiveSeconds * 1000;
  const departureDate = new Date(departureMs);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const exactDepartureTime = formatTime(departureDate);
  const followingDate = new Date(departureMs + headwayMinutes * 60000);
  const followingDepartureTime = formatTime(followingDate);

  // Construction des segments avec géométrie polyline pour affichage sur Leaflet
  const legs: MetroRouteLeg[] = [];
  const fullPolyline: [number, number][] = [];

  let currentLegTimeMs = departureMs;
  let totalDurationMin = 0;

  legsPlan.forEach((leg, index) => {
    const legDepartureDate = new Date(currentLegTimeMs);
    const legPolyline: [number, number][] = [
      [leg.from.lat, leg.from.lng],
      [leg.to.lat, leg.to.lng],
    ];

    legPolyline.forEach((p) => fullPolyline.push(p));

    const meta = RATP_LINES_METADATA[leg.line];
    const transitType: TransitLineType = meta ? meta.type : 'metro';

    legs.push({
      line: leg.line,
      type: transitType,
      fromStation: leg.from.name,
      toStation: leg.to.name,
      direction: leg.direction,
      stopsCount: leg.stops,
      durationMin: leg.durationMin,
      remainingMinutes: index === 0 ? remainingMin : 0,
      remainingSeconds: index === 0 ? effectiveSeconds : 0,
      exactDepartureTime: formatTime(legDepartureDate),
      followingDepartureTime: index === 0 ? followingDepartureTime : formatTime(new Date(legDepartureDate.getTime() + 4 * 60000)),
      isRealtime: true,
      status: 'on_time',
      polyline: legPolyline,
    });

    totalDurationMin += leg.durationMin + (index > 0 ? 3 : 0);
    currentLegTimeMs += (leg.durationMin + (index > 0 ? 3 : 0)) * 60000;
  });

  const arrivalDate = new Date(departureMs + totalDurationMin * 60000);
  const arrivalTime = formatTime(arrivalDate);

  let countdownDisplay: string;
  if (remainingMin === 0) {
    countdownDisplay = "À l'approche";
  } else {
    countdownDisplay = `dans ${remainingMin} min`;
  }

  const transfersCount = legs.length - 1;
  const recommendation =
    transfersCount === 0
      ? `Trajet direct sans correspondance (${totalDurationMin} min de trajet)`
      : `1 correspondance à ${legs[0].toStation} · Durée estimée ${totalDurationMin} min`;

  return {
    origin,
    destination: dest,
    totalDurationMin,
    transfersCount,
    departureTime: exactDepartureTime,
    arrivalTime,
    countdownMinutes: remainingMin,
    countdownSeconds: effectiveSeconds,
    countdownDisplay,
    legs,
    fullPolyline,
    recommendation,
  };
}

// === GESTION DES FAVORIS ET ÉPINGLAGE QUOTIDIEN (M13, Tram, Bus, etc.) ===
export interface PinnedCommute {
  homeStationId: string;
  workStationId: string;
  name: string;
}

export interface PinnedTransportsConfig {
  pinnedHubId: string;
  pinnedLines: string[];
  dailyCommute?: PinnedCommute;
}

const PINNED_CONFIG_STORAGE_KEY = 'maparis_pinned_transports_v1';

export function getPinnedTransportsConfig(): PinnedTransportsConfig {
  try {
    const saved = localStorage.getItem(PINNED_CONFIG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // fallback
  }
  return {
    pinnedHubId: 'station-porte-de-clichy',
    pinnedLines: ['M13', 'T3b', 'Bus 54', 'Bus 66'],
    dailyCommute: {
      homeStationId: 'station-porte-de-clichy',
      workStationId: 'station-saint-lazare',
      name: 'Mon Trajet Quotidien (Porte de Clichy ➔ Saint-Lazare)'
    }
  };
}

export function savePinnedTransportsConfig(cfg: PinnedTransportsConfig): void {
  try {
    localStorage.setItem(PINNED_CONFIG_STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    // ignore
  }
}
