# 💊 Résumé du Projet : PharmaSync

## 1. Introduction
PharmaSync est une plateforme web moderne et complète, conçue pour révolutionner la gestion pharmaceutique et faciliter l'accès aux médicaments pour les patients. L'application agit comme un pont numérique entre les besoins urgents des patients et la gestion logistique des pharmacies. Ce projet a été développé dans le cadre d'un Projet de Fin d'Études (PFE) et répond à 100% au cahier des charges fonctionnel initial.

## 2. Architecture et Stack Technique
L'application repose sur une architecture robuste et séparée (Backend/Frontend) :
* **Backend :** Java Spring Boot (Spring MVC, Spring Data JPA, Spring Security, WebSockets).
* **Base de données :** H2 (in-memory) pour le développement et la démonstration, architecture pensée pour basculer facilement sur PostgreSQL (PostGIS pour les calculs de distance complexes, bien que la formule d'Haversine suffise pour la version actuelle).
* **Frontend :** Angular 18 (Standalone Components) pour la réactivité, avec un design moderne (glassmorphism et micro-animations).
* **Bibliothèques tierces :** Leaflet (Cartographie), Chart.js (Statistiques), StompJS/SockJS (Temps réel), jsPDF/XLSX (Génération de documents et de reçus).

## 3. Fonctionnalités Cœurs par Acteur

### 3.1 Pour le Patient (L'Utilisateur Final)
* **Recherche de Médicaments Intelligente :** Permet de trouver la pharmacie la plus proche (géolocalisation) disposant du médicament en stock, avec affichage sur une carte interactive (Leaflet).
* **Réservation en Ligne :** Le patient peut réserver son médicament, choisir son mode de récupération (retrait sur place ou livraison), et uploader une photo de son ordonnance.
* **Suivi et Chat en Direct :** Suivi du statut de la commande avec la possibilité de communiquer en direct avec le pharmacien via une messagerie intégrée.

### 3.2 Pour le Pharmacien (Gestion et Vente)
* **Tableau de Bord Global :** Une vue unifiée des statistiques de la pharmacie (stocks globaux, alertes de péremption, revenus, etc.).
* **Caisse / Point de Vente (POS) :** Une interface ultra-rapide pour facturer les clients, avec scan de codes-barres (caméra ou lecteur physique) et impression immédiate du reçu en PDF avec QR Code.
* **Gestion des Stocks & Alertes :** Surveillance automatique du niveau des stocks. Si un seuil critique est atteint ou qu'un lot expire bientôt, une alerte visuelle est remontée.
* **Import / Export de Données :** Mise à jour massive des inventaires depuis des fichiers CSV, et extraction de rapports détaillés sur les ruptures de stock ou l'historique des ventes (PDF/Excel/CSV).
* **Traçabilité des Lots et Rappels :** Possibilité de rechercher l'historique d'un lot spécifique et de déclencher une procédure de rappel en cas d'anomalie sanitaire.

### 3.3 Pour l'Administrateur
* **Gestion du Système :** Ajout et gestion des pharmacies, attribution des rôles, supervision de la plateforme.

## 4. Sécurité et Fiabilité
* **Authentification JWT :** Chaque action est protégée par un jeton sécurisé avec gestion stricte des rôles (Patient, Pharmacien, Admin).
* **Vérification de Compte (Workflow e-mail) :** Inscription des patients sécurisée avec une étape obligatoire de validation par e-mail (génération et vérification de tokens) pour limiter les faux comptes.
* **Notifications en Temps Réel (WebSockets) :** Intégration du protocole STOMP/SockJS. Lorsqu'un événement survient (ex: nouvelle réservation), l'écran du pharmacien affiche immédiatement l'alerte de manière réactive, sans aucun rechargement de page.

## 5. Points Forts pour la Soutenance
1. **Une Expérience Utilisateur (UX) Premium :** Design épuré, asynchrone, dynamique et très réactif, loin des interfaces basiques.
2. **L'aspect "Temps Réel" :** Le chat et les notifications via STOMP/WebSockets prouvent une maîtrise des protocoles réseau modernes et asynchrones.
3. **L'approche Multi-canaux :** L'intégration native du hardware (scan de QR Code / Code-barres avec la caméra).
4. **Interopérabilité des données :** L'export (PDF/Excel) et l'import (CSV) montrent que le logiciel est conçu pour s'insérer de manière réaliste dans l'écosystème d'une vraie officine.

## 6. Conclusion
PharmaSync représente une solution pratique, innovante et techniquement aboutie pour répondre à un besoin réel dans le secteur pharmaceutique. Le projet combine efficacité, sécurité (JWT, validation d'e-mail), et technologies de pointe (Angular 18, WebSockets) pour offrir un outil immédiatement valorisable lors de la présentation finale du PFE.
