import { safeRoutingService } from './src/services/safeRoutingService.js';
import { buildApp } from './src/app.js';

async function testStep6() {
  console.log('🧪 [Test Étape 6] Validation de l\'Algorithme d\'Itinéraire Sécurisé (Safe Routing)...\n');

  // 1. Test unitaire du service Safe Routing
  console.log('1️⃣ Calcul d\'un trajet entre Châtelet et République...');
  const result = await safeRoutingService.computeSafeRoute(
    'Châtelet, Paris',
    'Place de la République, Paris'
  );

  console.log(`   Départ: ${result.origin.address} (${result.origin.lat}, ${result.origin.lng})`);
  console.log(`   Arrivée: ${result.destination.address} (${result.destination.lat}, ${result.destination.lng})`);
  console.log(`   Distance directe: ${result.directDistanceKm} km (${result.directDurationMin} min)`);
  console.log(`   Distance sécurisée: ${result.safeDistanceKm} km (${result.safeDurationMin} min)`);
  console.log(`   Score de sécurité: ${result.safetyScore}%`);
  console.log(`   Zones contournées: ${result.hazardsAvoided.length}`);
  console.log(`   Recommandation: ${result.recommendation}`);

  if (result.safePath.length < 2) {
    throw new Error('Le tracé sécurisé doit comporter au moins 2 points');
  }

  // 2. Test API Fastify POST /api/routing/safe-path
  console.log('\n2️⃣ Test Fastify POST /api/routing/safe-path...');
  const app = await buildApp();
  await app.ready();

  const res = await app.inject({
    method: 'POST',
    url: '/api/routing/safe-path',
    payload: {
      origin: 'Place de la Bastille',
      destination: 'Place de la Concorde',
    },
  });

  if (res.statusCode !== 200) {
    throw new Error(`Échec API Routing: ${res.payload}`);
  }

  const body = JSON.parse(res.payload);
  if (!body.success || !body.data.safePath) {
    throw new Error('Réponse invalide de l\'API Safe Routing');
  }

  console.log(`✅ Trajet Bastille ➔ Concorde calculé avec succès :`);
  console.log(`   Trajet direct: ${body.data.directDistanceKm} km`);
  console.log(`   Trajet contourné: ${body.data.safeDistanceKm} km (Score: ${body.data.safetyScore}%)`);
  console.log(`   Zones de danger contournées: ${body.data.hazardsAvoided.length}`);

  await app.close();
  console.log('\n🎯 Tous les tests de l\'Étape 6 sont validés avec succès !');
}

testStep6().catch((err) => {
  console.error('Erreur Étape 6:', err);
  process.exit(1);
});
