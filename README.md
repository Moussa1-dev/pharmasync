# ⚕️ Application de Gestion des Pharmacies et Disponibilité des Médicaments

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.x-brightgreen.svg)
![Angular](https://img.shields.io/badge/Angular-18.x-red.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)
![PWA](https://img.shields.io/badge/Mobile-PWA-02569B.svg)

> **Projet de Fin d'Études**
> - **Réalisé par :** MOUSSA HACHIM HASSABALLAH
> - **Encadrant :** M. BRAHIM ISSA HASSABALLAH
> - **Année académique :** 2025-2026

Cette application permet aux patients de localiser rapidement les médicaments disponibles tout en offrant aux pharmacies un outil moderne de gestion des stocks.

---

## 📖 Chapitre I : Présentation générale du projet
**Contexte & Problématique :** La difficulté pour les patients de trouver rapidement un médicament disponible, particulièrement lors des gardes de nuit ou des situations d'urgence.
**Objectifs :** Centraliser les stocks des pharmacies, offrir un moteur de recherche en temps réel par géolocalisation, et fournir un tableau de bord aux pharmaciens.
**Technologies :** 
- Backend : **Spring Boot** (Java)
- Frontend Web : **Angular 18** (PWA mobile-first, installable sur smartphone)
- Base de données : **PostgreSQL** (prod) / **H2** (dev, profil par défaut)

---

## 👥 Chapitre II : Analyse et conception
### Acteurs du système :
1. **Administrateur :** Gère la plateforme globale, ajoute de nouvelles pharmacies.
2. **Pharmacien :** Met à jour son stock, gère les réservations (validation/livraison), consulte ses statistiques.
3. **Patient :** Recherche des médicaments, localise les pharmacies de garde, trace son itinéraire, effectue des réservations.

### Conception UML & Base de données :
Le système repose sur un modèle relationnel robuste modélisant les `Pharmacy`, `Medication`, `Stock` et `Reservation`.

---

## 💻 Chapitre III : Réalisation
L'architecture est de type **Client-Serveur** :
- **Développement du Back-end :** Création d'API REST sécurisées avec Spring Boot. Logique métier pour le calcul spatial (algorithme de Haversine pour la proximité).
- **Application Web (Angular) :** Interface "Midnight Dark" esthétique avec intégration de cartes interactives (Leaflet), recherche vocale (Speech-to-Text), et tableaux de bord analytiques (Chart.js).
- **Base PostgreSQL :** Stockage relationnel fiable pour les transactions des réservations. (Une base in-memory H2 est incluse pour faciliter les tests du jury).

---

## 🧪 Chapitre IV : Tests, résultats et perspectives
- **Tests Fonctionnels :** Couverture des services Angular via Jasmine/Karma (`api.service.spec.ts`).
- **Résultats attendus :** Une plateforme fluide, réduisant drastiquement le temps de recherche d'un médicament pour un patient.
- **Limites et Évolutions (Perspectives implémentées / à venir) :**
  - ✅ **Réservation :** Implémenté de bout en bout avec upload d'ordonnance.
  - ✅ **Notifications :** Système de logs asynchrones simulant l'envoi de SMS/Email.
  - ✅ **Commande en ligne & Livraison :** Choix entre retrait en pharmacie et livraison à domicile.

---

## 🚀 Installation & Lancement (Environnement Jury)

> **Mode rapide (recommandé pour la soutenance)** : le profil `dev` utilise une base **H2 en mémoire** — aucune installation PostgreSQL requise.

### Prérequis
- Java 21+
- Node.js 20+ et npm
- *(Optionnel)* Docker pour PostgreSQL en mode production

### 1️⃣ Lancement du Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
L'API sera disponible sur `http://localhost:8080`.

| Profil | Commande | Base de données |
|--------|----------|-----------------|
| **dev** (défaut) | `./mvnw spring-boot:run` | H2 en mémoire |
| **prod** | `SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run` | PostgreSQL |

**Documentation API (Swagger)** : [http://localhost:8080/swagger-ui/](http://localhost:8080/swagger-ui/)

**Console H2** (profil dev) : [http://localhost:8080/h2-console](http://localhost:8080/h2-console) — JDBC URL : `jdbc:h2:mem:pharmacy_db`

### 2️⃣ Lancement du Frontend (Angular Web / PWA)
```bash
cd frontend
npm install
npm start
```
L'application web sera disponible sur `http://localhost:4200`.

### 3️⃣ PostgreSQL avec Docker (profil prod)
```bash
docker compose up -d
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run -f backend/pom.xml
```

### 🔐 Comptes de démonstration

| Rôle | Email | Mot de passe | Accès |
|------|-------|--------------|-------|
| **Administrateur** | `admin@pharmasync.com` | `admin123` | Gestion pharmacies, catalogue |
| **Pharmacien** | `contact@pharmasalut.td` | `pharma123` | Dashboard, stocks, POS |
| **Patient** | `patient@gmail.com` | `patient123` | Recherche, réservations |

### 📁 Structure du projet
```
gestion_parmacie/
├── backend/          # API REST Spring Boot
├── frontend/         # Application Angular PWA
├── docker-compose.yml
├── .env.example      # Variables d'environnement
├── MEMOIRE_PFE.md
├── PROJET_PFE_FINAL.md
└── RESUME_PROJET.md
```

### ⚙️ Configuration
Copiez `.env.example` vers `.env` pour personnaliser les variables (JWT, PostgreSQL, CORS).

---

## 📚 Documentation complémentaire
- [Cahier des charges](PROJET_PFE_FINAL.md)
- [Structure du mémoire](MEMOIRE_PFE.md)
- [Résumé exécutif](RESUME_PROJET.md)
- [README Frontend](frontend/README.md)
# gestion-pharmace
