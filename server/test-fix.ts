import { buildApp } from './src/app.js';

async function testFixes() {
  console.log('🧪 Test des corrections demandées...');

  const app = await buildApp();
  await app.ready();

  // Test 1: POST /api/incidents renvoie { status: 'success', incident } avec HTTP 201
  const res = await app.inject({
    method: 'POST',
    url: '/api/incidents',
    payload: {
      address: 'Place de la Nation, Paris',
      severity: 'danger',
      category: 'tension',
      description: 'Test après correction du format de réponse JSON.',
      source: 'Test Automatisé',
    },
  });

  console.log(`Status Code: ${res.statusCode} (attendu: 201)`);
  if (res.statusCode !== 201) {
    throw new Error(`Statut HTTP incorrect: ${res.statusCode}`);
  }

  const body = JSON.parse(res.payload);
  console.log('Body reçu:', body);

  if (body.status !== 'success') {
    throw new Error(`body.status attendu: 'success', reçu: ${body.status}`);
  }

  if (!body.incident || !body.incident.id) {
    throw new Error('body.incident attendu et non trouvé');
  }

  console.log('✅ Test 1 validé : POST /api/incidents retourne HTTP 201 et { status: "success", incident }');

  // Test 2: Payload invalide géré sans crash
  const errRes = await app.inject({
    method: 'POST',
    url: '/api/incidents',
    payload: {},
  });

  console.log(`Status Code Invalide: ${errRes.statusCode} (attendu: 400)`);
  const errBody = JSON.parse(errRes.payload);
  if (errBody.status !== 'error') {
    throw new Error(`errBody.status attendu: 'error', reçu: ${errBody.status}`);
  }

  console.log('✅ Test 2 validé : Gestion propre des erreurs 400 en JSON structuré');

  await app.close();
  console.log('🎉 Tous les tests de validation sont validés avec succès !');
}

testFixes().catch((err) => {
  console.error('Erreur test fix:', err);
  process.exit(1);
});
