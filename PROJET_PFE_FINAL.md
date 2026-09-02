# RÉPUBLIQUE — MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR
**[Établissement / Faculté / Département]**

---

# CAHIER DES CHARGES
## Projet de fin d'études

**Sujet : Conception et développement d'une plateforme intelligente de gestion des pharmacies et de recherche de médicaments disponibles avec géolocalisation et système d'alerte en temps réel (PharmaSync)**

- **Préparé par :** Moussa Hachim
- **Encadré par :** [Nom de l'encadrant]
- **Filière :** Génie Logiciel / Informatique
- **Année universitaire :** 2025 – 2026
- **Version :** 1.0 — Document de cadrage projet

---

## 0. Préambule et cadrage général

### 0.1. Objet du document
Ce cahier des charges pose noir sur blanc ce que doit faire, concrètement, la plateforme de gestion des pharmacies et de recherche de médicaments (**PharmaSync**) qui fait l'objet de ce projet de fin d'études. L'idée n'est pas d'empiler des généralités, mais de fixer un référentiel clair — fonctionnel, technique et organisationnel — qui serve de fil conducteur du début de l'analyse jusqu'à la soutenance, et qui permette à l'encadrant comme au jury de vérifier point par point ce qui a été réalisé.

Le document suit le plan retenu pour le mémoire, en quatre chapitres : Généralités et état de l'art, Analyse et conception du système, Réalisation et implémentation, puis Tests, résultats et perspectives. Chaque exigence formulée plus loin renvoie directement à l'un de ces chapitres, de façon à ce qu'il n'y ait jamais d'ambiguïté sur où et comment elle doit être traitée.

### 0.2. Contexte et justification du projet
Le point de départ est un constat assez simple, et que beaucoup ont vécu : chercher un médicament précis peut vite tourner au parcours du combattant. On appelle une pharmacie, elle ne l'a pas, on essaie la suivante, toujours rien, et pendant ce temps on n'a aucune idée de qui, dans le quartier, dispose réellement du produit. Cette situation tient à plusieurs causes qui se cumulent : l'absence de visibilité en temps réel sur les stocks des officines, des ruptures qui ne sont signalées nulle part, et l'absence d'un outil unique permettant de savoir, avant même de se déplacer, où trouver ce dont on a besoin. Du côté des pharmaciens, la gestion du stock reste elle aussi souvent artisanale — tableurs, cahiers, mémoire humaine — ce qui rend difficile d'anticiper une rupture avant qu'elle ne survienne.

C'est ce double problème que le projet cherche à résoudre, en construisant une plateforme unique où patients et pharmaciens se retrouvent : recherche géolocalisée, stock à jour en temps réel, réservation, et alertes automatiques quand un produit vient à manquer ou redevient disponible.

### 0.3. Objectifs du projet

#### 0.3.1. Objectif général
L'objectif est de concevoir, développer puis valider une plateforme web — avec une ouverture possible vers le mobile — qui permette à un utilisateur de savoir rapidement où trouver un médicament autour de lui, et qui donne aux pharmaciens les moyens de tenir leurs stocks à jour et de communiquer leur disponibilité sans effort superflu.

#### 0.3.2. Objectifs spécifiques
- Étudier l'existant (applications de gestion pharmaceutique, plateformes de recherche de médicaments, systèmes de géolocalisation) et en dégager les limites ;
- Modéliser le système à l'aide du formalisme UML (cas d'utilisation, classes, séquence, activités) ;
- Concevoir une base de données relationnelle robuste et normalisée pour la gestion des pharmacies, médicaments, stocks et réservations ;
- Développer une architecture trois-tiers (frontend, API REST, base de données) sécurisée et évolutive ;
- Intégrer un service de géolocalisation et de cartographie permettant le calcul de proximité et l'affichage cartographique des pharmacies ;
- Mettre en place un système d'alerte en temps réel (rupture de stock, disponibilité retrouvée, confirmation de réservation) ;
- Valider la solution par une stratégie de tests structurée (unitaires, fonctionnels, intégration, performance) ;
- Évaluer les résultats obtenus et proposer des perspectives d'évolution.

### 0.4. Portée du projet (in scope / out of scope)

#### 0.4.1. Inclus dans le périmètre
- Gestion multi-pharmacies (inscription, profil, localisation, horaires) ;
- Gestion du catalogue de médicaments et des stocks associés à chaque pharmacie ;
- Recherche de médicaments avec filtrage par disponibilité et proximité géographique ;
- Réservation de médicaments avec confirmation par le pharmacien ;
- Système de notifications et d'alertes en temps réel (rupture, disponibilité, statut de réservation) ;
- Tableau de bord statistique pour pharmaciens et administrateur ;
- Authentification sécurisée et gestion des rôles (patient, pharmacien, administrateur).

#### 0.4.2. Exclu du périmètre (hors mémoire, pistes d'évolution)
- Vente en ligne et paiement électronique de médicaments (la réservation ne vaut pas transaction commerciale) ;
- Téléconsultation médicale ou délivrance d'ordonnance électronique certifiée ;
- Livraison à domicile des médicaments ;
- Interconnexion officielle avec les systèmes d'information des ordres nationaux des pharmaciens (à considérer comme perspective).

### 0.5. Petit lexique (à reprendre dans le Chapitre 1 du mémoire)

| Terme | Définition |
| :--- | :--- |
| **Officine** | Établissement pharmaceutique ouvert au public, autorisé à la dispensation de médicaments. |
| **Médicament** | Substance ou composition présentée comme possédant des propriétés préventives ou curatives, identifiée par une dénomination commune et/ou commerciale. |
| **Stock pharmaceutique** | Quantité disponible d'un médicament donné dans une pharmacie à un instant T. |
| **Rupture de stock** | Situation dans laquelle la quantité disponible d'un médicament atteint zéro ou un seuil critique défini. |
| **Géolocalisation** | Détermination des coordonnées géographiques (latitude/longitude) d'un utilisateur ou d'une pharmacie. |
| **Réservation** | Engagement temporaire du pharmacien à mettre de côté une quantité de médicament au bénéfice d'un patient identifié. |
| **Alerte temps réel** | Notification automatique déclenchée par un évènement du système (rupture, réapprovisionnement, confirmation) et transmise sans délai significatif à l'utilisateur concerné. |

---

## 1. Exigences relatives au Chapitre 1 — Généralités et état de l'art

Cette section précise ce qu'on attend du premier chapitre, en termes de contenu et de rigueur — pas juste une introduction générale, mais une vraie mise à plat du domaine et de ce qui existe déjà.

### 1.1. Présentation du domaine pharmaceutique
Avant de parler du système lui-même, le mémoire doit poser des bases claires et sourcées (littérature académique, réglementation, organismes officiels) sur les notions suivantes, sans lesquelles la suite serait mal comprise :
- **Pharmacie et officine :** statut légal, missions, acteurs impliqués ;
- **Médicament :** classification (générique, princeps, sur ordonnance, en vente libre), unité de gestion (DCI, dosage, forme galénique) ;
- **Stock pharmaceutique :** notion de seuil critique, de péremption, de traçabilité ;
- **Prescription et disponibilité :** lien entre ordonnance et dispensation, notion de disponibilité en temps réel.

### 1.2. Développer la problématique
Il ne suffit pas d'affirmer que « chercher un médicament est compliqué » — il faut l'étayer, même avec des moyens limités (un petit sondage, des retours d'expérience, des chiffres trouvés dans la littérature). C'est ce qui donnera du poids au reste du mémoire. Les points suivants doivent être traités :
- Temps et coût du déplacement du patient entre plusieurs pharmacies ;
- Asymétrie d'information entre pharmacien et patient sur la disponibilité réelle d'un médicament ;
- Fréquence et conséquences sanitaires/économiques des ruptures de stock ;
- Absence d'outil numérique unifié et accessible pour pallier ces difficultés dans le contexte local.

### 1.3. Faire un vrai état de l'art
L'état de l'art ne doit pas se contenter de citer des noms d'applications : il doit comparer, critiquer, et en tirer des enseignements. Au minimum quatre catégories de solutions doivent être passées en revue, avec une grille de lecture commune (fonctionnalités, couverture géographique, modèle économique, points forts, limites) :

| Catégorie | Éléments à analyser obligatoirement |
| :--- | :--- |
| **Plateformes de recherche de médicaments** | Couverture, mode de mise à jour des stocks (manuel/automatique), fiabilité temps réel |
| **Applications de gestion de pharmacie** | Modules de gestion de stock, interopérabilité, ergonomie |
| **Systèmes de géolocalisation** | Précision, API utilisées (Google Maps, OpenStreetMap...), coût |
| **Systèmes de réservation** | Processus de confirmation, gestion des annulations, notifications associées |

Un tableau récapitulatif (solution / fonctionnalités / limites) doit clore cette partie, suivi d'une conclusion qui explique clairement en quoi les solutions existantes restent insuffisantes — c'est cette conclusion qui prépare et justifie la solution proposée.

### 1.4. Présenter la solution proposée
Ici, il s'agit de répondre, un par un, aux manques identifiés dans l'état de l'art, et de présenter à un niveau encore général les quatre piliers du projet : recherche intelligente, géolocalisation, réservation, alerte en temps réel.

---

## 2. Exigences relatives au Chapitre 2 — Analyse et conception

### 2.1. Acteurs du système

| Acteur | Description et responsabilités |
| :--- | :--- |
| **Patient / Utilisateur** | Recherche des médicaments, consulte la disponibilité et la localisation des pharmacies, réserve un médicament, reçoit des notifications, gère son profil et son historique. |
| **Pharmacien** | Gère le profil de sa pharmacie, gère le catalogue de médicaments et les niveaux de stock, traite les réservations, configure les seuils d'alerte, consulte des statistiques. |
| **Administrateur** | Valide l'inscription des pharmacies, supervise les utilisateurs, gère le référentiel global des médicaments, supervise les statistiques globales, assure la modération et la conformité des données. |

### 2.2. Exigences fonctionnelles (EF)
Chaque besoin fonctionnel est numéroté (EF-xx) et classé par priorité selon la méthode MoSCoW : Must have (M), Should have (S), Could have (C), Won't have this time (W).

#### 2.2.1. Module Gestion des utilisateurs
| Code | Exigence | Priorité |
| :--- | :--- | :---: |
| **EF-01** | Le système doit permettre l'inscription d'un patient avec vérification de l'adresse e-mail ou du numéro de téléphone. | M |
| **EF-02** | Le système doit permettre l'inscription d'une pharmacie, soumise à validation par l'administrateur avant activation du compte. | M |
| **EF-03** | Le système doit permettre l'authentification sécurisée par identifiant/mot de passe avec gestion des rôles (patient, pharmacien, administrateur). | M |
| **EF-04** | Le système doit permettre la réinitialisation du mot de passe via un lien ou code à usage unique. | M |
| **EF-05** | Le système doit permettre à chaque utilisateur de consulter et modifier son profil (coordonnées, préférences de notification). | S |
| **EF-06** | Le système doit journaliser les connexions et actions sensibles pour audit. | C |

#### 2.2.2. Module Gestion des pharmacies
| Code | Exigence | Priorité |
| :--- | :--- | :---: |
| **EF-07** | Le système doit permettre au pharmacien de renseigner et mettre à jour les informations de son officine (nom, adresse, coordonnées GPS, horaires, contact). | M |
| **EF-08** | Le système doit permettre à l'administrateur de valider, suspendre ou révoquer le compte d'une pharmacie. | M |
| **EF-09** | Le système doit permettre l'affichage du statut d'une pharmacie (ouverte/fermée) selon ses horaires déclarés. | S |
| **EF-10** | Le système doit permettre à un patient de consulter la fiche détaillée d'une pharmacie (services, contact, itinéraire). | S |

#### 2.2.3. Module Gestion des médicaments et des stocks
| Code | Exigence | Priorité |
| :--- | :--- | :---: |
| **EF-11** | Le système doit maintenir un référentiel central des médicaments (DCI, nom commercial, dosage, forme, catégorie), administré par l'administrateur. | M |
| **EF-12** | Le système doit permettre au pharmacien d'associer un médicament du référentiel à son stock local avec quantité disponible et prix. | M |
| **EF-13** | Le système doit permettre au pharmacien de mettre à jour manuellement la quantité en stock. | M |
| **EF-14** | Le système doit permettre l'import/mise à jour groupée du stock via fichier (CSV/Excel). | C |
| **EF-15** | Le système doit calculer automatiquement le statut de disponibilité (disponible / stock faible / rupture) selon des seuils configurables. | M |
| **EF-16** | Le système doit archiver l'historique des mouvements de stock (entrées/sorties) à des fins statistiques. | C |

#### 2.2.4. Module Recherche et géolocalisation
| Code | Exigence | Priorité |
| :--- | :--- | :---: |
| **EF-17** | Le système doit permettre la recherche d'un médicament par nom commercial, DCI ou catégorie. | M |
| **EF-18** | Le système doit afficher, pour un médicament recherché, la liste des pharmacies le proposant, triées par distance croissante par rapport à la position de l'utilisateur. | M |
| **EF-19** | Le système doit géolocaliser l'utilisateur (avec son consentement) ou permettre la saisie manuelle d'une adresse/zone de recherche. | M |
| **EF-20** | Le système doit afficher les résultats de recherche sur une carte interactive avec marqueurs des pharmacies. | M |
| **EF-21** | Le système doit permettre le filtrage des résultats par rayon de distance, disponibilité et prix. | S |
| **EF-22** | Le système doit proposer un itinéraire vers la pharmacie sélectionnée (intégration cartographique). | S |
| **EF-23** | Le système doit suggérer les pharmacies les plus proches disposant d'un médicament alternatif en cas de rupture chez toutes les pharmacies pour le médicament initial. | C |

#### 2.2.5. Module Réservation
| Code | Exigence | Priorité |
| :--- | :--- | :---: |
| **EF-24** | Le système doit permettre à un patient authentifié de réserver une quantité d'un médicament disponible dans une pharmacie donnée. | M |
| **EF-25** | Le système doit notifier le pharmacien de toute nouvelle demande de réservation. | M |
| **EF-26** | Le système doit permettre au pharmacien de confirmer, refuser ou annuler une réservation. | M |
| **EF-27** | Le système doit décrémenter automatiquement le stock lors de la confirmation d'une réservation. | M |
| **EF-28** | Le système doit appliquer une expiration automatique des réservations non retirées après un délai configurable. | S |
| **EF-29** | Le système doit permettre au patient de consulter l'historique de ses réservations. | S |

#### 2.2.6. Module Notifications et alertes temps réel
| Code | Exigence | Priorité |
| :--- | :--- | :---: |
| **EF-30** | Le système doit alerter automatiquement le pharmacien lorsqu'un stock atteint le seuil critique défini. | M |
| **EF-31** | Le système doit permettre à un patient de s'abonner à une alerte de réapprovisionnement pour un médicament en rupture dans une pharmacie donnée. | M |
| **EF-32** | Le système doit notifier en temps réel (technologie push/WebSocket) le patient dès que le médicament suivi redevient disponible. | M |
| **EF-33** | Le système doit notifier le patient du changement de statut de sa réservation (confirmée, refusée, expirée). | M |
| **EF-34** | Le système doit permettre à l'administrateur de diffuser des notifications globales (maintenance, alerte sanitaire). | C |

#### 2.2.7. Module Administration et tableau de bord
| Code | Exigence | Priorité |
| :--- | :--- | :---: |
| **EF-35** | Le système doit fournir au pharmacien un tableau de bord avec indicateurs clés (nombre de réservations, produits en rupture, produits les plus recherchés). | S |
| **EF-36** | Le système doit fournir à l'administrateur une vue globale (nombre de pharmacies actives, volumétrie des recherches, cartographie des ruptures). | S |
| **EF-37** | Le système doit permettre l'export des statistiques au format PDF/Excel. | C |

### 2.3. Exigences non fonctionnelles (ENF)
| Code | Exigence | Priorité |
| :--- | :--- | :---: |
| **ENF-01** | **Sécurité** — Mots de passe hachés (bcrypt/Argon2) ; échanges chiffrés en HTTPS ; contrôle par rôle (RBAC) via jetons JWT. | M |
| **ENF-02** | **Confidentialité** — Données personnelles/géolocalisation traitées selon minimisation et consentement explicite. | M |
| **ENF-03** | **Performance** — Temps de réponse d'une recherche géolocalisée < 2s (rayon 20 km, 500 pharmacies de test). | M |
| **ENF-04** | **Disponibilité** — Disponibilité cible de 99% en environnement de démonstration/production académique. | S |
| **ENF-05** | **Scalabilité** — Ajout de pharmacies et médicaments sans modification du schéma de base de données. | S |
| **ENF-06** | **Ergonomie** — Interface responsive (desktop, tablette, mobile) et accessible. | M |
| **ENF-07** | **Portabilité** — Backend déployable via conteneurisation (Docker). | S |
| **ENF-08** | **Maintenabilité** — Code structuré en couches (contrôleur/service/repository), documenté, versionné sous Git. | M |
| **ENF-09** | **Traçabilité** — Modification de stock/réservation horodatée et attribuée à un utilisateur. | S |
| **ENF-10** | **Internationalisation** — Conception permettant l'ajout d'une langue sans refonte majeure. | W |

### 2.4. Modélisation UML attendue
Les diagrammes doivent être assez détaillés pour servir directement de base au développement du chapitre 3 :
1. **Diagramme de cas d'utilisation** général, et détaillés par acteur (patient, pharmacien, administrateur).
2. **Diagramme de classes** complet (Utilisateur, Pharmacie, Médicament, Stock, Réservation, Prix, Notification, Localisation).
3. **Diagrammes de séquence** (recherche géolocalisée, réservation, alerte rupture, alerte réapprovisionnement).
4. **Diagramme d'activités** (processus global de traitement d'une réservation).
Chaque diagramme doit être accompagné d'un texte explicatif (acteurs, préconditions, postconditions, cas limites).

### 2.5. Base de données
Modèle normalisé (au moins 3ème FN) couvrant a minima :

| Entité | Attributs clés attendus |
| :--- | :--- |
| **Utilisateur** | id, nom, prénom, email, mot de passe (haché), téléphone, rôle, date de création |
| **Pharmacie** | id, nom, adresse, latitude, longitude, horaires, statut de validation, id utilisateur (FK) |
| **Médicament** | id, dénomination commune (DCI), nom commercial, dosage, forme, catégorie, nécessite ordonnance (bool) |
| **Stock** | id, id pharmacie (FK), id médicament (FK), quantité disponible, seuil critique, date de mise à jour |
| **Prix** | id, id stock (FK), montant, devise, date d'application |
| **Réservation** | id, id utilisateur (FK), id stock (FK), quantité, statut, date de création, date d'expiration |
| **Notification** | id, id utilisateur (FK), type, contenu, statut de lecture, date d'émission |
| **Localisation** | id, entité liée, latitude, longitude, précision, date de mise à jour |

### 2.6. Architecture technique
Architecture trois-tiers classique :
- **Couche présentation :** application web Angular, responsive, consommant l'API REST ;
- **Couche métier/API :** API REST Spring Boot (contrôleur/service/repository), sécurité Spring Security/JWT ;
- **Couche de persistance :** PostgreSQL, avec extension géographique (PostGIS recommandé) ;
- **Service cartographique :** Leaflet avec OpenStreetMap ;
- **Couche temps réel :** WebSocket/STOMP ;
- **Gestion de versions :** Git/GitHub avec convention de nommage.

### 2.7. Maquettes
Maquettes (basse puis haute fidélité) obligatoires pour : accueil/recherche, résultats avec carte, fiche pharmacie, tableau de bord pharmacien, gestion de stock, réservation, centre de notifications, back-office administrateur.

---

## 3. Exigences relatives au Chapitre 3 — Réalisation et implémentation

### 3.1. Exigences d'environnement et d'outillage
| Composant | Technologie imposée / recommandée |
| :--- | :--- |
| **Backend** | Spring Boot (Java), architecture en couches, API REST documentée (Swagger/OpenAPI) |
| **Frontend** | Angular, architecture par modules/composants réutilisables |
| **Base de données** | PostgreSQL, migrations versionnées (Flyway ou Liquibase recommandé) |
| **Cartographie** | Leaflet + fonds de carte OpenStreetMap |
| **Temps réel** | WebSocket (STOMP sur SockJS ou équivalent) |
| **Gestion de versions** | Git avec dépôt distant GitHub |
| **Sécurité** | Spring Security, JWT, hachage BCrypt |

### 3.2. Ce qui est attendu module par module
Chaque module mérite sa propre sous-section dans le mémoire avec choix, extraits de code, captures d'écran et difficultés rencontrées :
1. **Authentification et rôles :** inscription, connexion, JWT, contrôle d'accès.
2. **Module pharmacie :** CRUD pharmacie, validation administrateur, gestion des horaires.
3. **Module médicaments :** référentiel central, recherche, catégorisation.
4. **Gestion des stocks :** association médicament/pharmacie, mise à jour, statut de disponibilité.
5. **Moteur de recherche :** filtres combinés, tri par pertinence/proximité.
6. **Géolocalisation :** position utilisateur, distance (Haversine ou PostGIS), affichage carte Leaflet.
7. **Réservation :** cycle de vie (création, confirmation, refus, expiration).
8. **Alertes de rupture :** déclenchement auto, ciblage, historisation.
9. **Suggestion de pharmacies :** algorithme de classement par distance et disponibilité.
10. **Tableau de bord :** agrégation, représentation graphique.
11. **Interfaces principales :** captures annotées et parcours utilisateur.

*Règle transversale : un module est "terminé" lorsqu'il est testé.*

---

## 4. Exigences relatives au Chapitre 4 — Tests, résultats et perspectives

### 4.1. Stratégie de tests
| Type de test | Portée exigée |
| :--- | :--- |
| **Tests unitaires** | Services métier critiques (JUnit/Mockito, Jasmine/Karma). |
| **Tests fonctionnels** | Vérification de chaque exigence (EF-01 à EF-37). |
| **Tests d'intégration** | Communication frontend/API/base de données et WebSocket. |
| **Tests de recherche** | Pertinence/performance sur 500 médicaments / 100 pharmacies. |
| **Tests de géolocalisation** | Précision du calcul de distance et tri sur cas limites. |
| **Tests de réservation** | Transitions d'état et cohérence du stock. |

### 4.2. Scénarios de tests
Gabarit exigé : identifiant, exigence couverte, préconditions, étapes, résultat attendu, résultat obtenu, statut. Le chapitre doit se terminer par un tableau de synthèse avec taux de couverture.

### 4.3. Résultats et perspectives
Bilan critique des objectifs atteints/non atteints. Perspectives : ordonnance électronique, interconnexion ordres professionnels, application mobile native, prédiction de ruptures via apprentissage automatique.

---

## 5. Contraintes du projet

### 5.1. Contraintes techniques
- Stack imposée (Angular / Spring Boot / PostgreSQL / Leaflet-OpenStreetMap) à respecter.
- Compatibilité navigateurs récents (Chrome, Firefox, Edge).
- Données géographiques crédibles pour la démo.

### 5.2. Contraintes organisationnelles et réglementaires
- Respect des données personnelles (consentement, finalité, minimisation).
- Réservation $\neq$ prescription médicale (ne remplace pas l'avis d'un professionnel).
- Respect du calendrier académique pour la soutenance.

### 5.3. Contraintes de qualité documentaire
- Structure en 4 chapitres respectée.
- Figures, tableaux et diagrammes numérotés et titrés.
- Normes bibliographiques appliquées pour les sources.

---

## 6. Livrables attendus

| Livrable | Chapitre associé |
| :--- | :--- |
| Rapport de mémoire complet (4 chapitres) au format PDF | Tous |
| Diagrammes UML (cas d'utilisation, classes, séquence, activités) | Chapitre 2 |
| Scripts de création de la base de données (DDL) et modèle physique | Chapitre 2 |
| Maquettes des interfaces (basse et haute fidélité) | Chapitre 2 |
| Code source complet (backend Spring Boot + frontend Angular), versionné sur Git | Chapitre 3 |
| Documentation de l'API (Swagger/OpenAPI) | Chapitre 3 |
| Jeu de données de démonstration (pharmacies, médicaments, stocks) | Chapitre 3 |
| Rapport de tests avec scénarios et résultats | Chapitre 4 |
| Support de présentation pour la soutenance | — |

---

## 7. Critères de recevabilité et de validation
Le projet sera validé si :
- 100% des exigences « Must have (M) » sont implémentées et testées avec succès.
- Au moins 80% des exigences « Should have (S) » sont bien là.
- Les exigences de sécurité (ENF-01 et ENF-02) sont respectées sans aucune exception.
- Le rapport de tests montre au moins 90% de couverture fonctionnelle conforme.
- Le mémoire suit fidèlement le plan en 4 chapitres validé.

---
*Fin du cahier des charges*
