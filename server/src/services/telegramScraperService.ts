import { osintIngestionService, IngestedOSINTResult } from './osintIngestionService.js';

export interface TelegramChannelPost {
  postId: string;
  channel: string;
  author: string;
  text: string;
  date?: string;
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
    // Initialise avec quelques posts factices pour ne pas spammer au premier démarrage
    console.log('📡 [Telegram OSINT] Service de scraping public initialisé (100% gratuit)');
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
   */
  private parseTelegramHtml(html: string, channel: string): TelegramChannelPost[] {
    const posts: TelegramChannelPost[] = [];

    // Découpe par bloc de message: <div class="tgme_widget_message_wrap ...
    const messageBlocks = html.split('class="tgme_widget_message_wrap');

    for (const block of messageBlocks.slice(1)) {
      // 1. Extraire l'ID du post : data-post="CLPRESS/12345"
      const postIdMatch = block.match(/data-post="([^"]+)"/);
      if (!postIdMatch) continue;
      const postId = postIdMatch[1];

      // 2. Extraire le texte du message
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

      if (cleanText.length < 15) continue; // Ignore messages trop courts

      posts.push({
        postId,
        channel,
        author: `@${channel}`,
        text: cleanText,
      });
    }

    return posts;
  }

  /**
   * Cycle de synchronisation : inspecte les canaux et ingère les nouveaux posts parisiens
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
        
        // Si le texte mentionne un lieu parisien reconnu ou des mots-clés d'alerte forts
        const isParisRelevant = 
          analysis.location !== 'Paris' || 
          post.text.toLowerCase().includes('paris') || 
          post.text.toLowerCase().includes('manif') ||
          post.text.toLowerCase().includes('police') ||
          post.text.toLowerCase().includes('cortège');

        if (isParisRelevant) {
          console.log(`📡 [Telegram OSINT Réel] Nouveau post détecté sur @${channel} : "${post.text.slice(0, 60)}..."`);
          
          try {
            const ingested = await osintIngestionService.ingest({
              id: `tg-${post.postId.replace('/', '-')}`,
              source: `Telegram Live (@${channel})`,
              author: `@${channel}`,
              text: post.text,
              timestamp: new Date().toISOString(),
              channel: post.channel,
            });

            newIngested.push(ingested);
            this.ingestedCount += 1;
          } catch (err: any) {
            console.warn(`⚠️ [Telegram OSINT] Erreur géocodage post ${post.postId}:`, err.message);
          }
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

    console.log(`🤖 [Telegram OSINT] Surveillance temps réel activée (toutes les ${intervalMinutes} min) sur [${this.monitoredChannels.join(', ')}]`);

    // Première synchronisation immédiate (asynchrone)
    this.syncNow().catch(() => {});

    // Boucle périodique
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
