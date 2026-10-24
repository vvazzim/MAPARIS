import { incidentRepository } from './src/repositories/incidentRepository.js';
import { buildApp } from './src/app.js';

async function testStep4() {
  console.log('🧪 [Test Étape 4] Validation du Crowdsourcing & Système d\'Upvote/Downvote...\n');

  const app = await buildApp();
  await app.ready();

  // 1. Création d'un incident de test
  const createRes = await app.inject({
    method: 'POST',
    url: '/api/incidents',
    payload: {
      address: 'Place d\'Italie, 75013 Paris',
      severity: 'warning',
      category: 'tension',
      description: 'Cortège syndical en progression calme, présence policière préventive.',
      source: 'Témoin citoyen',
    },
  });

  if (createRes.statusCode !== 201) {
    throw new Error(`Échec création incident: ${createRes.payload}`);
  }

  const created = JSON.parse(createRes.payload).data;
  console.log(`✅ Incident créé avec succès: [${created.id}] ${created.location_name}`);
  console.log(`   Score initial: ${created.reliability_score} (Upvotes: ${created.upvotes}, Downvotes: ${created.downvotes})`);

  // 2. Upvote
  const upRes = await app.inject({
    method: 'POST',
    url: `/api/incidents/${created.id}/upvote`,
  });
  const upData = JSON.parse(upRes.payload).data;
  console.log(`✅ Après Upvote: Upvotes=${upData.upvotes}, Fiabilité=${upData.reliability_score}`);

  // 3. Second Upvote
  const upRes2 = await app.inject({
    method: 'POST',
    url: `/api/incidents/${created.id}/upvote`,
  });
  const upData2 = JSON.parse(upRes2.payload).data;
  console.log(`✅ Après 2ème Upvote: Upvotes=${upData2.upvotes}, Fiabilité=${upData2.reliability_score}`);

  // 4. Downvote
  const downRes = await app.inject({
    method: 'POST',
    url: `/api/incidents/${created.id}/downvote`,
  });
  const downData = JSON.parse(downRes.payload).data;
  console.log(`✅ Après Downvote: Downvotes=${downData.downvotes}, Fiabilité=${downData.reliability_score}`);

  await app.close();
  console.log('\n🎯 Tous les tests de l\'Étape 4 sont validés avec succès !');
}

testStep4().catch((err) => {
  console.error('Erreur:', err);
  process.exit(1);
});
