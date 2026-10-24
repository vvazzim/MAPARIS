export interface ParisLandmark {
  name: string;
  category: 'place' | 'metro' | 'gare' | 'monument' | 'porte';
  lat: number;
  lng: number;
  district?: string;
}

export const PARIS_LANDMARKS: ParisLandmark[] = [
  // Grandes Places & Hubs
  { name: 'Place de la Bastille', category: 'place', lat: 48.8532, lng: 2.3698, district: 'Paris 11e' },
  { name: 'Place de la République', category: 'place', lat: 48.8675, lng: 2.3638, district: 'Paris 11e' },
  { name: 'Place de la Nation', category: 'place', lat: 48.8484, lng: 2.3959, district: 'Paris 12e' },
  { name: 'Place de la Concorde', category: 'place', lat: 48.8656, lng: 2.3212, district: 'Paris 8e' },
  { name: 'Châtelet - Les Halles', category: 'metro', lat: 48.8606, lng: 2.3476, district: 'Paris 1er' },
  { name: 'Place d\'Italie', category: 'place', lat: 48.8315, lng: 2.3556, district: 'Paris 13e' },
  { name: 'Hôtel de Ville', category: 'monument', lat: 48.8566, lng: 2.3522, district: 'Paris 4e' },
  { name: 'Saint-Michel / Notre-Dame', category: 'place', lat: 48.8530, lng: 2.3444, district: 'Paris 5e' },
  { name: 'Odéon / Saint-Germain', category: 'place', lat: 48.8522, lng: 2.3387, district: 'Paris 6e' },
  { name: 'Strasbourg - Saint-Denis', category: 'metro', lat: 48.8696, lng: 2.3541, district: 'Paris 10e' },
  { name: 'Place du Colonel Fabien', category: 'place', lat: 48.8776, lng: 2.3702, district: 'Paris 10e' },
  { name: 'Belleville', category: 'metro', lat: 48.8722, lng: 2.3769, district: 'Paris 20e' },
  { name: 'Ménilmontant', category: 'metro', lat: 48.8664, lng: 2.3831, district: 'Paris 20e' },
  { name: 'Père Lachaise', category: 'place', lat: 48.8617, lng: 2.3875, district: 'Paris 20e' },
  { name: 'Charonne / Philippe Auguste', category: 'metro', lat: 48.8557, lng: 2.3855, district: 'Paris 11e' },
  { name: 'Oberkampf / Parmentier', category: 'metro', lat: 48.8649, lng: 2.3698, district: 'Paris 11e' },
  { name: 'Voltaire / Mairie du 11e', category: 'metro', lat: 48.8578, lng: 2.3801, district: 'Paris 11e' },

  // Gares Parisiennes
  { name: 'Gare du Nord', category: 'gare', lat: 48.8809, lng: 2.3553, district: 'Paris 10e' },
  { name: 'Gare de l\'Est', category: 'gare', lat: 48.8763, lng: 2.3587, district: 'Paris 10e' },
  { name: 'Gare de Lyon', category: 'gare', lat: 48.8449, lng: 2.3734, district: 'Paris 12e' },
  { name: 'Gare Montparnasse', category: 'gare', lat: 48.8412, lng: 2.3206, district: 'Paris 15e' },
  { name: 'Gare Saint-Lazare', category: 'gare', lat: 48.8768, lng: 2.3252, district: 'Paris 8e' },
  { name: 'Gare d\'Austerlitz', category: 'gare', lat: 48.8422, lng: 2.3660, district: 'Paris 13e' },

  // Ouest & Monuments
  { name: 'Charles de Gaulle - Étoile (Champs-Élysées)', category: 'place', lat: 48.8738, lng: 2.2950, district: 'Paris 8e' },
  { name: 'Trocadéro / Tour Eiffel', category: 'monument', lat: 48.8630, lng: 2.2872, district: 'Paris 16e' },
  { name: 'Invalides / Esplanade', category: 'monument', lat: 48.8585, lng: 2.3129, district: 'Paris 7e' },
  { name: 'Assemblée Nationale', category: 'monument', lat: 48.8618, lng: 2.3186, district: 'Paris 7e' },
  { name: 'Opéra Garnier', category: 'monument', lat: 48.8706, lng: 2.3322, district: 'Paris 9e' },
  { name: 'Madeleine', category: 'place', lat: 48.8700, lng: 2.3248, district: 'Paris 8e' },
  { name: 'Panthéon / Luxembourg', category: 'monument', lat: 48.8462, lng: 2.3464, district: 'Paris 5e' },
  { name: 'Place de Clichy', category: 'place', lat: 48.8837, lng: 2.3274, district: 'Paris 18e' },
  { name: 'Pigalle / Montmartre', category: 'place', lat: 48.8822, lng: 2.3372, district: 'Paris 18e' },
  { name: 'Barbès - Rochechouart', category: 'metro', lat: 48.8836, lng: 2.3501, district: 'Paris 18e' },
  { name: 'Stalingrad / Bassin de la Villette', category: 'place', lat: 48.8828, lng: 2.3686, district: 'Paris 19e' },
  { name: 'Parc des Buttes-Chaumont', category: 'place', lat: 48.8798, lng: 2.3812, district: 'Paris 19e' },
  { name: 'Bercy / Accor Arena', category: 'place', lat: 48.8388, lng: 2.3789, district: 'Paris 12e' },
  { name: 'Denfert-Rochereau', category: 'place', lat: 48.8339, lng: 2.3324, district: 'Paris 14e' },
  { name: 'Alésia', category: 'metro', lat: 48.8282, lng: 2.3270, district: 'Paris 14e' },
  { name: 'La Motte-Picquet - Grenelle', category: 'metro', lat: 48.8488, lng: 2.3005, district: 'Paris 15e' },

  // Portes & Périphérie
  { name: 'Porte Maillot', category: 'porte', lat: 48.8777, lng: 2.2825, district: 'Paris 17e' },
  { name: 'Porte de Vincennes', category: 'porte', lat: 48.8471, lng: 2.4116, district: 'Paris 20e' },
  { name: 'Porte de Bagnolet', category: 'porte', lat: 48.8650, lng: 2.4130, district: 'Paris 20e' },
  { name: 'Porte de Saint-Ouen', category: 'porte', lat: 48.8988, lng: 2.3330, district: 'Paris 17e' },
  { name: 'Porte de Clignancourt', category: 'porte', lat: 48.8985, lng: 2.3447, district: 'Paris 18e' },
  { name: 'Porte d\'Italie', category: 'porte', lat: 48.8194, lng: 2.3596, district: 'Paris 13e' },
  { name: 'Porte de Versailles', category: 'porte', lat: 48.8322, lng: 2.2876, district: 'Paris 15e' },
  { name: 'Porte de Pantin / Parc de la Villette', category: 'porte', lat: 48.8888, lng: 2.3931, district: 'Paris 19e' },
];

export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isCoordinateString(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(trimmed)) return true;
  if (/^secteur paris\s*\(-?\d+/i.test(trimmed)) return true;
  if (/^non g[ée]ocod[ée]/i.test(trimmed)) return true;
  if (trimmed.length < 5) return true;
  return false;
}

export function formatLocationName(name: string | null | undefined, lat: number, lng: number): string {
  if (name && !isCoordinateString(name)) {
    return name;
  }

  let nearest = PARIS_LANDMARKS[0];
  let minDistance = Infinity;

  for (const lm of PARIS_LANDMARKS) {
    const dist = getDistanceMeters(lat, lng, lm.lat, lm.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = lm;
    }
  }

  const roundedDistance = Math.round(minDistance / 10) * 10;

  if (minDistance <= 60) {
    return nearest.name;
  }
  if (minDistance <= 350) {
    return `Proche ${nearest.name} (~${roundedDistance}m)`;
  }
  if (minDistance <= 900) {
    return `Secteur ${nearest.name} (${nearest.district || 'Paris'})`;
  }
  return `${nearest.district ? `Secteur ${nearest.district}` : 'Paris'} · Proche ${nearest.name}`;
}
