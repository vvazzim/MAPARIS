import { geocodingService } from './src/services/geocodingService.js';
import { incidentRepository } from './src/repositories/incidentRepository.js';
import { buildApp } from './src/app.js';

async function runStep2Tests() {
  console.log('🧪 Démarrage des tests unitaires & d\'intégration de l\'ÉTAPE 2...\n');
  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, message: string) {
    testsTotal++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // --- Test 1 : Service de Géocodage BAN ---
  console.log('📍 [Test 1] Validation du service BAN (Base Adresse Nationale)...');
  try {
    const geo = await geocodingService.geocodeAddress('Place de la République');
    console.log(`     Résultat: "${geo.label}" -> (${geo.lat}, ${geo.lng}) [score: ${geo.score}]`);
    assert(Math.abs(geo.lat - 48.867) < 0.02, 'Latitude proche de République (~48.867)');
    assert(Math.abs(geo.lng - 2.363) < 0.02, 'Longitude proche de République (~2.363)');
    assert(geo.score > 0.5, 'Score de confiance supérieur à 0.5');
  } catch (err: any) {
    assert(false, `Échec géocodage BAN: ${err.message}`);
  }

  // --- Test 2 : Référentiel des incidents & persistance ---
  console.log('\n📦 [Test 2] Référentiel des incidents (IncidentRepository)...');
  const allIncidents = await incidentRepository.getAll();
  assert(allIncidents.length >= 4, `Au moins 4 incidents initiaux chargés (actuel: ${allIncidents.length})`);
  
  const initialCount = allIncidents.length;

  // --- Test 3 : Démarrage App Fastify & Route GET /api/incidents ---
  console.log('\n🌐 [Test 3] Fastify REST API GET /api/incidents...');
  const app = await buildApp();
  await app.ready();

  const getRes = await app.inject({
    method: 'GET',
    url: '/api/incidents',
  });
  assert(getRes.statusCode === 200, 'GET /api/incidents répond avec HTTP 200');
  const getBody = JSON.parse(getRes.payload);
  assert(getBody.success === true, 'Réponse JSON success: true');
  assert(getBody.data.length === initialCount, 'Contient tous les incidents stockés');

  // --- Test 4 : Fastify REST API POST /api/incidents avec géocodage automatique ---
  console.log('\n🚨 [Test 4] Fastify REST API POST /api/incidents (avec auto-géocodage BAN)...');
  const postRes = await app.inject({
    method: 'POST',
    url: '/api/incidents',
    payload: {
      address: 'Gare Saint-Lazare',
      severity: 'warning',
      category: 'tension',
      description: 'Filtrage vigipirate renforcé aux abords des quais grandes lignes.',
      source: 'Signalement Usager',
    },
  });

  assert(postRes.statusCode === 201, 'POST /api/incidents répond avec HTTP 201');
  const postBody = JSON.parse(postRes.payload);
  assert(postBody.success === true, 'Alerte créée avec succès');
  assert(typeof postBody.data.id === 'string', 'ID alerte généré');
  assert(postBody.data.severity === 'warning', 'Sévérité conforme');
  assert(Math.abs(postBody.data.lat - 48.876) < 0.02, `Latitude géocodée correctement pour Gare Saint-Lazare (${postBody.data.lat})`);
  assert(Math.abs(postBody.data.lng - 2.325) < 0.02, `Longitude géocodée correctement pour Gare Saint-Lazare (${postBody.data.lng})`);

  // --- Test 5 : Upvote d'une alerte & calcul de fiabilité ---
  console.log('\n👍 [Test 5] Vote communautaire POST /api/incidents/:id/upvote...');
  const newId = postBody.data.id;
  const upvoteRes = await app.inject({
    method: 'POST',
    url: `/api/incidents/${newId}/upvote`,
  });
  assert(upvoteRes.statusCode === 200, 'Upvote répond avec HTTP 200');
  const upvoteBody = JSON.parse(upvoteRes.payload);
  assert(upvoteBody.data.upvotes === 2, 'Nombre d\'upvotes incrémenté à 2');
  assert(upvoteBody.data.reliability_score > 0, 'Score de fiabilité calculé');

  // --- Test 6 : Autocomplétion GET /api/geocode/search ---
  console.log('\n🔍 [Test 6] Recherche d\'adresses GET /api/geocode/search...');
  const searchRes = await app.inject({
    method: 'GET',
    url: '/api/geocode/search?q=Chatelet',
  });
  assert(searchRes.statusCode === 200, 'Autocomplétion répond HTTP 200');
  const searchBody = JSON.parse(searchRes.payload);
  assert(searchBody.count > 0, 'Retourne des suggestions d\'adresses pour Chatelet');

  await app.close();

  console.log(`\n========================================`);
  console.log(`🎯 RÉSULTATS : ${testsPassed} / ${testsTotal} tests validés avec succès !`);
  console.log(`========================================\n`);
}

runStep2Tests().catch((err) => {
  console.error('Erreur fatale lors des tests:', err);
  process.exit(1);
});
