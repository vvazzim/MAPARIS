import { mediaManifService } from '../services/mediaManifService.js';
import { telegramScraperService } from '../services/telegramScraperService.js';
import { transitAutomationService } from '../services/transitAutomationService.js';

async function main() {
  console.log('🔄 ========================================================');
  console.log('🔄 DÉMARRAGE DU CYCLE COMPLET DE RÉCUPÉRATION 24H (MAPARIS)');
  console.log('🔄 ========================================================');
  
  // 1. Refetch & Ingestion RATP / SNCF & Les 21 Stations Fermées
  console.log('🚆 [1/3] Synchronisation RATP / SNCF & 21 stations fermées...');
  const transitResult = await transitAutomationService.syncDisruptionsToIncidents();
  console.log(`✅ Résultat RATP / SNCF : ${transitResult.syncedCount} alertes traitées (${transitResult.createdCount} créées, ${transitResult.updatedCount} màj).`);

  // 2. Refetch MediaManif (Données manifestations 24h)
  console.log('📡 [2/3] Synchronisation MediaManif (Manifestations 24h)...');
  const mmResult = await mediaManifService.syncNow();
  console.log(`✅ Résultat MediaManif : ${mmResult.totalFetched} points reçus, ${mmResult.parisFiltered} en Île-de-France (${mmResult.newCreated} créés, ${mmResult.clusteredMerged} fusionnés).`);

  // 3. Refetch Telegram OSINT (Alertes citoyennes en direct)
  console.log('📢 [3/3] Synchronisation Telegram OSINT...');
  const tgResult = await telegramScraperService.syncNow();
  console.log(`✅ Résultat Telegram : ${tgResult.checkedPosts} posts vérifiés, ${tgResult.newIngested.length} alertes ingérées.`);

  console.log('🎉 ========================================================');
  console.log('🎉 CYCLE DE SYNCHRONISATION 24H TERMINÉ AVEC SUCCÈS !');
  console.log('🎉 ========================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erreur critique lors du refetch 24h:', err);
  process.exit(1);
});
