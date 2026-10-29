import { RATP_LINES_METADATA, getRealtimeDeparturesForStation } from './ratpRealtimeService';

export interface MetroStation {
  id: string;
  name: string;
  lines: string[];
  lat: number;
  lng: number;
}

export interface MetroRouteLeg {
  line: string;
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
  origin: MetroStation;
  destination: MetroStation;
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

// Stations majeures du réseau RATP avec coordonnées géographiques précises
export const METRO_NETWORK_STATIONS: MetroStation[] = [
  {
    id: 'station-chatelet',
    name: 'Châtelet - Les Halles',
    lines: ['M1', 'M4', 'M7', 'M11', 'M14', 'RER A', 'RER B', 'RER D'],
    lat: 48.8606,
    lng: 2.3476,
  },
  {
    id: 'station-republique',
    name: 'République',
    lines: ['M3', 'M5', 'M8', 'M9', 'M11'],
    lat: 48.8675,
    lng: 2.3638,
  },
  {
    id: 'station-bastille',
    name: 'Bastille',
    lines: ['M1', 'M5', 'M8'],
    lat: 48.8532,
    lng: 2.3698,
  },
  {
    id: 'station-gare-de-lyon',
    name: 'Gare de Lyon',
    lines: ['M1', 'M14', 'RER A', 'RER D'],
    lat: 48.8449,
    lng: 2.3734,
  },
  {
    id: 'station-gare-du-nord',
    name: 'Gare du Nord',
    lines: ['M4', 'M5', 'RER B', 'RER D', 'RER E'],
    lat: 48.8809,
    lng: 2.3553,
  },
  {
    id: 'station-concorde',
    name: 'Concorde',
    lines: ['M1', 'M8', 'M12'],
    lat: 48.8656,
    lng: 2.3212,
  },
  {
    id: 'station-opera',
    name: 'Opéra',
    lines: ['M3', 'M7', 'M8'],
    lat: 48.8706,
    lng: 2.3322,
  },
  {
    id: 'station-nation',
    name: 'Nation',
    lines: ['M1', 'M2', 'M6', 'M9', 'RER A'],
    lat: 48.8484,
    lng: 2.3959,
  },
  {
    id: 'station-saint-lazare',
    name: 'Saint-Lazare',
    lines: ['M3', 'M12', 'M13', 'M14', 'RER E'],
    lat: 48.8763,
    lng: 2.3255,
  },
  {
    id: 'station-etoile',
    name: 'Charles de Gaulle - Étoile',
    lines: ['M1', 'M2', 'M6', 'RER A'],
    lat: 48.8738,
    lng: 2.2950,
  },
  {
    id: 'station-montparnasse',
    name: 'Montparnasse - Bienvenüe',
    lines: ['M4', 'M6', 'M12', 'M13'],
    lat: 48.8421,
    lng: 2.3219,
  },
  {
    id: 'station-la-defense',
    name: 'La Défense (Grande Arche)',
    lines: ['M1', 'RER A'],
    lat: 48.8918,
    lng: 2.2380,
  },
];

interface DirectLink {
  stationA: string;
  stationB: string;
  line: string;
  directionAtoB: string;
  directionBtoA: string;
  durationMin: number;
  stops: number;
}

// Liaisons directes du réseau
const DIRECT_LINKS: DirectLink[] = [
  // Ligne 1
  { stationA: 'station-la-defense', stationB: 'station-etoile', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 7, stops: 4 },
  { stationA: 'station-etoile', stationB: 'station-concorde', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 5, stops: 3 },
  { stationA: 'station-concorde', stationB: 'station-chatelet', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 4, stops: 3 },
  { stationA: 'station-chatelet', stationB: 'station-bastille', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 5, stops: 3 },
  { stationA: 'station-bastille', stationB: 'station-gare-de-lyon', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 3, stops: 1 },
  { stationA: 'station-gare-de-lyon', stationB: 'station-nation', line: 'M1', directionAtoB: 'Château de Vincennes', directionBtoA: 'La Défense', durationMin: 5, stops: 3 },

  // Ligne 11
  { stationA: 'station-chatelet', stationB: 'station-republique', line: 'M11', directionAtoB: 'Rosny - Bois-Perrier', directionBtoA: 'Châtelet', durationMin: 4, stops: 3 },

  // Ligne 14
  { stationA: 'station-saint-lazare', stationB: 'station-chatelet', line: 'M14', directionAtoB: 'Aéroport d\'Orly', directionBtoA: 'Saint-Denis Pleyel', durationMin: 4, stops: 2 },
  { stationA: 'station-chatelet', stationB: 'station-gare-de-lyon', line: 'M14', directionAtoB: 'Aéroport d\'Orly', directionBtoA: 'Saint-Denis Pleyel', durationMin: 3, stops: 1 },

  // Ligne 4
  { stationA: 'station-gare-du-nord', stationB: 'station-chatelet', line: 'M4', directionAtoB: 'Bagneux - Lucie Aubrac', directionBtoA: 'Porte de Clignancourt', durationMin: 7, stops: 5 },
  { stationA: 'station-chatelet', stationB: 'station-montparnasse', line: 'M4', directionAtoB: 'Bagneux - Lucie Aubrac', directionBtoA: 'Porte de Clignancourt', durationMin: 9, stops: 6 },

  // Ligne 5
  { stationA: 'station-gare-du-nord', stationB: 'station-republique', line: 'M5', directionAtoB: 'Place d\'Italie', directionBtoA: 'Bobigny - Pablo Picasso', durationMin: 5, stops: 3 },
  { stationA: 'station-republique', stationB: 'station-bastille', line: 'M5', directionAtoB: 'Place d\'Italie', directionBtoA: 'Bobigny - Pablo Picasso', durationMin: 5, stops: 3 },

  // Ligne 8
  { stationA: 'station-concorde', stationB: 'station-opera', line: 'M8', directionAtoB: 'Pointe du Lac', directionBtoA: 'Balard', durationMin: 3, stops: 2 },
  { stationA: 'station-opera', stationB: 'station-republique', line: 'M8', directionAtoB: 'Pointe du Lac', directionBtoA: 'Balard', durationMin: 6, stops: 4 },
  { stationA: 'station-republique', stationB: 'station-bastille', line: 'M8', directionAtoB: 'Pointe du Lac', directionBtoA: 'Balard', durationMin: 5, stops: 3 },

  // Ligne 3
  { stationA: 'station-saint-lazare', stationB: 'station-opera', line: 'M3', directionAtoB: 'Gallieni', directionBtoA: 'Pont de Levallois', durationMin: 2, stops: 1 },
  { stationA: 'station-opera', stationB: 'station-republique', line: 'M3', directionAtoB: 'Gallieni', directionBtoA: 'Pont de Levallois', durationMin: 7, stops: 5 },

  // Ligne 9
  { stationA: 'station-republique', stationB: 'station-nation', line: 'M9', directionAtoB: 'Mairie de Montreuil', directionBtoA: 'Pont de Sèvres', durationMin: 8, stops: 5 },

  // Ligne 12
  { stationA: 'station-saint-lazare', stationB: 'station-concorde', line: 'M12', directionAtoB: 'Mairie d\'Issy', directionBtoA: 'Mairie d\'Aubervilliers', durationMin: 4, stops: 3 },
  { stationA: 'station-concorde', stationB: 'station-montparnasse', line: 'M12', directionAtoB: 'Mairie d\'Issy', directionBtoA: 'Mairie d\'Aubervilliers', durationMin: 8, stops: 5 },

  // Ligne 7
  { stationA: 'station-opera', stationB: 'station-chatelet', line: 'M7', directionAtoB: 'Mairie d\'Ivry / Villejuif', directionBtoA: 'La Courneuve', durationMin: 5, stops: 4 },

  // RER A (Ligne express majeure)
  { stationA: 'station-la-defense', stationB: 'station-etoile', line: 'RER A', directionAtoB: 'Marne-la-Vallée / Boissy', directionBtoA: 'Cergy / Poissy / St-Germain', durationMin: 4, stops: 1 },
  { stationA: 'station-etoile', stationB: 'station-chatelet', line: 'RER A', directionAtoB: 'Marne-la-Vallée / Boissy', directionBtoA: 'Cergy / Poissy / St-Germain', durationMin: 4, stops: 1 },
  { stationA: 'station-chatelet', stationB: 'station-gare-de-lyon', line: 'RER A', directionAtoB: 'Marne-la-Vallée / Boissy', directionBtoA: 'Cergy / Poissy / St-Germain', durationMin: 3, stops: 1 },
  { stationA: 'station-gare-de-lyon', stationB: 'station-nation', line: 'RER A', directionAtoB: 'Marne-la-Vallée / Boissy', directionBtoA: 'Cergy / Poissy / St-Germain', durationMin: 3, stops: 1 },

  // RER B
  { stationA: 'station-gare-du-nord', stationB: 'station-chatelet', line: 'RER B', directionAtoB: 'Robinson / St-Rémy', directionBtoA: 'Aéroport CDG 2 / Mitry', durationMin: 4, stops: 1 },

  // RER D
  { stationA: 'station-gare-du-nord', stationB: 'station-chatelet', line: 'RER D', directionAtoB: 'Melun / Corbeil', directionBtoA: 'Creil / Orry-la-Ville', durationMin: 4, stops: 1 },
  { stationA: 'station-chatelet', stationB: 'station-gare-de-lyon', line: 'RER D', directionAtoB: 'Melun / Corbeil', directionBtoA: 'Creil / Orry-la-Ville', durationMin: 3, stops: 1 },

  // RER E
  { stationA: 'station-gare-du-nord', stationB: 'station-saint-lazare', line: 'RER E', directionAtoB: 'Nanterre - La Folie', directionBtoA: 'Chelles / Tournan', durationMin: 4, stops: 1 },
];

/**
 * Recherche une station par son identifiant ou une sous-chaîne de son nom
 */
export function findMetroStation(queryOrId: string): MetroStation | undefined {
  const q = queryOrId.toLowerCase().trim();
  return METRO_NETWORK_STATIONS.find(
    (s) => s.id.toLowerCase() === q || s.name.toLowerCase().includes(q)
  );
}

/**
 * Calcule l'itinéraire optimal en métro / RER entre 2 stations
 * et génère l'heure exacte de départ et le décompte en temps réel.
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

  // 1. Recherche de liaison directe immédiate
  const directLink = DIRECT_LINKS.find(
    (l) => (l.stationA === origin.id && l.stationB === dest.id) ||
           (l.stationB === origin.id && l.stationA === dest.id)
  );

  let legsPlan: {
    line: string;
    from: MetroStation;
    to: MetroStation;
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
      transferStation: MetroStation;
      totalDuration: number;
    } | null = null;

    for (const pivot of METRO_NETWORK_STATIONS) {
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

      const duration = link1.durationMin + link2.durationMin + 3; // +3 min de correspondance à pied
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

  // Formatage propre "HH:mm" (ex: "15:23")
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

    legs.push({
      line: leg.line,
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
