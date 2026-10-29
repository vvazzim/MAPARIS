import { RealtimeDeparture } from '../types';
import { useState, useEffect } from 'react';

// Métadonnées officielles des lignes RATP (Couleurs officielles IDFM & Terminus)
export interface LineMetadata {
  name: string;
  type: 'metro' | 'rer';
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
  'M1': {
    name: '1',
    type: 'metro',
    bg: '#FFCD00',
    text: '#000000',
    peakHeadwayMin: 2,
    offPeakHeadwayMin: 4,
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
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
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
    offPeakHeadwayMin: 4,
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
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
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
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
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
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
    directions: [
      { destination: 'Pont de Sèvres', code: 'SEV' },
      { destination: 'Mairie de Montreuil', code: 'MON' },
    ],
  },
  'M11': {
    name: '11',
    type: 'metro',
    bg: '#704B1C',
    text: '#FFFFFF',
    peakHeadwayMin: 3,
    offPeakHeadwayMin: 5,
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
  'M14': {
    name: '14',
    type: 'metro',
    bg: '#62259D',
    text: '#FFFFFF',
    peakHeadwayMin: 2,
    offPeakHeadwayMin: 3.5,
    directions: [
      { destination: 'Saint-Denis Pleyel', code: 'PLE' },
      { destination: 'Aéroport d\'Orly', code: 'ORL' },
    ],
  },
  'RER A': {
    name: 'A',
    type: 'rer',
    bg: '#E3051B',
    text: '#FFFFFF',
    peakHeadwayMin: 4,
    offPeakHeadwayMin: 7,
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
    peakHeadwayMin: 4,
    offPeakHeadwayMin: 8,
    directions: [
      { destination: 'Aéroport CDG 2 / Mitry-Claye', code: 'NOR' },
      { destination: 'Robinson / St-Rémy-lès-Chevreuse', code: 'SUD' },
    ],
  },
  'RER D': {
    name: 'D',
    type: 'rer',
    bg: '#00814F',
    text: '#FFFFFF',
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 10,
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
    peakHeadwayMin: 5,
    offPeakHeadwayMin: 10,
    directions: [
      { destination: 'Nanterre - La Folie', code: 'NAN' },
      { destination: 'Chelles-Gournay / Tournan', code: 'CHE' },
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

/**
 * Détermine l'intervalle moyen (headway) selon l'heure de la journée à Paris
 */
function getHeadwayMinutes(lineMeta: LineMetadata, hour: number, isWeekend: boolean): number {
  // Période de pointe semaine (07h30-09h30 & 16h30-19h30)
  const isPeak = !isWeekend && ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 20));
  
  // Soirée (21h30 - 01h30)
  const isEvening = hour >= 21 || hour < 2;

  if (isPeak) {
    return lineMeta.peakHeadwayMin;
  }
  if (isEvening) {
    return lineMeta.offPeakHeadwayMin * 1.5;
  }
  return lineMeta.offPeakHeadwayMin;
}

/**
 * Calcule les prochains passages en temps réel pour une station et ses lignes
 */
export function getRealtimeDeparturesForStation(
  stationId: string,
  lines: string[],
  stationStatus: 'normal' | 'disrupted' | 'closed' = 'normal',
  currentTime: Date = new Date()
): RealtimeDeparture[] {
  const departures: RealtimeDeparture[] = [];

  // Obtenir l'heure courante (fuseau Paris)
  const hour = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const day = currentTime.getDay();
  const isWeekend = day === 0 || day === 6;

  // Créneau de nuit métro (fermeture de 01h15 à 05h30 en semaine, 02h15 le week-end)
  const nightCloseHour = isWeekend ? 2 : 1;
  const isNightClosed = (hour > nightCloseHour || (hour === nightCloseHour && minutes >= 15)) && hour < 5;

  lines.forEach((lineKey) => {
    const meta = RATP_LINES_METADATA[lineKey];
    if (!meta) return;

    meta.directions.forEach((dir) => {
      // Si la station est fermée
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

      // Si le service est fermé pour la nuit
      if (isNightClosed) {
        departures.push({
          line: lineKey,
          destination: dir.destination,
          remainingMinutes: 999,
          remainingDisplay: 'Reprise 05:30',
          followingDisplay: 'Noctilien',
          isRealtime: false,
          status: 'on_time',
        });
        return;
      }

      // Calcul du cycle en secondes pour cette ligne et direction
      const headwayMin = getHeadwayMinutes(meta, hour, isWeekend);
      const headwaySec = Math.max(120, Math.round(headwayMin * 60));

      // Déphasage unique et stable par (station + ligne + terminus)
      const seedKey = `${stationId}_${lineKey}_${dir.code}`;
      const phaseOffset = hashString(seedKey) % headwaySec;

      // Seconde actuelle dans l'époque unix pour assurer une continuité temporelle réelle
      const totalCurrentSeconds = Math.floor(currentTime.getTime() / 1000);
      const cyclePos = (totalCurrentSeconds + phaseOffset) % headwaySec;
      const secondsUntilNext = headwaySec - cyclePos;

      // Perturbation éventuelle (+3 à 6 min de retard)
      const isDisrupted = stationStatus === 'disrupted';
      const delaySec = isDisrupted ? (hashString(seedKey + '_delay') % 240) + 120 : 0;
      const effectiveSec = secondsUntilNext + delaySec;

      const remainingMin = Math.floor(effectiveSec / 60);
      const followingMin = remainingMin + Math.round(headwayMin);

      let remainingDisplay: string;
      if (remainingMin === 0) {
        if (effectiveSec < 35) {
          remainingDisplay = "À l'approche";
        } else {
          remainingDisplay = '< 1 min';
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

  return departures;
}

/**
 * Récupère le style graphique officiel d'une ligne
 */
export function getLineStyle(lineKey: string): { bg: string; text: string; label: string } {
  const meta = RATP_LINES_METADATA[lineKey];
  if (!meta) {
    return { bg: '#334155', text: '#FFFFFF', label: lineKey };
  }
  return {
    bg: meta.bg,
    text: meta.text,
    label: meta.name,
  };
}

/**
 * Hook React pour afficher et rafraîchir automatiquement les passages en temps réel
 */
export function useRealtimeDepartures(
  stationId: string,
  lines: string[],
  stationStatus: 'normal' | 'disrupted' | 'closed' = 'normal',
  refreshIntervalSec: number = 5
) {
  const [departures, setDepartures] = useState<RealtimeDeparture[]>(() =>
    getRealtimeDeparturesForStation(stationId, lines, stationStatus, new Date())
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Calcul immédiat
    const update = () => {
      const now = new Date();
      setDepartures(getRealtimeDeparturesForStation(stationId, lines, stationStatus, now));
      setLastUpdated(now);
    };

    update();
    const timer = setInterval(update, refreshIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [stationId, JSON.stringify(lines), stationStatus, refreshIntervalSec]);

  return { departures, lastUpdated };
}
