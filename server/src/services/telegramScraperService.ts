import { osintIngestionService, IngestedOSINTResult } from './osintIngestionService.js';

export interface TelegramChannelPost {
  postId: string;
  channel: string;
  author: string;
  text: string;
  date?: string;
  keywords?: string[];
}

/**
 * Nettoie et synthétise un texte Telegram pour extraire les mots-clés
 * et produire une alerte concise (max 150 caractères) évitant l'effet "journal"
 */
export function extractConciseTelegramAlert(rawText: string): {
  summary: string;
  keywords: string[];
  isUsefulAlert: boolean;
} {
  const lower = rawText.toLowerCase();

  // 1. Éliminer le bruit non pertinent (vidéos, podcasts, promos, revues de presse)
  const isNoise =
    lower.includes('nouvelle vidéo') ||
    lower.includes('youtu.be') ||
    lower.includes('youtube.com') ||
    lower.includes('podcast') ||
    lower.includes('documentaire') ||
    lower.includes('abonnez-vous') ||
    lower.includes('teufeurs') ||
    lower.includes('teknival') ||
    lower.includes('nous toutes') ||
    lower.includes('patrick bruel') ||
    lower.includes('théâtre') ||
    lower.includes('billetterie') ||
    lower.includes('interview');

  if (isNoise) {
    return { summary: '', keywords: [], isUsefulAlert: false };
  }

  // 2. Vérifier la présence de mots-clés d'alerte / sécurité urbaine
  const keywords: string[] = [];
  if (lower.includes('lacrymo') || lower.includes('lacrymogène')) keywords.push('Lacrymo');
  if (lower.includes('charge') || lower.includes('affrontement')) keywords.push('Tensions');
  if (lower.includes('barricade') || lower.includes('feux') || lower.includes('incendie')) keywords.push('Barricades');
  if (lower.includes('nasse') || lower.includes('filtrage') || lower.includes('cordon')) keywords.push('Filtrage');
  if (lower.includes('cortège') || lower.includes('manif') || lower.includes('rassemblement')) keywords.push('Cortège');
  if (lower.includes('crs') || lower.includes('police') || lower.includes('fdo') || lower.includes('brav-m')) keywords.push('Police');
  if (lower.includes('station fermée') || lower.includes('métro fermé') || lower.includes('trafic interrompu')) keywords.push('Station RATP');
  if (lower.includes('calme') || lower.includes('dispersion') || lower.includes('fin de manif')) keywords.push('Dispersion');

  // Si aucun mot-clé d'action / terrain n'est présent, le message n'est pas une alerte utile
  if (keywords.length === 0) {
    return { summary: '', keywords: [], isUsefulAlert: false };
  }

  // 3. Nettoyer le texte : supprimer URLs, pseudos, mentions, hashtags, retours à la ligne
  let clean = rawText
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/t\.me\/\S+/gi, '')
    .replace(/@[a-zA-Z0-9_]+/gi, '')
    .replace(/[#＃][a-zA-Z0-9_À-ÿ]+/gi, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // 4. Extraire la phrase clé principale (max 120 caractères)
  let coreSentence = clean;
  const sentenceMatch = clean.match(/^([^.!?]+[.!?])/);
  if (sentenceMatch && sentenceMatch[1].length >= 25 && sentenceMatch[1].length <= 130) {
    coreSentence = sentenceMatch[1].trim();
  } else if (coreSentence.length > 120) {
    coreSentence = coreSentence.slice(0, 117).trim() + '...';
  }

  // 5. Préfixer avec les tags essentiels [Lacrymo] [Police]
  const tagPrefix = keywords.slice(0, 2).map((k) => `[${k}]`).join(' ');
  const finalSummary = tagPrefix ? `${tagPrefix} ${coreSentence}` : coreSentence;

  return {
    summary: finalSummary.slice(0, 160),
    keywords,
    isUsefulAlert: true,
  };
}

export class TelegramScraperService {
  private monitoredChannels: string[] = [
    'CLPRESS',                  // Journalistes indépendants de terrain à Paris
    'cerveauxnondisponibles',   // Informations mobilisations & cortèges
  ];

  private seenPostIds: Set<string> = new Set();
  private isPollingActive: boolean = false;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private lastSyncTime: string | null = null;
  private ingestedCount: number = 0;

  constructor() {
    console.log('📡 [Telegram OSINT] Service de scraping public initialisé avec filtre de fraîcheur');
  }

  /**
   * Récupère les derniers messages d'un canal Telegram public (sans clé API)
   */
  async fetchChannelPosts(channel: string): Promise<TelegramChannelPost[]> {
    const url = `https://t.me/s/${channel}`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ [Telegram OSINT] HTTP ${response.status} sur canal @${channel}`);
        return [];
      }

      const html = await response.text();
      return this.parseTelegramHtml(html, channel);
    } catch (err: any) {
      console.warn(`⚠️ [Telegram OSINT] Erreur réseau sur @${channel}:`, err.message);
      return [];
    }
  }

  /**
   * Analyse le HTML public de Telegram pour en extraire les publications
   * avec vérification stricte de la date et filtrage du bruit
   */
  private parseTelegramHtml(html: string, channel: string): TelegramChannelPost[] {
    const posts: TelegramChannelPost[] = [];
    const now = Date.now();
    // Maximum 8 heures d'ancienneté pour garantir des alertes en direct d'actualité
    const MAX_POST_AGE_MS = 8 * 60 * 60 * 1000;

    // Découpe par bloc de message: <div class="tgme_widget_message_wrap ...
    const messageBlocks = html.split('class="tgme_widget_message_wrap');

    for (const block of messageBlocks.slice(1)) {
      // 1. Extraire l'ID du post : data-post="CLPRESS/12345"
      const postIdMatch = block.match(/data-post="([^"]+)"/);
      if (!postIdMatch) continue;
      const postId = postIdMatch[1];

      // 2. Extraire la date réelle du post dans la balise <time datetime="...">
      const timeMatch = block.match(/<time[^>]*datetime="([^"]+)"[^>]*>/);
      if (!timeMatch || !timeMatch[1]) {
        // Sans horodatage vérifiable, on rejette le message
        continue;
      }

      const postDate = new Date(timeMatch[1]);
      const postTimestamp = postDate.getTime();
      const ageMs = now - postTimestamp;

      // REJET STRICT : Si le post date d'il y a plus de 8 heures (ex: janvier, mois précédents) -> IGNORER !
      if (isNaN(postTimestamp) || ageMs > MAX_POST_AGE_MS || ageMs < -60000) {
        continue;
      }

      // 3. Extraire le texte du message
      const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
      if (!textMatch) continue;

      let rawHtmlText = textMatch[1];
      // Nettoyage HTML propre
      let cleanText = rawHtmlText
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1')
        .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '$1')
        .replace(/<i\b[^>]*>(.*?)<\/i>/gi, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();

      if (cleanText.length < 20) continue; // Ignore messages trop courts

      // 4. Filtre d'utilité et synthèse concise
      const { summary, keywords, isUsefulAlert } = extractConciseTelegramAlert(cleanText);
      if (!isUsefulAlert || !summary) {
        // Ignorer si c'est du bruit ("si c'est pas utile pas la peine")
        continue;
      }

      posts.push({
        postId,
        channel,
        author: `@${channel}`,
        text: summary,
        date: postDate.toISOString(),
        keywords,
      });
    }

    return posts;
  }

  /**
   * Cycle de synchronisation : inspecte les canaux et ingère les nouveaux posts parisiens vérifiés
   */
  async syncNow(): Promise<{ checkedPosts: number; newIngested: IngestedOSINTResult[] }> {
    const newIngested: IngestedOSINTResult[] = [];
    let totalChecked = 0;

    for (const channel of this.monitoredChannels) {
      const posts = await this.fetchChannelPosts(channel);
      totalChecked += posts.length;

      for (const post of posts) {
        if (this.seenPostIds.has(post.postId)) {
          continue;
        }

        // Marque comme vu
        this.seenPostIds.add(post.postId);

        // Analyse si le post parle d'un lieu parisien ou d'un événement
        const analysis = osintIngestionService.parseMessage(post.text);
        
        console.log(`📡 [Telegram OSINT Récent] Alerte sélectionnée sur @${channel} : "${post.text}"`);
        
        try {
          const ingested = await osintIngestionService.ingest({
            id: `tg-${post.postId.replace('/', '-')}`,
            source: `Telegram Live (@${channel})`,
            author: `@${channel}`,
            text: post.text,
            timestamp: post.date || new Date().toISOString(),
            channel: post.channel,
          });

          newIngested.push(ingested);
          this.ingestedCount += 1;
        } catch (err: any) {
          console.warn(`⚠️ [Telegram OSINT] Erreur géocodage post ${post.postId}:`, err.message);
        }
      }
    }

    this.lastSyncTime = new Date().toISOString();
    return { checkedPosts: totalChecked, newIngested };
  }

  /**
   * Démarre la surveillance automatique en tâche de fond (toutes les X minutes)
   */
  startPolling(intervalMinutes: number = 3) {
    if (this.isPollingActive) return;
    this.isPollingActive = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`🤖 [Telegram OSINT] Surveillance temps réel active (toutes les ${intervalMinutes} min) sur [${this.monitoredChannels.join(', ')}]`);

    // Synchronisation périodique
    this.pollIntervalTimer = setInterval(() => {
      this.syncNow().catch((err) => {
        console.warn('⚠️ [Telegram OSINT] Erreur cycle de surveillance:', err.message);
      });
    }, intervalMs);
  }

  /**
   * Arrête la surveillance
   */
  stopPolling() {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
    this.isPollingActive = false;
    console.log('🛑 [Telegram OSINT] Surveillance temps réel désactivée.');
  }

  getStatus() {
    return {
      active: this.isPollingActive,
      monitoredChannels: this.monitoredChannels,
      seenPostsCount: this.seenPostIds.size,
      ingestedCount: this.ingestedCount,
      lastSyncTime: this.lastSyncTime,
    };
  }

  addChannel(channel: string) {
    const clean = channel.replace('@', '').trim();
    if (!this.monitoredChannels.includes(clean)) {
      this.monitoredChannels.push(clean);
    }
  }
}

export const telegramScraperService = new TelegramScraperService();
