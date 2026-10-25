import { mediaManifService } from '../services/mediaManifService.js';
import { telegramScraperService } from '../services/telegramScraperService.js';

async function main() {
  console.log('🔄 Démarrage du refetch des signalements...');
  
  // 1. Refetch MediaManif
  console.log('📡 Synchronisation MediaManif...');
  const mmResult = await mediaManifService.syncNow();
  console.log('✅ Résultat MediaManif:', JSON.stringify(mmResult, null, 2));

  // 2. Refetch Telegram
  console.log('📢 Synchronisation Telegram OSINT...');
  const tgResult = await telegramScraperService.syncNow();
  console.log(`✅ Résultat Telegram: ${tgResult.checkedPosts} posts vérifiés, ${tgResult.newIngested.length} alertes ingérées.`);

  console.log('🎉 Refetch terminé avec succès !');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erreur lors du refetch:', err);
  process.exit(1);
});
