import { incidentRepository, getDistanceMeters } from './repositories/incidentRepository.js';

async function runTests() {
  console.log('🧪 === Lancement des tests de validation Pulse ===');

  // Test 1: Calcul Haversine
  const chateletLat = 48.8584;
  const chateletLng = 2.3470;
  // Point ~25 mètres plus à l'est
  const nearbyLat = 48.8584;
  const nearbyLng = 2.34735;
  const dist = getDistanceMeters(chateletLat, chateletLng, nearbyLat, nearbyLng);
  console.log(`✓ [Haversine] Distance calculée: ${dist.toFixed(2)}m (attendu ~25m)`);
  if (dist < 20 || dist > 35) {
    throw new Error(`Distance Haversine erronée: ${dist}`);
  }

  // Test 2: Création d'un premier incident (Nouveau Point)
  const report1 = await incidentRepository.processIncidentReport({
    lat: 48.8700,
    lng: 2.3500,
    location_name: 'Gare de l\'Est',
    severity: 'danger',
    category: 'manifestation',
    description: 'Rassemblement sous haute tension parvis gare',
    source: 'Citoyen',
  });

  console.log(`✓ [Création] Incident ID=${report1.incident.id}, clusterMerge=${report1.isClusterMerge}, reports_count=${report1.incident.reports_count}`);
  if (report1.isClusterMerge !== false || report1.incident.reports_count !== 1) {
    throw new Error('Échec Test 2: le premier signalement doit créer un nouveau point avec reports_count=1');
  }

  const initialExpiry = new Date(report1.incident.expires_at).getTime();

  // Test 3: Deuxième signalement à ~25m (Même zone < 50m) -> DOIT FUSIONNER (Clustering)
  const report2 = await incidentRepository.processIncidentReport({
    lat: 48.8701, // ~15-20m au nord
    lng: 2.3501,
    location_name: 'Gare de l\'Est Parvis Nord',
    severity: 'danger',
    category: 'manifestation',
    description: 'Présence policière renforcée et jets de projectiles',
    source: 'Citoyen 2',
  });

  console.log(`✓ [Fusion 50m] Incident ID=${report2.incident.id}, clusterMerge=${report2.isClusterMerge}, reports_count=${report2.incident.reports_count}`);
  if (report2.isClusterMerge !== true || report2.incident.id !== report1.incident.id || report2.incident.reports_count !== 2) {
    throw new Error('Échec Test 3: le signalement à <50m doit fusionner dans le même incident avec reports_count=2');
  }

  const extendedExpiry = new Date(report2.incident.expires_at).getTime();
  const diffMinutes = Math.round((extendedExpiry - initialExpiry) / (60 * 1000));
  console.log(`✓ [TTL Dynamique] Prolongation de ${diffMinutes} minutes (attendu +30 min)`);
  if (diffMinutes < 25 || diffMinutes > 35) {
    throw new Error(`Échec TTL: prolongation attendue de ~30 min, obtenu ${diffMinutes} min`);
  }

  // Test 4: Conflit Rouge vs Vert (Signalement "Safe" sur incident "Danger")
  const counterReport1 = await incidentRepository.processIncidentReport({
    lat: 48.87005,
    lng: 2.35005,
    location_name: 'Gare de l\'Est',
    severity: 'safe',
    category: 'calme',
    description: 'Retour au calme, la foule s\'est dispersée',
    source: 'Citoyen Pacifique',
  });

  console.log(`✓ [Conflit 1] Downvotes=${counterReport1.incident.downvotes}, Gravité=${counterReport1.incident.severity}`);
  if (counterReport1.incident.downvotes !== 1) {
    throw new Error('Échec Conflit 1: un signalement safe inverse doit incrémenter les downvotes');
  }

  // Deuxième signalement "Safe" : doit rétrograder en 'warning'
  const counterReport2 = await incidentRepository.processIncidentReport({
    lat: 48.87008,
    lng: 2.35002,
    location_name: 'Gare de l\'Est',
    severity: 'safe',
    category: 'calme',
    description: 'Calme confirmé par les riverains',
    source: 'Citoyen Pacifique 2',
  });

  console.log(`✓ [Conflit 2 - Rétrogradation] Gravité=${counterReport2.incident.severity}, Score=${counterReport2.incident.reliability_score}`);
  if (counterReport2.incident.severity !== 'warning') {
    throw new Error(`Échec Conflit 2: sévérité attendue 'warning', obtenu '${counterReport2.incident.severity}'`);
  }

  // Troisième signalement "Safe" : doit marquer résolu
  const counterReport3 = await incidentRepository.processIncidentReport({
    lat: 48.87002,
    lng: 2.35006,
    location_name: 'Gare de l\'Est',
    severity: 'safe',
    category: 'calme',
    description: 'Voie libre',
    source: 'Citoyen 3',
  });

  console.log(`✓ [Conflit 3 - Résolution] Résolu=${counterReport3.incident.resolved}, Gravité=${counterReport3.incident.severity}`);
  if (!counterReport3.incident.resolved || counterReport3.incident.severity !== 'safe') {
    throw new Error('Échec Conflit 3: l\'incident aurait dû être résolu');
  }

  // Test 5: Nettoyage automatique des expirés
  const cleaned = await incidentRepository.cleanupExpired();
  console.log(`✓ [Nettoyage TTL/Résolus] Incidents nettoyés: ${cleaned.length}`);
  if (!cleaned.includes(counterReport3.incident.id)) {
    // Si pas encore nettoyé parce que TTL 10min, forçons l'expiration
    counterReport3.incident.expires_at = new Date(Date.now() - 1000).toISOString();
    const cleaned2 = await incidentRepository.cleanupExpired();
    console.log(`✓ [Nettoyage Forcé] Incidents nettoyés: ${cleaned2.length}`);
    if (!cleaned2.includes(counterReport3.incident.id)) {
      throw new Error('Échec Test 5: l\'incident résolu/expiré doit être nettoyé');
    }
  }

  console.log('\n🎉 TOUS LES TESTS DE CLUSTERING, TTL, ET RÉSOLUTION DE CONFLIT ONT RÉUSSI AVEC SUCCÈS !');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Erreur de test:', err);
  process.exit(1);
});
