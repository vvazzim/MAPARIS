import { osintIngestionService } from './src/services/osintIngestionService.js';
import { buildApp } from './src/app.js';

async function testStep5() {
  console.log('🧪 [Test Étape 5] Validation du Pipeline d\'Ingestion OSINT (Scraping & NLP)...\n');

  // 1. Test NLP Parsing
  console.log('1️⃣ Test du moteur heuristique NLP...');
  const parsed1 = osintIngestionService.parseMessage(
    'Alerte : Barricade enflammée et gaz lacrymogènes Place de la Nation entre cortège et FDO.'
  );
  console.log('   Texte 1 ->', parsed1);
  if (parsed1.severity !== 'danger') throw new Error('Devrait être sévérité danger');
  if (!parsed1.location.includes('Nation')) throw new Error('Devrait détecter Place de la Nation');

  const parsed2 = osintIngestionService.parseMessage(
    'Rassemblement syndical calme et sans heurt, dispersion progressive Place de la Concorde.'
  );
  console.log('   Texte 2 ->', parsed2);
  if (parsed2.severity !== 'safe') throw new Error('Devrait être sévérité safe');
  if (!parsed2.location.includes('Concorde')) throw new Error('Devrait détecter Place de la Concorde');

  // 2. Test Ingestion d'un flux simulé
  console.log('\n2️⃣ Test de l\'ingestion et géocodage BAN...');
  const app = await buildApp();
  await app.ready();

  const simRes = await app.inject({
    method: 'POST',
    url: '/api/osint/simulate',
  });

  if (simRes.statusCode !== 200) {
    throw new Error(`Échec simulation OSINT: ${simRes.payload}`);
  }

  const simData = JSON.parse(simRes.payload);
  console.log('✅ Simulation OSINT réussie :');
  console.log(`   Source: ${simData.data.raw.source}`);
  console.log(`   Lieu détecté: ${simData.data.parsedLocation}`);
  console.log(`   Sévérité: ${simData.data.detectedSeverity}`);
  console.log(`   Coordonnées géocodées: (${simData.data.incident.lat}, ${simData.data.incident.lng})`);

  // 3. Test de parsing de texte personnalisé
  console.log('\n3️⃣ Test API POST /api/osint/parse-text...');
  const customRes = await app.inject({
    method: 'POST',
    url: '/api/osint/parse-text',
    payload: {
      text: 'Affrontements violents et feux de poubelles boulevard Saint-Germain, brigade mobile déployée.',
      source: 'Telegram OSINT (Direct Paris)',
      author: '@ParisActuAlertes',
    },
  });

  if (customRes.statusCode !== 201) {
    throw new Error(`Échec parsing texte: ${customRes.payload}`);
  }

  const customData = JSON.parse(customRes.payload);
  console.log(`✅ Incident ingéré: [${customData.data.incident.id}] ${customData.data.incident.location_name}`);
  console.log(`   Catégorie: ${customData.data.detectedCategory}, Sévérité: ${customData.data.detectedSeverity}`);

  await app.close();
  console.log('\n🎯 Tous les tests de l\'Étape 5 sont validés avec succès !');
}

testStep5().catch((err) => {
  console.error('Erreur Étape 5:', err);
  process.exit(1);
});
