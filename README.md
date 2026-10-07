# ⚕️ PharmaSync — Gestion des pharmacies et recherche de médicaments

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F) ![Java](https://img.shields.io/badge/Java-21-orange) ![Angular](https://img.shields.io/badge/Angular-18-DD0031) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-H2%20en%20dev-336791)

> **Projet de Fin d'Études — ENASTIC**
> Licence en Développement Web et Mobile — Option : Développement des applications Web & Mobile
> **Réalisé par :** MOUSSA HACHIM HASSABALLAH
> **Encadrant :** M. BRAHIM ISSA HASSABALLAH, enseignant à l'ENASTIC
> **Année académique :** 2025-2026

PharmaSync permet à un patient de **trouver, avant de se déplacer, la pharmacie la plus proche qui a le médicament en stock**, et donne aux pharmaciens un **outil de gestion de stock avec alertes en temps réel**.

---

## ✨ Fonctionnalités

**Côté patient**
- Recherche de médicaments (synonymes marque / DCI : Doliprane ↔ paracétamol).
- Pharmacie la plus proche **mise en avant automatiquement**, avec itinéraire.
- Position par GPS, par Wi-Fi, par **nom de quartier** (79 quartiers de N'Djamena) ou par clic sur la carte.
- Pharmacies de garde, réservation en ligne (retrait ou livraison), paiement Mobile Money **simulé**.
- Création de compte patient, mot de passe oublié, mode hors connexion (derniers résultats en cache).

**Côté pharmacien / administrateur**
- Tableau de bord, stocks par lot, péremptions, mouvements, import CSV.
- **Alertes en temps réel** (WebSocket) : stock bas, rupture, péremption proche.
- Réservations, vente au comptoir (POS) avec facture PDF, planning des gardes, statistiques.
- Choix de la « pharmacie active » : toutes les pages suivent la pharmacie choisie.
- Un pharmacien ne peut modifier que les pharmacies qui lui sont assignées.

## 🧰 Technologies

| Partie | Technologie |
|---|---|
| Backend | Spring Boot 4 (Java 21), Spring Security + JWT, WebSocket (STOMP) |
| Frontend | Angular 18 (PWA), Leaflet / OpenStreetMap, Chart.js |
| Base de données | PostgreSQL (prod) / H2 en mémoire (dev, par défaut) |
| Tests | JUnit 5 (backend), Jasmine / Karma (frontend : 14 tests) |
| Intégration continue | GitHub Actions |

## 🚀 Lancer le projet sur son ordinateur

**Prérequis :** Java 21+, Node.js 20+ et npm.

**1. Backend (serveur)**
```bash
cd backend
./mvnw spring-boot:run          # Windows : mvnw.cmd spring-boot:run
```
API : http://localhost:8081 — Swagger : http://localhost:8081/swagger-ui/
Console H2 : http://localhost:8081/h2-console (JDBC URL : `jdbc:h2:mem:pharmacy_db`)

**2. Frontend (site)**
```bash
cd frontend
npm install
npm start
```
Site : http://localhost:4200

**3. (Optionnel) PostgreSQL avec Docker — profil prod**
```bash
docker compose up -d
# Premier lancement uniquement (charge les données de démonstration) :
SPRING_PROFILES_ACTIVE=prod SQL_INIT_MODE=always ./mvnw spring-boot:run -f backend/pom.xml
# Lancements suivants :
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run -f backend/pom.xml
```

## 🌍 Mise en ligne

Le projet se déploie gratuitement sur **Render** grâce aux fichiers `render.yaml` et `backend/Dockerfile`.
Guide pas à pas : **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

## 🔐 Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | admin@pharmasync.com | admin123 |
| Pharmacien | pharmacien@pharmasync.com | pharma123 |
| Patient | patient@gmail.com | patient123 |

## 📊 Données de démonstration

Les **6 pharmacies** sont réelles (nom, adresse, téléphone et position relevés sur Google Maps, septembre 2026) :
Pharmacie du Salut, Pharmacie Béguinage, Pharmacie La Place, Pharmacie La Vaillance, Pharmacie du Sacré-Cœur, Dépôt pharmaceutique Al-Salama.
Les **stocks, prix, réservations et gardes** sont des données de démonstration.

## 📁 Structure

```
├── backend/          API REST Spring Boot (+ Dockerfile)
├── frontend/         Application Angular (PWA)
├── render.yaml       Déploiement Render
├── DEPLOIEMENT.md    Guide de mise en ligne
├── CORRECTIONS.md    Historique des corrections
└── docker-compose.yml
```
