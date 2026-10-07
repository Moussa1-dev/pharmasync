# PharmaSync — Frontend Angular

Interface web de la plateforme **PharmaSync** (gestion de pharmacies et recherche de médicaments).

## Prérequis

- Node.js 20+
- npm 10+
- Backend Spring Boot démarré sur `http://localhost:8081`

## Installation

```bash
npm install
```

## Lancement

```bash
npm start
```

Application disponible sur **http://localhost:4200**.

## Build production

```bash
npm run build
```

Les fichiers sont générés dans `dist/frontend/`.

## Tests

```bash
npm test
```

## Fonctionnalités principales

| Module | Route | Accès |
|--------|-------|-------|
| Accueil | `/home` | Public |
| Recherche médicaments | `/search` | Public |
| Connexion | `/login` | Public |
| Dashboard pharmacien | `/dashboard` | Pharmacien / Admin |
| Statistiques | `/stats` | Pharmacien / Admin |
| Commandes | `/orders` | Pharmacien / Admin |
| Point de vente | `/pos` | Pharmacien / Admin |
| Administration | `/admin` | Admin uniquement |

## PWA

L'application est configurée en **Progressive Web App** (service worker, manifest). Sur mobile, elle peut être installée depuis le navigateur — alternative au client Flutter mentionné dans le cahier des charges.

## Stack

- Angular 18 (standalone components)
- Leaflet (cartes)
- Chart.js (graphiques)
- SweetAlert2, jsPDF, QRCode
