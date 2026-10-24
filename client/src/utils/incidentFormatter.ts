import { Incident, Severity } from '../types';

export interface FormattedIncidentDetails {
  emoji: string;
  categoryLabel: string;
  severityColor: 'red' | 'amber' | 'emerald';
  severityBadgeClass: string;
  cleanTitle: string;
  cleanDescription: string;
  sourceBadge: string;
  timeAgo: string;
}

/**
 * Mappe et retourne l'émoji représentatif selon la catégorie, la sévérité et la description
 */
export function getCategoryEmoji(category?: string, severity?: Severity, description?: string): string {
  const desc = (description || '').toLowerCase();

  // Détection spécifique par mots-clés prioritaires
  if (desc.includes('lacrymo') || desc.includes('gaz') || desc.includes('teargas')) {
    return '💨';
  }
  if (desc.includes('police') || desc.includes('crs') || desc.includes('fdo') || desc.includes('filtrage') || desc.includes('nasse')) {
    return '👮';
  }
  if (desc.includes('feu') || desc.includes('incendie') || desc.includes('barricade') || desc.includes('flame') || category === 'degradation') {
    return '🔥';
  }
  if (desc.includes('rassemblement') || desc.includes('grève') || desc.includes('greve') || desc.includes('mobilisation') || desc.includes('rally')) {
    return '🪧';
  }
  if (category === 'manifestation' || desc.includes('cortège') || desc.includes('cortege') || desc.includes('march')) {
    return '📢';
  }
  if (category === 'fermeture_station' || desc.includes('station') || desc.includes('métro') || desc.includes('metro') || desc.includes('rer')) {
    return '🚇';
  }
  if (category === 'blocage' || desc.includes('blocage') || desc.includes('bloqu')) {
    return '🚧';
  }
  if (severity === 'safe' || category === 'calme' || desc.includes('calme') || desc.includes('dégagé') || desc.includes('clear')) {
    return '🟢';
  }
  if (severity === 'danger') {
    return '⚠️';
  }
  return '📍';
}

/**
 * Nettoie une description brute (retire balises HTML, URLs, IDs techniques résiduels, timestamps)
 */
export function sanitizeRawDescription(raw: string): string {
  if (!raw) return '';

  let clean = raw
    // Suppression des balises HTML
    .replace(/<[^>]*>/g, ' ')
    // Suppression des URLs
    .replace(/https?:\/\/\S+/gi, '')
    // Suppression des tags techniques style [id: 1234] ou #12345
    .replace(/\[\s*(?:id|point|ref)?:?\s*\d+\s*\]/gi, '')
    // Remplacement des sauts de ligne multiples
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}

/**
 * Traduit automatiquement les descriptions types standardisées si l'utilisateur est en Anglais
 */
export function translateDescription(text: string, lang: 'fr' | 'en'): string {
  if (lang === 'fr') return text;

  // Dictionnaire de traduction temps-réel des signalements standardisés
  const translations: Array<[RegExp, string]> = [
    [/\[Danger\]\s*Zone à risque signalée en direct via MediaManif\./gi, '[Danger] High-risk zone reported live via MediaManif.'],
    [/\[Lacrymo\]\s*Usage de gaz lacrymogènes signalé via MediaManif\./gi, '[Tear Gas] Use of tear gas reported live via MediaManif.'],
    [/\[Police \/ CRS\]\s*Dispositif ou filtrage des forces de l'ordre \(MediaManif\)\./gi, '[Police / Riot Units] Police cordon or security filtering in place (MediaManif).'],
    [/\[Cortège\]\s*Déplacement de manifestants signalé via MediaManif\./gi, '[Protest March] Group of protesters moving through the area (MediaManif).'],
    [/\[Mobilisation\]\s*Point de rassemblement citoyen signalé \(MediaManif\)\./gi, '[Rally] Citizen gathering and protest meeting point (MediaManif).'],
    [/\[Vigilance\]\s*Événement de rue signalé en direct via MediaManif\./gi, '[Alert] Street event reported live via MediaManif.'],
    [/Zone totalement dégagée et sécurisée\. Métro et bus fonctionnent normalement\./gi, 'Area completely clear and secure. Metro and buses operating normally.'],
    [/Forte affluence inhabituelle et accès partiel restreint porte Lescot suite à un mouvement de foule\./gi, 'Heavy crowd density and partial restricted access at Porte Lescot following crowd movement.'],
    [/Tirs réguliers de grenades lacrymogènes/gi, 'Regular tear gas canister launches'],
    [/Présence de policiers en civil/gi, 'Presence of plainclothes police officers'],
    [/Mouvement de foule/gi, 'Crowd surge / rush'],
    [/Nasse policière en cours/gi, 'Police kettle / containment in progress'],
    [/Dispersion en cours/gi, 'Crowd dispersal underway'],
    [/Tension \/ FDO/gi, 'Tension / Police'],
    [/Retour au calme/gi, 'Calm restored'],
  ];

  let translated = text;
  for (const [regex, replacement] of translations) {
    translated = translated.replace(regex, replacement);
  }

  return translated;
}

/**
 * Calcule un libellé de temps écoulé lisible (ex: "Il y a 5 min")
 */
export function formatTimeAgo(dateString: string, lang: 'fr' | 'en'): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  
  if (diffSec < 60) {
    return lang === 'fr' ? "À l'instant" : 'Just now';
  }
  const min = Math.floor(diffSec / 60);
  if (min < 60) {
    return lang === 'fr' ? `Il y a ${min} min` : `${min} min ago`;
  }
  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return lang === 'fr' ? `Il y a ${hours} h` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return lang === 'fr' ? `Il y a ${days} j` : `${days}d ago`;
}

/**
 * Normalise complètement la fiche de détails de l'incident pour affichage
 */
export function formatIncidentDetails(incident: Incident, lang: 'fr' | 'en' = 'fr'): FormattedIncidentDetails {
  const emoji = getCategoryEmoji(incident.category, incident.severity, incident.description);
  
  // Couleurs strictes : Rouge (danger) / Orange (warning) / Vert (safe)
  let severityColor: 'red' | 'amber' | 'emerald' = 'amber';
  let severityBadgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
  let cleanTitle = lang === 'fr' ? 'Tension / Vigilance' : 'Caution / Tension';

  if (incident.severity === 'danger') {
    severityColor = 'red';
    severityBadgeClass = 'bg-red-500/10 text-red-400 border border-red-500/30';
    cleanTitle = lang === 'fr' ? 'Danger Critique' : 'High Danger';
  } else if (incident.severity === 'safe') {
    severityColor = 'emerald';
    severityBadgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    cleanTitle = lang === 'fr' ? 'Zone Sécurisée' : 'Safe Area';
  }

  // Catégorie lisible avec émoji
  let categoryLabel = incident.category || 'Événement';
  if (incident.category === 'manifestation') categoryLabel = lang === 'fr' ? 'Cortège / Manif' : 'Protest March';
  if (incident.category === 'tension') categoryLabel = lang === 'fr' ? 'Tension FDO' : 'Police Action';
  if (incident.category === 'degradation') categoryLabel = lang === 'fr' ? 'Dégradations / Feux' : 'Damage / Fires';
  if (incident.category === 'fermeture_station') categoryLabel = lang === 'fr' ? 'Station Fermée' : 'Station Closed';
  if (incident.category === 'blocage') categoryLabel = lang === 'fr' ? 'Blocage Routier' : 'Roadblock';
  if (incident.category === 'calme') categoryLabel = lang === 'fr' ? 'Zone Calme' : 'Calm Zone';

  const sanitized = sanitizeRawDescription(incident.description);
  const cleanDescription = translateDescription(sanitized, lang);
  const timeAgo = formatTimeAgo(incident.created_at, lang);

  // Source raccourcie et lisible
  let sourceBadge = incident.source;
  if (sourceBadge.includes('MediaManif')) sourceBadge = 'MediaManif (OSINT)';
  if (sourceBadge.includes('Telegram')) sourceBadge = 'Telegram Direct';
  if (sourceBadge.includes('citoyen')) sourceBadge = lang === 'fr' ? 'Signalement Citoyen' : 'Citizen Report';

  return {
    emoji,
    categoryLabel,
    severityColor,
    severityBadgeClass,
    cleanTitle,
    cleanDescription,
    sourceBadge,
    timeAgo,
  };
}
