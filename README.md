# 🛡️ Paris Security Pulse (MAPARIS)

> Plateforme temps réel de cartographie et de veille sécuritaire à Paris (Manifestations, Tensions policières, Dégradations, Hubs RATP & Safe Routing).

---

## 🏛️ Architecture Complète du Système

Le projet est conçu sous forme d'un **Monorepo Modulaire** structuré et typé en TypeScript de bout en bout :

```
MAPARIS/
├── package.json                         # Root monorepo avec workspaces npm
├── .gitignore                           # Ignorés (node_modules, dist, logs, env)
├── README.md                            # Documentation complète
│
├── client/                              # Frontend React (Vite) + Tailwind CSS + Leaflet
│   ├── index.html                       # Base HTML + Leaflet CSS + Dark theme
│   ├── vite.config.ts                   # Proxies API & WebSockets vers backend :4000
│   ├── tailwind.config.js               # Palette sombre custom, CartoDB Dark colors & animations
│   ├── package.json
│   └── src/
│       ├── components/
│       │   ├── Header.tsx               # Barre haute : métriques live, boutons Signaler, OSINT & Safe Routing
│       │   ├── IncidentFeed.tsx         # Sidebar temps réel : filtres, upvote/downvote, jauge de fiabilité
│       │   ├── ReportModal.tsx          # Modal Crowdsourcing avec autocomplétion Base Adresse Nationale (BAN)
│       │   ├── SafeRouteModal.tsx       # Calculateur d'itinéraire sécurisé anti-nasse & anti-gaz
│       │   ├── TransportWidget.tsx      # Panneau de monitoring des hubs RATP (Châtelet, République, Bastille...)
│       │   └── Map/
│       │       └── SecurityMap.tsx      # Carte Leaflet Dark Matter, marqueurs pulsants, cercles et polylines
│       ├── data/
│       │   └── ratpHubs.ts              # Référentiel des correspondances et métros parisiens
│       ├── services/
│       │   └── socket.ts                # Client Socket.io avec reconnexion automatique
│       ├── store/
│       │   └── useIncidentStore.ts      # Store réactif Zustand (incidents, navigation, filtres, trajets)
│       ├── types/
│       │   └── index.ts                 # Types TypeScript partagés (Incident, Severity, SafeRoute)
│       ├── App.tsx                      # Layout maître synchronisé avec Socket.io
│       ├── main.tsx
│       └── index.css                    # Thème CartoDB Dark Matter et animations radar
│
└── server/                              # Backend Fastify + WebSockets + Geocoding + NLP
    ├── package.json                     # Fastify, @fastify/cors, socket.io, zod, dotenv, tsx
    ├── tsconfig.json                    # Configuration TypeScript NodeNext
    ├── .env & .env.example
    ├── data/
    │   └── incidents.json               # Persistance locale sécurisée des incidents
    ├── test-step2.ts                    # Tests d'intégration BAN Geocoding & REST Incidents
    ├── test-step4.ts                    # Tests du Crowdsourcing & Upvotes bayésiens
    ├── test-step5.ts                    # Tests du Pipeline d'ingestion NLP OSINT (Telegram/X)
    ├── test-step6.ts                    # Tests de l'Algorithme d'évitement de danger (Safe Routing)
    └── src/
        ├── config/
        │   └── env.ts                   # Validation stricte des variables d'environnement (Zod)
        ├── repositories/
        │   └── incidentRepository.ts    # Store persistant, filtres temporels & score de fiabilité
        ├── routes/
        │   ├── health.ts                # GET /api/health
        │   ├── incidents.ts             # GET /api/incidents, POST /api/incidents, POST /:id/upvote, /:id/downvote
        │   ├── geocode.ts               # GET /api/geocode/search (BAN), GET /api/geocode/reverse
        │   ├── osint.ts                 # POST /api/osint/simulate, POST /api/osint/parse-text, GET /api/osint/feed
        │   └── routing.ts               # POST /api/routing/safe-path (contournement d'obstacles)
        ├── services/
        │   ├── geocodingService.ts      # Client officiel API Base Adresse Nationale (data.gouv.fr)
        │   ├── osintIngestionService.ts # Moteur NLP de classification de sévérité & lieux parisiens
        │   └── safeRoutingService.ts    # Algorithme géométrique de contournement de zones à risque
        ├── sockets/
        │   └── socketHandler.ts         # Broadcast temps réel d'alertes & souscriptions
        ├── types/
        │   └── index.ts                 # Interfaces backend TypeScript
        ├── app.ts                       # Factory Fastify avec plugins CORS & routes
        └── server.ts                    # Point d'entrée HTTP & serveur WebSockets
```

---

## ⚡ Feuille de Route Réalisée (100% Terminé)

| Étape | Description | Statut |
|---|---|---|
| **Étape 1** | Setup Monorepo, Fastify + React Vite + TailwindCSS + Socket.io | ✅ Terminé |
| **Étape 2** | Moteur de Géolocalisation API BAN, Routes Incidents & Diffusion Socket.io | ✅ Terminé |
| **Étape 3** | Dashboard Leaflet Dark Matter, Marqueurs Pulsants & Widget Hubs RATP | ✅ Terminé |
| **Étape 4** | Modal Crowdsourcing (BAN Search), Upvote/Downvote & Fiabilité Dynamique | ✅ Terminé |
| **Étape 5** | Pipeline d'Ingestion OSINT (Bots Telegram/X, Heuristique NLP & Géocodage) | ✅ Terminé |
| **Étape 6** | Algorithme d'Itinéraire Sécurisé (Safe Routing évitant les gaz et tensions) | ✅ Terminé |

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

À la racine de `MAPARIS/` :
```bash
npm install
```

### 2. Lancement en mode Développement

Pour lancer le frontend et le backend en parallèle :
```bash
npm run dev
```

* **Frontend** : Accessible sur [`http://localhost:5173`](http://localhost:5173)
* **Backend API** : Accessible sur [`http://localhost:4000`](http://localhost:4000)

---

## 📡 Endpoints REST & Socket.io

### REST API
* `GET  /api/health` : État de santé du serveur
* `GET  /api/incidents` : Liste des incidents (avec filtres `severity`, `limit`)
* `POST /api/incidents` : Déclaration d'un incident (auto-géocodage BAN + diffusion live)
* `POST /api/incidents/:id/upvote` : Confirmer un incident (+fiabilité)
* `POST /api/incidents/:id/downvote` : Contester un incident (-fiabilité)
* `GET  /api/geocode/search?q=...` : Suggestions d'adresses en direct via Base Adresse Nationale
* `POST /api/osint/simulate` : Déclencher l'arrivée d'une dépêche Telegram/X simulée
* `POST /api/osint/parse-text` : Analyse NLP d'un texte brut copié-collé
* `POST /api/routing/safe-path` : Calcul d'un itinéraire piéton contournant les zones à risque

### WebSockets (Socket.io)
* `incidents:init` : Reçu à la connexion avec l'ensemble des alertes actives
* `incident:new` : Diffusé instantanément à tous les utilisateurs dès qu'une alerte arrive (OSINT ou Citoyen)
* `incident:updated` : Diffusé en direct à chaque vote communautaire (mise à jour du score de fiabilité)
