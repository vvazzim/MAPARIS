import { TransitLineType } from '../services/ratpRealtimeService';

export interface TransitStopItem {
  id: string;
  name: string;
  order: number;
  city?: string;
  lat: number;
  lng: number;
  lines: string[];
  isAccessiblePmr?: boolean;
  hubId?: string;
}

export interface TransitLineData {
  key: string;
  name: string;
  type: TransitLineType;
  bg: string;
  text: string;
  directions: [
    { destination: string; code: string },
    { destination: string; code: string }
  ];
  stops: TransitStopItem[];
}

export interface TransitDisruptionItem {
  id: string;
  lineKey: string;
  lineLabel: string;
  type: 'delay' | 'cancellation' | 'strike' | 'station_closure';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  impactedSection?: string;
  estimatedResolution?: string;
  updatedAt: string;
}

/**
 * Répertoire des Lignes & Arrêts Réels d'Île-de-France
 */
export const IDF_LINES_DIRECTORY: Record<string, TransitLineData> = {
  // ==========================================
  // MÉTRO 13 (Axe Majeur Nord - Centre - Sud)
  // ==========================================
  'M13': {
    key: 'M13',
    name: '13',
    type: 'metro',
    bg: '#6EC4E8',
    text: '#000000',
    directions: [
      { destination: 'Asnières-Gennevilliers / Saint-Denis', code: 'NOR' },
      { destination: 'Châtillon - Montrouge', code: 'SUD' },
    ],
    stops: [
      { id: 'm13-courtilles', name: 'Asnières - Gennevilliers Les Courtilles', order: 1, city: 'Asnières (92)', lat: 48.9304, lng: 2.2835, lines: ['M13', 'T1'], isAccessiblePmr: true },
      { id: 'm13-agnettes', name: 'Les Agnettes', order: 2, city: 'Gennevilliers (92)', lat: 48.9234, lng: 2.2905, lines: ['M13'], isAccessiblePmr: true },
      { id: 'm13-gabriel-peri', name: 'Gabriel Péri', order: 3, city: 'Asnières / Gennevilliers', lat: 48.9168, lng: 2.2995, lines: ['M13', 'Bus 54', 'Bus 175'], isAccessiblePmr: true },
      { id: 'm13-mairie-clichy', name: 'Mairie de Clichy', order: 4, city: 'Clichy (92)', lat: 48.9038, lng: 2.3052, lines: ['M13', 'Bus 54', 'Bus 74'], isAccessiblePmr: true },
      { id: 'm13-porte-clichy', name: 'Porte de Clichy', order: 5, city: 'Paris 17e / Clichy', lat: 48.8944, lng: 2.3134, lines: ['M13', 'M14', 'T3b', 'RER C', 'Bus 54', 'Bus 66', 'Bus 74', 'Bus 173'], isAccessiblePmr: true, hubId: 'station-porte-de-clichy' },
      { id: 'm13-brochant', name: 'Brochant', order: 6, city: 'Paris 17e', lat: 48.8908, lng: 2.3197, lines: ['M13', 'Bus 66', 'Bus 54'], isAccessiblePmr: false },
      { id: 'm13-la-fourche', name: 'La Fourche', order: 7, city: 'Paris 17e/18e', lat: 48.8872, lng: 2.3255, lines: ['M13', 'Bus 54'], isAccessiblePmr: false },
      { id: 'm13-place-clichy', name: 'Place de Clichy', order: 8, city: 'Paris 8e/17e/18e', lat: 48.8834, lng: 2.3275, lines: ['M13', 'M2', 'Bus 54', 'Bus 80'], isAccessiblePmr: false, hubId: 'station-place-de-clichy' },
      { id: 'm13-liege', name: 'Liège', order: 9, city: 'Paris 8e/9e', lat: 48.8797, lng: 2.3283, lines: ['M13', 'Bus 66'], isAccessiblePmr: false },
      { id: 'm13-saint-lazare', name: 'Saint-Lazare', order: 10, city: 'Paris 8e/9e', lat: 48.8756, lng: 2.3258, lines: ['M13', 'M3', 'M9', 'M12', 'M14', 'RER E', 'Train J', 'Train L', 'Bus 66'], isAccessiblePmr: true, hubId: 'station-saint-lazare' },
      { id: 'm13-miromesnil', name: 'Miromesnil', order: 11, city: 'Paris 8e', lat: 48.8736, lng: 2.3153, lines: ['M13', 'M9', 'Bus 52'], isAccessiblePmr: false },
      { id: 'm13-clemenceau', name: 'Champs-Élysées - Clemenceau', order: 12, city: 'Paris 8e', lat: 48.8676, lng: 2.3129, lines: ['M13', 'M1', 'Bus 72'], isAccessiblePmr: true },
      { id: 'm13-invalides', name: 'Invalides', order: 13, city: 'Paris 7e', lat: 48.8617, lng: 2.3142, lines: ['M13', 'M8', 'RER C', 'Bus 72'], isAccessiblePmr: true, hubId: 'station-invalides' },
      { id: 'm13-varenne', name: 'Varenne', order: 14, city: 'Paris 7e', lat: 48.8559, lng: 2.3149, lines: ['M13'], isAccessiblePmr: false },
      { id: 'm13-francois-xavier', name: 'Saint-François-Xavier', order: 15, city: 'Paris 7e', lat: 48.8519, lng: 2.3145, lines: ['M13'], isAccessiblePmr: false },
      { id: 'm13-duroc', name: 'Duroc', order: 16, city: 'Paris 6e/7e/15e', lat: 48.8468, lng: 2.3168, lines: ['M13', 'M10', 'Bus 92'], isAccessiblePmr: false },
      { id: 'm13-montparnasse', name: 'Montparnasse - Bienvenüe', order: 17, city: 'Paris 6e/14e/15e', lat: 48.8421, lng: 2.3219, lines: ['M13', 'M4', 'M6', 'M12', 'Train N', 'Bus 91'], isAccessiblePmr: true, hubId: 'station-montparnasse' },
      { id: 'm13-gaite', name: 'Gaîté', order: 18, city: 'Paris 14e', lat: 48.8389, lng: 2.3228, lines: ['M13'], isAccessiblePmr: false },
      { id: 'm13-pernety', name: 'Pernety', order: 19, city: 'Paris 14e', lat: 48.8344, lng: 2.3183, lines: ['M13'], isAccessiblePmr: false },
      { id: 'm13-plaisance', name: 'Plaisance', order: 20, city: 'Paris 14e', lat: 48.8318, lng: 2.3135, lines: ['M13'], isAccessiblePmr: false },
      { id: 'm13-porte-vanves', name: 'Porte de Vanves', order: 21, city: 'Paris 14e', lat: 48.8282, lng: 2.3058, lines: ['M13', 'T3a', 'Bus 95'], isAccessiblePmr: true, hubId: 'station-porte-de-vanves' },
      { id: 'm13-malakoff-vanves', name: 'Malakoff - Plateau de Vanves', order: 22, city: 'Malakoff / Vanves (92)', lat: 48.8198, lng: 2.2982, lines: ['M13'], isAccessiblePmr: false },
      { id: 'm13-malakoff-dolet', name: 'Malakoff - Rue Étienne Dolet', order: 23, city: 'Malakoff (92)', lat: 48.8144, lng: 2.2989, lines: ['M13'], isAccessiblePmr: false },
      { id: 'm13-chatillon', name: 'Châtillon - Montrouge', order: 24, city: 'Châtillon (92)', lat: 48.8108, lng: 2.3005, lines: ['M13', 'T6', 'Bus 68'], isAccessiblePmr: true, hubId: 'station-chatillon-montrouge' },
    ],
  },

  // ==========================================
  // MÉTRO 14 (Axe Automatique Saint-Denis - Orly)
  // ==========================================
  'M14': {
    key: 'M14',
    name: '14',
    type: 'metro',
    bg: '#62259D',
    text: '#FFFFFF',
    directions: [
      { destination: 'Saint-Denis Pleyel', code: 'PLE' },
      { destination: 'Aéroport d\'Orly', code: 'ORL' },
    ],
    stops: [
      { id: 'm14-pleyel', name: 'Saint-Denis Pleyel', order: 1, city: 'Saint-Denis (93)', lat: 48.9198, lng: 2.3456, lines: ['M14', 'RER D'], isAccessiblePmr: true, hubId: 'station-saint-denis-pleyel' },
      { id: 'm14-mairie-st-ouen', name: 'Mairie de Saint-Ouen', order: 2, city: 'Saint-Ouen (93)', lat: 48.9118, lng: 2.3338, lines: ['M14', 'M13'], isAccessiblePmr: true, hubId: 'station-mairie-de-saint-ouen' },
      { id: 'm14-st-ouen-rer', name: 'Saint-Ouen RER', order: 3, city: 'Saint-Ouen (93)', lat: 48.9039, lng: 2.3255, lines: ['M14', 'RER C'], isAccessiblePmr: true },
      { id: 'm14-porte-clichy', name: 'Porte de Clichy', order: 4, city: 'Paris 17e / Clichy', lat: 48.8944, lng: 2.3134, lines: ['M14', 'M13', 'T3b', 'RER C', 'Bus 54', 'Bus 66', 'Bus 74', 'Bus 173'], isAccessiblePmr: true, hubId: 'station-porte-de-clichy' },
      { id: 'm14-pont-cardinet', name: 'Pont Cardinet', order: 5, city: 'Paris 17e', lat: 48.8878, lng: 2.3149, lines: ['M14', 'Train L'], isAccessiblePmr: true },
      { id: 'm14-saint-lazare', name: 'Saint-Lazare', order: 6, city: 'Paris 8e/9e', lat: 48.8756, lng: 2.3258, lines: ['M14', 'M3', 'M9', 'M12', 'M13', 'RER E', 'Train J', 'Train L', 'Bus 66'], isAccessiblePmr: true, hubId: 'station-saint-lazare' },
      { id: 'm14-madeleine', name: 'Madeleine', order: 7, city: 'Paris 8e', lat: 48.8702, lng: 2.3248, lines: ['M14', 'M8', 'M12', 'Bus 52'], isAccessiblePmr: true },
      { id: 'm14-pyramides', name: 'Pyramides', order: 8, city: 'Paris 1er', lat: 48.8661, lng: 2.3347, lines: ['M14', 'M7', 'Bus 21'], isAccessiblePmr: true },
      { id: 'm14-chatelet', name: 'Châtelet', order: 9, city: 'Paris 1er/4e', lat: 48.8606, lng: 2.3476, lines: ['M14', 'M1', 'M4', 'M7', 'M11', 'RER A', 'RER B', 'RER D', 'Bus 38', 'Bus 74'], isAccessiblePmr: true, hubId: 'station-chatelet' },
      { id: 'm14-gare-de-lyon', name: 'Gare de Lyon', order: 10, city: 'Paris 12e', lat: 48.8449, lng: 2.3734, lines: ['M14', 'M1', 'RER A', 'RER D', 'Train R', 'Bus 91'], isAccessiblePmr: true, hubId: 'station-gare-de-lyon' },
      { id: 'm14-bercy', name: 'Bercy', order: 11, city: 'Paris 12e', lat: 48.8402, lng: 2.3792, lines: ['M14', 'M6', 'Bus 24'], isAccessiblePmr: true },
      { id: 'm14-cour-st-emilion', name: 'Cour Saint-Émilion', order: 12, city: 'Paris 12e', lat: 48.8335, lng: 2.3871, lines: ['M14', 'Bus 24'], isAccessiblePmr: true },
      { id: 'm14-bibliotheque', name: 'Bibliothèque François Mitterrand', order: 13, city: 'Paris 13e', lat: 48.8299, lng: 2.3768, lines: ['M14', 'RER C', 'T3a', 'Bus 62'], isAccessiblePmr: true, hubId: 'station-bibliotheque-fm' },
      { id: 'm14-olympiades', name: 'Olympiades', order: 14, city: 'Paris 13e', lat: 48.8265, lng: 2.3671, lines: ['M14', 'Bus 62'], isAccessiblePmr: true },
      { id: 'm14-maison-blanche', name: 'Maison Blanche', order: 15, city: 'Paris 13e', lat: 48.8222, lng: 2.3592, lines: ['M14', 'M7', 'T3a'], isAccessiblePmr: true },
      { id: 'm14-hopital-bicetre', name: 'Hôpital Bicêtre', order: 16, city: 'Kremlin-Bicêtre (94)', lat: 48.8125, lng: 2.3538, lines: ['M14'], isAccessiblePmr: true },
      { id: 'm14-gustave-roussy', name: 'Villejuif - Gustave Roussy', order: 17, city: 'Villejuif (94)', lat: 48.7995, lng: 2.3481, lines: ['M14'], isAccessiblePmr: true },
      { id: 'm14-hay-les-roses', name: 'L\'Haÿ-les-Roses', order: 18, city: 'L\'Haÿ-les-Roses (94)', lat: 48.7831, lng: 2.3512, lines: ['M14'], isAccessiblePmr: true },
      { id: 'm14-chevilly-larue', name: 'Chevilly-Larue (Marché International)', order: 19, city: 'Chevilly-Larue (94)', lat: 48.7698, lng: 2.3562, lines: ['M14', 'T7'], isAccessiblePmr: true },
      { id: 'm14-thiais-orly', name: 'Thiais - Orly', order: 20, city: 'Thiais (94)', lat: 48.7495, lng: 2.3615, lines: ['M14', 'RER C'], isAccessiblePmr: true },
      { id: 'm14-aeroport-orly', name: 'Aéroport d\'Orly', order: 21, city: 'Paray-Vieille-Poste (91)', lat: 48.7275, lng: 2.3654, lines: ['M14', 'T7'], isAccessiblePmr: true, hubId: 'station-aeroport-orly' },
    ],
  },

  // ==========================================
  // TRAMWAY T3b (Ceinture Nord-Est Porte Dauphine - Vincennes)
  // ==========================================
  'T3b': {
    key: 'T3b',
    name: 'T3b',
    type: 'tram',
    bg: '#007852',
    text: '#FFFFFF',
    directions: [
      { destination: 'Porte Dauphine', code: 'DAU' },
      { destination: 'Porte de Vincennes', code: 'VIN' },
    ],
    stops: [
      { id: 't3b-porte-dauphine', name: 'Porte Dauphine', order: 1, city: 'Paris 16e', lat: 48.8718, lng: 2.2745, lines: ['T3b', 'M2', 'RER C'], isAccessiblePmr: true },
      { id: 't3b-porte-maillot', name: 'Porte Maillot', order: 2, city: 'Paris 16e/17e', lat: 48.8782, lng: 2.2825, lines: ['T3b', 'M1', 'RER A', 'RER C', 'RER E'], isAccessiblePmr: true },
      { id: 't3b-porte-champerret', name: 'Porte de Champerret', order: 3, city: 'Paris 17e', lat: 48.8862, lng: 2.2938, lines: ['T3b', 'M3'], isAccessiblePmr: true },
      { id: 't3b-porte-asnieres', name: 'Porte d\'Asnières - Marguerite Long', order: 4, city: 'Paris 17e', lat: 48.8912, lng: 2.3032, lines: ['T3b', 'Bus 84'], isAccessiblePmr: true },
      { id: 't3b-porte-clichy', name: 'Porte de Clichy', order: 5, city: 'Paris 17e / Clichy', lat: 48.8944, lng: 2.3134, lines: ['T3b', 'M13', 'M14', 'RER C', 'Bus 54', 'Bus 66', 'Bus 74', 'Bus 173'], isAccessiblePmr: true, hubId: 'station-porte-de-clichy' },
      { id: 't3b-epinettes', name: 'Épinettes - Pouchet', order: 6, city: 'Paris 17e', lat: 48.8968, lng: 2.3218, lines: ['T3b', 'Bus 66'], isAccessiblePmr: true },
      { id: 't3b-porte-st-ouen', name: 'Porte de Saint-Ouen', order: 7, city: 'Paris 17e/18e', lat: 48.8992, lng: 2.3325, lines: ['T3b', 'M13'], isAccessiblePmr: true },
      { id: 't3b-porte-clignancourt', name: 'Porte de Clignancourt', order: 8, city: 'Paris 18e', lat: 48.8988, lng: 2.3448, lines: ['T3b', 'M4', 'Bus 85'], isAccessiblePmr: true },
      { id: 't3b-porte-chapelle', name: 'Porte de la Chapelle', order: 9, city: 'Paris 18e', lat: 48.8975, lng: 2.3592, lines: ['T3b', 'M12', 'Bus 38'], isAccessiblePmr: true, hubId: 'station-porte-de-la-chapelle' },
      { id: 't3b-rosa-parks', name: 'Rosa Parks', order: 10, city: 'Paris 19e', lat: 48.8958, lng: 2.3734, lines: ['T3b', 'RER E', 'Bus 54'], isAccessiblePmr: true },
      { id: 't3b-porte-villette', name: 'Porte de la Villette', order: 11, city: 'Paris 19e', lat: 48.8978, lng: 2.3852, lines: ['T3b', 'M7', 'Bus 71'], isAccessiblePmr: true },
      { id: 't3b-porte-pantin', name: 'Porte de Pantin', order: 12, city: 'Paris 19e', lat: 48.8885, lng: 2.3955, lines: ['T3b', 'M5', 'Bus 75'], isAccessiblePmr: true },
      { id: 't3b-porte-lilas', name: 'Porte des Lilas', order: 13, city: 'Paris 19e/20e', lat: 48.8785, lng: 2.4082, lines: ['T3b', 'M11', 'M3bis'], isAccessiblePmr: true },
      { id: 't3b-porte-bagnolet', name: 'Porte de Bagnolet', order: 14, city: 'Paris 20e', lat: 48.8645, lng: 2.4112, lines: ['T3b', 'M3', 'Bus 76'], isAccessiblePmr: true },
      { id: 't3b-porte-montreuil', name: 'Porte de Montreuil', order: 15, city: 'Paris 20e', lat: 48.8535, lng: 2.4132, lines: ['T3b', 'M9', 'Bus 57'], isAccessiblePmr: true },
      { id: 't3b-porte-vincennes', name: 'Porte de Vincennes', order: 16, city: 'Paris 12e/20e', lat: 48.8471, lng: 2.4084, lines: ['T3b', 'T3a', 'M1', 'Bus 26', 'Bus 96'], isAccessiblePmr: true, hubId: 'station-porte-de-vincennes' },
    ],
  },

  // ==========================================
  // BUS 54 (Asnières ➔ Porte de Clichy ➔ Gare du Nord / Est ➔ Aubervilliers)
  // ==========================================
  'Bus 54': {
    key: 'Bus 54',
    name: '54',
    type: 'bus',
    bg: '#83286B',
    text: '#FFFFFF',
    directions: [
      { destination: 'Porte d\'Aubervilliers', code: 'EST' },
      { destination: 'Asnières-Gennevilliers - Gabriel Péri', code: 'OUE' },
    ],
    stops: [
      { id: 'b54-gabriel-peri', name: 'Gabriel Péri Métro', order: 1, city: 'Asnières (92)', lat: 48.9168, lng: 2.2995, lines: ['Bus 54', 'M13'], isAccessiblePmr: true },
      { id: 'b54-mairie-clichy', name: 'Mairie de Clichy', order: 2, city: 'Clichy (92)', lat: 48.9038, lng: 2.3052, lines: ['Bus 54', 'M13', 'Bus 74'], isAccessiblePmr: true },
      { id: 'b54-victor-hugo', name: 'Victor Hugo - Jean Jaurès', order: 3, city: 'Clichy (92)', lat: 48.8992, lng: 2.3092, lines: ['Bus 54', 'Bus 74'], isAccessiblePmr: true },
      { id: 'b54-porte-clichy', name: 'Porte de Clichy', order: 4, city: 'Paris 17e / Clichy', lat: 48.8944, lng: 2.3134, lines: ['Bus 54', 'M13', 'M14', 'T3b', 'RER C', 'Bus 66', 'Bus 74', 'Bus 173'], isAccessiblePmr: true, hubId: 'station-porte-de-clichy' },
      { id: 'b54-brochant', name: 'Brochant - Cardinet', order: 5, city: 'Paris 17e', lat: 48.8908, lng: 2.3197, lines: ['Bus 54', 'M13', 'Bus 66'], isAccessiblePmr: true },
      { id: 'b54-fourche', name: 'La Fourche', order: 6, city: 'Paris 17e/18e', lat: 48.8872, lng: 2.3255, lines: ['Bus 54', 'M13'], isAccessiblePmr: true },
      { id: 'b54-place-clichy', name: 'Place de Clichy', order: 7, city: 'Paris 8e/17e/18e', lat: 48.8834, lng: 2.3275, lines: ['Bus 54', 'M13', 'M2', 'Bus 80'], isAccessiblePmr: true, hubId: 'station-place-de-clichy' },
      { id: 'b54-blanche', name: 'Blanche - Moulin Rouge', order: 8, city: 'Paris 9e/18e', lat: 48.8825, lng: 2.3331, lines: ['Bus 54', 'M2'], isAccessiblePmr: true },
      { id: 'b54-pigalle', name: 'Pigalle', order: 9, city: 'Paris 9e/18e', lat: 48.8821, lng: 2.3382, lines: ['Bus 54', 'M2', 'M12'], isAccessiblePmr: true },
      { id: 'b54-anvers', name: 'Anvers - Sacré-Cœur', order: 10, city: 'Paris 9e/18e', lat: 48.8828, lng: 2.3444, lines: ['Bus 54', 'M2'], isAccessiblePmr: true },
      { id: 'b54-barbes', name: 'Barbès - Rochechouart', order: 11, city: 'Paris 9e/10e/18e', lat: 48.8836, lng: 2.3498, lines: ['Bus 54', 'M2', 'M4'], isAccessiblePmr: true },
      { id: 'b54-gare-du-nord', name: 'Gare du Nord (Dunkerque)', order: 12, city: 'Paris 10e', lat: 48.8809, lng: 2.3553, lines: ['Bus 54', 'M4', 'M5', 'RER B', 'RER D', 'RER E', 'Train H', 'Bus 38', 'Bus 91'], isAccessiblePmr: true, hubId: 'station-gare-du-nord' },
      { id: 'b54-gare-de-lest', name: 'Gare de l\'Est', order: 13, city: 'Paris 10e', lat: 48.8768, lng: 2.3592, lines: ['Bus 54', 'M4', 'M5', 'M7', 'Train P', 'Bus 38', 'Bus 91'], isAccessiblePmr: true, hubId: 'station-gare-de-lest' },
      { id: 'b54-louis-blanc', name: 'Louis Blanc', order: 14, city: 'Paris 10e', lat: 48.8812, lng: 2.3655, lines: ['Bus 54', 'M7', 'M7bis'], isAccessiblePmr: true },
      { id: 'b54-jaures', name: 'Jaurès - Stalingrad', order: 15, city: 'Paris 10e/19e', lat: 48.8832, lng: 2.3705, lines: ['Bus 54', 'M2', 'M5', 'M7bis'], isAccessiblePmr: true },
      { id: 'b54-la-chapelle', name: 'Porte d\'Aubervilliers', order: 16, city: 'Paris 18e/19e', lat: 48.8985, lng: 2.3725, lines: ['Bus 54', 'T3b'], isAccessiblePmr: true },
    ],
  },

  // ==========================================
  // BUS 66 (Mairie de Saint-Ouen ➔ Clichy ➔ Saint-Lazare ➔ Opéra)
  // ==========================================
  'Bus 66': {
    key: 'Bus 66',
    name: '66',
    type: 'bus',
    bg: '#00643C',
    text: '#FFFFFF',
    directions: [
      { destination: 'Opéra', code: 'SUD' },
      { destination: 'Mairie de Saint-Ouen', code: 'NOR' },
    ],
    stops: [
      { id: 'b66-mairie-st-ouen', name: 'Mairie de Saint-Ouen', order: 1, city: 'Saint-Ouen (93)', lat: 48.9118, lng: 2.3338, lines: ['Bus 66', 'M13', 'M14'], isAccessiblePmr: true },
      { id: 'b66-victor-hugo', name: 'Victor Hugo - Saint-Ouen', order: 2, city: 'Saint-Ouen (93)', lat: 48.9055, lng: 2.3275, lines: ['Bus 66', 'Bus 173'], isAccessiblePmr: true },
      { id: 'b66-porte-clichy', name: 'Porte de Clichy', order: 3, city: 'Paris 17e / Clichy', lat: 48.8944, lng: 2.3134, lines: ['Bus 66', 'M13', 'M14', 'T3b', 'RER C', 'Bus 54', 'Bus 74', 'Bus 173'], isAccessiblePmr: true, hubId: 'station-porte-de-clichy' },
      { id: 'b66-brochant', name: 'Brochant', order: 4, city: 'Paris 17e', lat: 48.8908, lng: 2.3197, lines: ['Bus 66', 'M13', 'Bus 54'], isAccessiblePmr: true },
      { id: 'b66-place-clichy', name: 'Place de Clichy', order: 5, city: 'Paris 8e/17e/18e', lat: 48.8834, lng: 2.3275, lines: ['Bus 66', 'M13', 'M2', 'Bus 54'], isAccessiblePmr: true },
      { id: 'b66-liege', name: 'Liège', order: 6, city: 'Paris 8e/9e', lat: 48.8797, lng: 2.3283, lines: ['Bus 66', 'M13'], isAccessiblePmr: true },
      { id: 'b66-saint-lazare', name: 'Gare Saint-Lazare', order: 7, city: 'Paris 8e/9e', lat: 48.8756, lng: 2.3258, lines: ['Bus 66', 'M13', 'M14', 'M3', 'M9', 'M12', 'RER E'], isAccessiblePmr: true, hubId: 'station-saint-lazare' },
      { id: 'b66-havre-caumartin', name: 'Havre - Caumartin', order: 8, city: 'Paris 9e', lat: 48.8732, lng: 2.3288, lines: ['Bus 66', 'M3', 'M9', 'RER A'], isAccessiblePmr: true },
      { id: 'b66-opera', name: 'Opéra (Auber)', order: 9, city: 'Paris 9e', lat: 48.8706, lng: 2.3322, lines: ['Bus 66', 'M3', 'M7', 'M8', 'RER A', 'Bus 20'], isAccessiblePmr: true, hubId: 'station-opera' },
    ],
  },

  // ==========================================
  // BUS 74 (Clichy Berges de Seine ➔ Porte de Clichy ➔ Châtelet)
  // ==========================================
  'Bus 74': {
    key: 'Bus 74',
    name: '74',
    type: 'bus',
    bg: '#C5A300',
    text: '#000000',
    directions: [
      { destination: 'Châtelet', code: 'SUD' },
      { destination: 'Clichy - Berges de Seine', code: 'NOR' },
    ],
    stops: [
      { id: 'b74-berges-seine', name: 'Clichy - Berges de Seine', order: 1, city: 'Clichy (92)', lat: 48.9102, lng: 2.2985, lines: ['Bus 74'], isAccessiblePmr: true },
      { id: 'b74-mairie-clichy', name: 'Mairie de Clichy', order: 2, city: 'Clichy (92)', lat: 48.9038, lng: 2.3052, lines: ['Bus 74', 'M13', 'Bus 54'], isAccessiblePmr: true },
      { id: 'b74-porte-clichy', name: 'Porte de Clichy', order: 3, city: 'Paris 17e / Clichy', lat: 48.8944, lng: 2.3134, lines: ['Bus 74', 'M13', 'M14', 'T3b', 'RER C', 'Bus 54', 'Bus 66', 'Bus 173'], isAccessiblePmr: true, hubId: 'station-porte-de-clichy' },
      { id: 'b74-guy-moquet', name: 'Guy Môquet', order: 4, city: 'Paris 17e/18e', lat: 48.8932, lng: 2.3275, lines: ['Bus 74', 'M13'], isAccessiblePmr: true },
      { id: 'b74-place-clichy', name: 'Place de Clichy', order: 5, city: 'Paris 8e/17e/18e', lat: 48.8834, lng: 2.3275, lines: ['Bus 74', 'M13', 'M2', 'Bus 54'], isAccessiblePmr: true },
      { id: 'b74-pigalle', name: 'Pigalle', order: 6, city: 'Paris 9e/18e', lat: 48.8821, lng: 2.3382, lines: ['Bus 74', 'M2', 'M12'], isAccessiblePmr: true },
      { id: 'b74-grands-boulevards', name: 'Grands Boulevards', order: 7, city: 'Paris 2e/9e', lat: 48.8715, lng: 2.3432, lines: ['Bus 74', 'M8', 'M9'], isAccessiblePmr: true },
      { id: 'b74-bourse', name: 'Bourse', order: 8, city: 'Paris 2e', lat: 48.8688, lng: 2.3412, lines: ['Bus 74', 'M3'], isAccessiblePmr: true },
      { id: 'b74-louvre-etienne-marcel', name: 'Louvre - Étienne Marcel', order: 9, city: 'Paris 1er/2e', lat: 48.8645, lng: 2.3445, lines: ['Bus 74', 'M4'], isAccessiblePmr: true },
      { id: 'b74-chatelet', name: 'Châtelet (Pont Neuf)', order: 10, city: 'Paris 1er/4e', lat: 48.8606, lng: 2.3476, lines: ['Bus 74', 'M1', 'M4', 'M7', 'M11', 'M14', 'RER A', 'RER B', 'RER D'], isAccessiblePmr: true, hubId: 'station-chatelet' },
    ],
  },

  // ==========================================
  // BUS 173 (Porte de Clichy ➔ Saint-Ouen ➔ Saint-Denis ➔ La Courneuve)
  // ==========================================
  'Bus 173': {
    key: 'Bus 173',
    name: '173',
    type: 'bus',
    bg: '#5291CE',
    text: '#FFFFFF',
    directions: [
      { destination: 'La Courneuve - 8 Mai 1945', code: 'EST' },
      { destination: 'Porte de Clichy', code: 'OUE' },
    ],
    stops: [
      { id: 'b173-porte-clichy', name: 'Porte de Clichy', order: 1, city: 'Paris 17e / Clichy', lat: 48.8944, lng: 2.3134, lines: ['Bus 173', 'M13', 'M14', 'T3b', 'RER C', 'Bus 54', 'Bus 66', 'Bus 74'], isAccessiblePmr: true, hubId: 'station-porte-de-clichy' },
      { id: 'b173-st-ouen-rer', name: 'Saint-Ouen RER', order: 2, city: 'Saint-Ouen (93)', lat: 48.9039, lng: 2.3255, lines: ['Bus 173', 'M14', 'RER C'], isAccessiblePmr: true },
      { id: 'b173-mairie-st-ouen', name: 'Mairie de Saint-Ouen', order: 3, city: 'Saint-Ouen (93)', lat: 48.9118, lng: 2.3338, lines: ['Bus 173', 'M13', 'M14'], isAccessiblePmr: true },
      { id: 'b173-carrefour-pleyel', name: 'Carrefour Pleyel', order: 4, city: 'Saint-Denis (93)', lat: 48.9212, lng: 2.3425, lines: ['Bus 173', 'M13'], isAccessiblePmr: true },
      { id: 'b173-st-denis-porte-paris', name: 'Saint-Denis - Porte de Paris', order: 5, city: 'Saint-Denis (93)', lat: 48.9302, lng: 2.3562, lines: ['Bus 173', 'M13', 'T8'], isAccessiblePmr: true },
      { id: 'b173-la-courneuve', name: 'La Courneuve - 8 Mai 1945', order: 6, city: 'La Courneuve (93)', lat: 48.9205, lng: 2.3955, lines: ['Bus 173', 'M7', 'T1'], isAccessiblePmr: true },
    ],
  },

  // ==========================================
  // RER C (Axe Ouest - Paris Intramuros - Sud)
  // ==========================================
  'RER C': {
    key: 'RER C',
    name: 'C',
    type: 'rer',
    bg: '#F2C500',
    text: '#000000',
    directions: [
      { destination: 'Pontoise / Saint-Quentin-en-Yvelines', code: 'OUE' },
      { destination: 'Juvisy / Dourdan / Massy-Palaiseau', code: 'EST' },
    ],
    stops: [
      { id: 'rerc-pontoise', name: 'Pontoise', order: 1, city: 'Pontoise (95)', lat: 49.0515, lng: 2.1012, lines: ['RER C', 'Train H', 'Train J'], isAccessiblePmr: true },
      { id: 'rerc-epinay', name: 'Épinay-sur-Seine', order: 2, city: 'Épinay (93)', lat: 48.9515, lng: 2.3088, lines: ['RER C', 'T8', 'T11'], isAccessiblePmr: true, hubId: 'station-epinay-sur-seine' },
      { id: 'rerc-st-ouen', name: 'Saint-Ouen', order: 3, city: 'Saint-Ouen (93)', lat: 48.9039, lng: 2.3255, lines: ['RER C', 'M14'], isAccessiblePmr: true },
      { id: 'rerc-porte-clichy', name: 'Porte de Clichy', order: 4, city: 'Paris 17e / Clichy', lat: 48.8944, lng: 2.3134, lines: ['RER C', 'M13', 'M14', 'T3b', 'Bus 54', 'Bus 66', 'Bus 74', 'Bus 173'], isAccessiblePmr: true, hubId: 'station-porte-de-clichy' },
      { id: 'rerc-pereire', name: 'Pereire - Levallois', order: 5, city: 'Paris 17e', lat: 48.8845, lng: 2.3015, lines: ['RER C', 'M3'], isAccessiblePmr: true },
      { id: 'rerc-neuilly-maillot', name: 'Neuilly - Porte Maillot', order: 6, city: 'Paris 16e/17e', lat: 48.8782, lng: 2.2825, lines: ['RER C', 'M1', 'RER E', 'T3b'], isAccessiblePmr: true },
      { id: 'rerc-champ-mars', name: 'Champ de Mars - Tour Eiffel', order: 7, city: 'Paris 7e/15e', lat: 48.8548, lng: 2.2915, lines: ['RER C', 'M6'], isAccessiblePmr: true },
      { id: 'rerc-invalides', name: 'Invalides', order: 8, city: 'Paris 7e', lat: 48.8617, lng: 2.3142, lines: ['RER C', 'M8', 'M13'], isAccessiblePmr: true, hubId: 'station-invalides' },
      { id: 'rerc-musee-orsay', name: 'Musée d\'Orsay', order: 9, city: 'Paris 7e', lat: 48.8601, lng: 2.3252, lines: ['RER C', 'M12'], isAccessiblePmr: true },
      { id: 'rerc-st-michel', name: 'Saint-Michel - Notre-Dame', order: 10, city: 'Paris 5e/6e', lat: 48.8534, lng: 2.3444, lines: ['RER C', 'RER B', 'M4'], isAccessiblePmr: true, hubId: 'station-saint-michel' },
      { id: 'rerc-austerlitz', name: 'Gare d\'Austerlitz', order: 11, city: 'Paris 13e', lat: 48.8424, lng: 2.3654, lines: ['RER C', 'M5', 'M10'], isAccessiblePmr: true, hubId: 'station-gare-dausterlitz' },
      { id: 'rerc-bibliotheque', name: 'Bibliothèque François Mitterrand', order: 12, city: 'Paris 13e', lat: 48.8299, lng: 2.3768, lines: ['RER C', 'M14', 'T3a'], isAccessiblePmr: true, hubId: 'station-bibliotheque-fm' },
      { id: 'rerc-juvisy', name: 'Juvisy', order: 13, city: 'Juvisy (91)', lat: 48.6898, lng: 2.3785, lines: ['RER C', 'RER D'], isAccessiblePmr: true, hubId: 'station-juvisy' },
      { id: 'rerc-massy', name: 'Massy - Palaiseau', order: 14, city: 'Massy (91)', lat: 48.7252, lng: 2.2605, lines: ['RER C', 'RER B', 'T12'], isAccessiblePmr: true, hubId: 'station-massy-palaiseau' },
    ],
  },

  // ==========================================
  // RER A (Défense ➔ Étoile ➔ Châtelet ➔ Lyon ➔ Nation ➔ Marne-la-Vallée)
  // ==========================================
  'RER A': {
    key: 'RER A',
    name: 'A',
    type: 'rer',
    bg: '#E3051B',
    text: '#FFFFFF',
    directions: [
      { destination: 'St-Germain / Poissy / Cergy', code: 'OUE' },
      { destination: 'Boissy-St-Léger / Marne-la-Vallée', code: 'EST' },
    ],
    stops: [
      { id: 'rera-cergy', name: 'Cergy Préfecture', order: 1, city: 'Cergy (95)', lat: 49.0366, lng: 2.0792, lines: ['RER A', 'Train L'], isAccessiblePmr: true, hubId: 'station-cergy-prefecture' },
      { id: 'rera-poissy', name: 'Poissy', order: 2, city: 'Poissy (78)', lat: 48.9328, lng: 2.0422, lines: ['RER A', 'Train J'], isAccessiblePmr: true, hubId: 'station-poissy' },
      { id: 'rera-la-defense', name: 'La Défense (Grande Arche)', order: 3, city: 'Puteaux / Courbevoie (92)', lat: 48.8918, lng: 2.2380, lines: ['RER A', 'M1', 'Train L', 'Train U', 'T2'], isAccessiblePmr: true, hubId: 'station-la-defense' },
      { id: 'rera-etoile', name: 'Charles de Gaulle - Étoile', order: 4, city: 'Paris 8e/16e/17e', lat: 48.8738, lng: 2.2950, lines: ['RER A', 'M1', 'M2', 'M6'], isAccessiblePmr: true, hubId: 'station-etoile' },
      { id: 'rera-auber', name: 'Auber (Opéra)', order: 5, city: 'Paris 9e', lat: 48.8715, lng: 2.3295, lines: ['RER A', 'M3', 'M7', 'M8', 'M9'], isAccessiblePmr: true },
      { id: 'rera-chatelet', name: 'Châtelet - Les Halles', order: 6, city: 'Paris 1er', lat: 48.8606, lng: 2.3476, lines: ['RER A', 'RER B', 'RER D', 'M1', 'M4', 'M7', 'M11', 'M14'], isAccessiblePmr: true, hubId: 'station-chatelet' },
      { id: 'rera-gare-de-lyon', name: 'Gare de Lyon', order: 7, city: 'Paris 12e', lat: 48.8449, lng: 2.3734, lines: ['RER A', 'RER D', 'M1', 'M14', 'Train R'], isAccessiblePmr: true, hubId: 'station-gare-de-lyon' },
      { id: 'rera-nation', name: 'Nation', order: 8, city: 'Paris 11e/12e', lat: 48.8482, lng: 2.3959, lines: ['RER A', 'M1', 'M2', 'M6', 'M9'], isAccessiblePmr: true, hubId: 'station-nation' },
      { id: 'rera-val-de-fontenay', name: 'Val de Fontenay', order: 9, city: 'Fontenay-sous-Bois (94)', lat: 48.8545, lng: 2.4862, lines: ['RER A', 'RER E'], isAccessiblePmr: true },
    ],
  },

  // ==========================================
  // MÉTRO 1 (La Défense ➔ Châtelet ➔ Vincennes)
  // ==========================================
  'M1': {
    key: 'M1',
    name: '1',
    type: 'metro',
    bg: '#FFCD00',
    text: '#000000',
    directions: [
      { destination: 'La Défense (Grande Arche)', code: 'DEF' },
      { destination: 'Château de Vincennes', code: 'VIN' },
    ],
    stops: [
      { id: 'm1-la-defense', name: 'La Défense (Grande Arche)', order: 1, city: 'Puteaux / Courbevoie', lat: 48.8918, lng: 2.2380, lines: ['M1', 'RER A', 'T2', 'Train L', 'Train U'], isAccessiblePmr: true, hubId: 'station-la-defense' },
      { id: 'm1-esplanade', name: 'Esplanade de La Défense', order: 2, city: 'Courbevoie', lat: 48.8885, lng: 2.2505, lines: ['M1'], isAccessiblePmr: true },
      { id: 'm1-pont-neuilly', name: 'Pont de Neuilly', order: 3, city: 'Neuilly (92)', lat: 48.8852, lng: 2.2595, lines: ['M1'], isAccessiblePmr: true },
      { id: 'm1-porte-maillot', name: 'Porte Maillot', order: 4, city: 'Paris 16e/17e', lat: 48.8782, lng: 2.2825, lines: ['M1', 'RER C', 'RER E', 'T3b'], isAccessiblePmr: true },
      { id: 'm1-etoile', name: 'Charles de Gaulle - Étoile', order: 5, city: 'Paris 8e/16e/17e', lat: 48.8738, lng: 2.2950, lines: ['M1', 'M2', 'M6', 'RER A'], isAccessiblePmr: true, hubId: 'station-etoile' },
      { id: 'm1-concorde', name: 'Concorde', order: 6, city: 'Paris 1er/8e', lat: 48.8656, lng: 2.3212, lines: ['M1', 'M8', 'M12'], isAccessiblePmr: true, hubId: 'station-concorde' },
      { id: 'm1-palais-royal', name: 'Palais Royal - Musée du Louvre', order: 7, city: 'Paris 1er', lat: 48.8625, lng: 2.3362, lines: ['M1', 'M7'], isAccessiblePmr: true },
      { id: 'm1-chatelet', name: 'Châtelet', order: 8, city: 'Paris 1er/4e', lat: 48.8606, lng: 2.3476, lines: ['M1', 'M4', 'M7', 'M11', 'M14', 'RER A', 'RER B', 'RER D'], isAccessiblePmr: true, hubId: 'station-chatelet' },
      { id: 'm1-bastille', name: 'Bastille', order: 9, city: 'Paris 4e/11e/12e', lat: 48.8532, lng: 2.3698, lines: ['M1', 'M5', 'M8'], isAccessiblePmr: true, hubId: 'station-bastille' },
      { id: 'm1-gare-de-lyon', name: 'Gare de Lyon', order: 10, city: 'Paris 12e', lat: 48.8449, lng: 2.3734, lines: ['M1', 'M14', 'RER A', 'RER D', 'Train R'], isAccessiblePmr: true, hubId: 'station-gare-de-lyon' },
      { id: 'm1-nation', name: 'Nation', order: 11, city: 'Paris 11e/12e', lat: 48.8482, lng: 2.3959, lines: ['M1', 'M2', 'M6', 'M9', 'RER A'], isAccessiblePmr: true, hubId: 'station-nation' },
      { id: 'm1-porte-vincennes', name: 'Porte de Vincennes', order: 12, city: 'Paris 12e/20e', lat: 48.8471, lng: 2.4084, lines: ['M1', 'T3a', 'T3b'], isAccessiblePmr: true, hubId: 'station-porte-de-vincennes' },
      { id: 'm1-chateau-vincennes', name: 'Château de Vincennes', order: 13, city: 'Vincennes (94)', lat: 48.8445, lng: 2.4412, lines: ['M1'], isAccessiblePmr: true },
    ],
  },

  // ==========================================
  // RER B (Aéroport CDG / Mitry ➔ Châtelet ➔ St-Rémy / Robinson)
  // ==========================================
  'RER B': {
    key: 'RER B',
    name: 'B',
    type: 'rer',
    bg: '#5291CE',
    text: '#FFFFFF',
    directions: [
      { destination: 'Aéroport CDG 2 / Mitry-Claye', code: 'NOR' },
      { destination: 'Robinson / St-Rémy-lès-Chevreuse', code: 'SUD' },
    ],
    stops: [
      { id: 'rerb-cdg', name: 'Aéroport Charles de Gaulle 2 TGV', order: 1, city: 'Roissy (95)', lat: 49.0039, lng: 2.5712, lines: ['RER B', 'TGV'], isAccessiblePmr: true },
      { id: 'rerb-aulnay', name: 'Aulnay-sous-Bois', order: 2, city: 'Aulnay (93)', lat: 48.9325, lng: 2.4948, lines: ['RER B', 'Train K', 'T4'], isAccessiblePmr: true, hubId: 'station-aulnay-sous-bois' },
      { id: 'rerb-st-denis-stade', name: 'La Plaine - Stade de France', order: 3, city: 'Saint-Denis (93)', lat: 48.9182, lng: 2.3625, lines: ['RER B'], isAccessiblePmr: true },
      { id: 'rerb-gare-du-nord', name: 'Gare du Nord', order: 4, city: 'Paris 10e', lat: 48.8809, lng: 2.3553, lines: ['RER B', 'RER D', 'RER E', 'M4', 'M5', 'Train H'], isAccessiblePmr: true, hubId: 'station-gare-du-nord' },
      { id: 'rerb-chatelet', name: 'Châtelet - Les Halles', order: 5, city: 'Paris 1er', lat: 48.8606, lng: 2.3476, lines: ['RER B', 'RER A', 'RER D', 'M1', 'M4', 'M7', 'M11', 'M14'], isAccessiblePmr: true, hubId: 'station-chatelet' },
      { id: 'rerb-st-michel', name: 'Saint-Michel - Notre-Dame', order: 6, city: 'Paris 5e/6e', lat: 48.8534, lng: 2.3444, lines: ['RER B', 'RER C', 'M4'], isAccessiblePmr: true, hubId: 'station-saint-michel' },
      { id: 'rerb-luxembourg', name: 'Luxembourg', order: 7, city: 'Paris 5e/6e', lat: 48.8465, lng: 2.3395, lines: ['RER B'], isAccessiblePmr: true },
      { id: 'rerb-denfert', name: 'Denfert-Rochereau', order: 8, city: 'Paris 14e', lat: 48.8339, lng: 2.3324, lines: ['RER B', 'M4', 'M6'], isAccessiblePmr: true, hubId: 'station-denfert-rochereau' },
      { id: 'rerb-cite-univ', name: 'Cité Universitaire', order: 9, city: 'Paris 14e', lat: 48.8202, lng: 2.3385, lines: ['RER B', 'T3a'], isAccessiblePmr: true },
      { id: 'rerb-bourg-la-reine', name: 'Bourg-la-Reine', order: 10, city: 'Bourg-la-Reine (92)', lat: 48.7798, lng: 2.3145, lines: ['RER B'], isAccessiblePmr: true },
      { id: 'rerb-massy', name: 'Massy - Palaiseau', order: 11, city: 'Massy (91)', lat: 48.7252, lng: 2.2605, lines: ['RER B', 'RER C', 'T12'], isAccessiblePmr: true, hubId: 'station-massy-palaiseau' },
    ],
  },
};

/**
 * Perturbations, Retards et Grèves en temps réel sur le réseau IDF
 */
export const SAMPLE_IDF_DISRUPTIONS: TransitDisruptionItem[] = [
  // =========================================================================
  // ⛔ LES 21 STATIONS DE MÉTRO FERMÉES SUR ORDRE DE LA PRÉFECTURE DE POLICE
  // =========================================================================
  {
    id: 'disrup-close-chatelet',
    lineKey: 'M1',
    lineLabel: 'Châtelet (M1, M4, M7, M11, M14, RER A, B, D)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Châtelet FERMÉE par mesure de sécurité',
    description: 'Fermeture de la station à la demande de la Préfecture de Police. Trains sans arrêt et correspondances fermées sur toutes les lignes.',
    impactedSection: 'Pôle d\'échange Châtelet',
    estimatedResolution: 'Jusqu\'à nouvel ordre de la Préfecture',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-les-halles',
    lineKey: 'M4',
    lineLabel: 'Les Halles (M4)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Les Halles FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 4 sans arrêt.',
    impactedSection: 'Station Les Halles',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-etoile',
    lineKey: 'M1',
    lineLabel: 'Charles de Gaulle – Étoile (M1, M2, M6, RER A)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Charles de Gaulle – Étoile FERMÉE',
    description: 'Fermeture totale par mesure de sécurité (Préfecture de Police). RER A et métros 1, 2, 6 ne marquent pas l\'arrêt.',
    impactedSection: 'Pôle Étoile',
    estimatedResolution: 'Jusqu\'à nouvel ordre',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-bastille',
    lineKey: 'M1',
    lineLabel: 'Bastille (M1, M5, M8)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Bastille FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Trains sans arrêt et correspondances fermées sur M1, M5 et M8.',
    impactedSection: 'Station Bastille',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-concorde',
    lineKey: 'M1',
    lineLabel: 'Concorde (M1, M8, M12)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Concorde FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Correspondances fermées entre les lignes 1, 8 et 12.',
    impactedSection: 'Station Concorde',
    estimatedResolution: 'Jusqu\'à nouvel ordre',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-clemenceau',
    lineKey: 'M1',
    lineLabel: 'Champs-Élysées – Clemenceau (M1, M13)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Champs-Élysées – Clemenceau FERMÉE',
    description: 'Fermeture par mesure de sécurité sur ordre de la Préfecture de Police. Lignes 1 et 13 sans arrêt.',
    impactedSection: 'Secteur Champs-Élysées',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-roosevelt',
    lineKey: 'M1',
    lineLabel: 'Franklin D. Roosevelt (M1, M9)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Franklin D. Roosevelt FERMÉE',
    description: 'Fermeture par mesure de sécurité. Trains sans arrêt sur les lignes 1 et 9.',
    impactedSection: 'Station Franklin D. Roosevelt',
    estimatedResolution: 'Jusqu\'à nouvel ordre',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-george-v',
    lineKey: 'M1',
    lineLabel: 'George V (M1)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station George V FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 1 sans arrêt.',
    impactedSection: 'Station George V',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-tuileries',
    lineKey: 'M1',
    lineLabel: 'Tuileries (M1)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Tuileries FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 1 sans arrêt.',
    impactedSection: 'Station Tuileries',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-argentine',
    lineKey: 'M1',
    lineLabel: 'Argentine (M1)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Argentine FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 1 sans arrêt.',
    impactedSection: 'Station Argentine',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-reuilly',
    lineKey: 'M1',
    lineLabel: 'Reuilly – Diderot (M1, M8)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Reuilly – Diderot FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Lignes 1 et 8 sans arrêt.',
    impactedSection: 'Station Reuilly – Diderot',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-invalides',
    lineKey: 'M8',
    lineLabel: 'Invalides (M8, M13, RER C)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Invalides FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. RER C, métros 8 et 13 sans arrêt. Correspondances fermées.',
    impactedSection: 'Pôle Invalides',
    estimatedResolution: 'Jusqu\'à nouvel ordre',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-chemin-vert',
    lineKey: 'M8',
    lineLabel: 'Chemin Vert (M8)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Chemin Vert FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 8 sans arrêt.',
    impactedSection: 'Station Chemin Vert',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-filles-calvaire',
    lineKey: 'M8',
    lineLabel: 'Filles du Calvaire (M8)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Filles du Calvaire FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 8 sans arrêt.',
    impactedSection: 'Station Filles du Calvaire',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-froissart',
    lineKey: 'M8',
    lineLabel: 'Saint-Sébastien – Froissart (M8)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Saint-Sébastien – Froissart FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 8 sans arrêt.',
    impactedSection: 'Station Froissart',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-miromesnil',
    lineKey: 'M9',
    lineLabel: 'Miromesnil (M9, M13)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Miromesnil FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Correspondances fermées entre les lignes 9 et 13.',
    impactedSection: 'Station Miromesnil',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-vaneau',
    lineKey: 'M10',
    lineLabel: 'Vaneau (M10)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Vaneau FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 10 sans arrêt.',
    impactedSection: 'Station Vaneau',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-assemblee',
    lineKey: 'M12',
    lineLabel: 'Assemblée Nationale (M12)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Assemblée Nationale FERMÉE',
    description: 'Fermeture par mesure de sécurité sur ordre de la Préfecture de Police. Ligne 12 sans arrêt.',
    impactedSection: 'Station Assemblée Nationale',
    estimatedResolution: 'Jusqu\'à nouvel ordre',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-solferino',
    lineKey: 'M12',
    lineLabel: 'Solférino (M12)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Solférino FERMÉE',
    description: 'Fermeture par mesure de sécurité. Ligne 12 sans arrêt.',
    impactedSection: 'Station Solférino',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-bac',
    lineKey: 'M12',
    lineLabel: 'Rue du Bac (M12)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Rue du Bac FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 12 sans arrêt.',
    impactedSection: 'Station Rue du Bac',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-close-varenne',
    lineKey: 'M13',
    lineLabel: 'Varenne (M13)',
    type: 'station_closure',
    severity: 'critical',
    title: '⛔ Station Varenne FERMÉE',
    description: 'Fermeture sur ordre de la Préfecture de Police. Ligne 13 sans arrêt.',
    impactedSection: 'Station Varenne',
    estimatedResolution: 'En cours',
    updatedAt: 'En direct',
  },

  // =========================================================================
  // 🚫 INTERRUPTIONS DE LIGNES ASSOCIÉES
  // =========================================================================
  {
    id: 'disrup-line-6-interrupted',
    lineKey: 'M6',
    lineLabel: 'Métro 6',
    type: 'cancellation',
    severity: 'critical',
    title: 'Trafic INTERROMPU entre Kléber et Charles de Gaulle – Étoile',
    description: 'À la demande de la Préfecture de Police pour sécurisation du secteur Étoile, le trafic est interrompu entre Kléber et Charles de Gaulle – Étoile.',
    impactedSection: 'Kléber ↔ Charles de Gaulle – Étoile',
    estimatedResolution: 'Jusqu\'à nouvel ordre de la Préfecture',
    updatedAt: 'En direct',
  },
  {
    id: 'disrup-line-11-interrupted',
    lineKey: 'M11',
    lineLabel: 'Métro 11',
    type: 'cancellation',
    severity: 'critical',
    title: 'Trafic INTERROMPU entre Hôtel de Ville et Châtelet',
    description: 'En raison de la fermeture de la station Châtelet ordonnée par la Préfecture de Police, la ligne 11 est terminus provisoire à Hôtel de Ville.',
    impactedSection: 'Hôtel de Ville ↔ Châtelet',
    estimatedResolution: 'Jusqu\'à nouvel ordre',
    updatedAt: 'En direct',
  },

  // =========================================================================
  // ⚠️ RETARDS ET GRÈVES DU RÉSEAU
  // =========================================================================
  {
    id: 'disrup-rer-b',
    lineKey: 'RER B',
    lineLabel: 'RER B',
    type: 'delay',
    severity: 'critical',
    title: 'Interconnexion suspendue à Gare du Nord vers Châtelet',
    description: 'En raison de la fermeture sécuritaire du pôle Châtelet, rupture de charge obligatoire à Gare du Nord.',
    impactedSection: 'Gare du Nord ↔ Châtelet - Les Halles',
    estimatedResolution: 'En cours',
    updatedAt: 'Il y a 5 min',
  },
  {
    id: 'disrup-rer-c',
    lineKey: 'RER C',
    lineLabel: 'RER C',
    type: 'strike',
    severity: 'warning',
    title: 'Mouvement social SNCF : 1 train sur 2 prévu',
    description: 'Préavis de grève national. Prévoir 1 train sur 2 sur la branche Pontoise et les axes Rive Gauche.',
    impactedSection: 'Ensemble de la ligne C',
    estimatedResolution: 'Valable toute la journée',
    updatedAt: 'Il y a 10 min',
  },
];
