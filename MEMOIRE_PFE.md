# Mémoire de Projet de Fin d’Études

## Titre
PharmaSync : plateforme web de recherche de médicaments et de gestion de pharmacies

## 1. Introduction
Le secteur de la santé connaît aujourd’hui un besoin croissant d’outils numériques performants, rapides et accessibles. Dans un contexte où l’accès aux médicaments peut s’avérer crucial, notamment en cas d’urgence, la disponibilité de l’information devient un enjeu majeur. C’est dans cette logique que s’inscrit PharmaSync, une plateforme web dédiée à la recherche de médicaments et à la gestion des pharmacies.

L’objectif principal de ce projet est de proposer une solution moderne répondant à deux besoins complémentaires : d’une part, permettre aux patients de trouver rapidement un médicament disponible à proximité ; d’autre part, offrir aux pharmacies un espace de gestion efficace de leurs stocks, réservations et alertes.

## 2. Problématique
Les patients rencontrent souvent des difficultés pour localiser un médicament disponible lorsque celui-ci est en rupture de stock ou lorsqu’ils ignorent quelle pharmacie le propose. Cette situation peut devenir critique dans des circonstances urgentes. De plus, les pharmacies disposent peu d’outils numériques intégrés pour suivre efficacement la disponibilité de leurs produits et la gestion de leurs réservations.

PharmaSync répond à cette problématique en proposant une plateforme centralisée qui facilite la recherche de médicaments, la localisation des pharmacies et la gestion des stocks.

## 3. Objectifs du projet
Les objectifs du projet sont les suivants :
- permettre aux patients de rechercher rapidement un médicament ;
- afficher les pharmacies proposant le produit recherché ;
- faciliter la réservation d’un médicament avant retrait ;
- aider les pharmacies à gérer leurs stocks et leurs alertes ;
- fournir un tableau de bord de synthèse pour un suivi efficace de l’activité.

## 4. Analyse du besoin
L’analyse du besoin a permis de mettre en évidence plusieurs exigences fonctionnelles et techniques. Les patients doivent pouvoir rechercher un médicament, visualiser sa disponibilité et localiser les pharmacies concernées. Les pharmacies, quant à elles, doivent pouvoir ajouter ou modifier des stocks, gérer les réservations et suivre les alertes de rupture ou de péremption.

Cette approche permet de répondre à un besoin concret tout en restant réalisable dans le cadre d’un projet de fin d’études.

## 5. Architecture du système
Le système est conçu selon une architecture client-serveur en trois couches :
- la couche présentation, assurée par l’interface Angular ;
- la couche métier, implémentée avec Spring Boot ;
- la couche données, gérée par une base de données relationnelle.

Cette architecture assure une séparation claire des responsabilités et facilite l’évolution du système.

## 6. Technologies utilisées
Les technologies retenues pour la réalisation du projet sont les suivantes :
- Java avec Spring Boot pour le backend ;
- Angular pour le frontend web ;
- une base de données relationnelle pour la gestion des pharmacies, médicaments, stocks et réservations ;
- une API REST pour la communication entre les différentes couches.

## 7. Fonctionnalités développées
### 7.1 Fonctionnalités côté patient
- recherche de médicaments ;
- consultation de la disponibilité des produits ;
- localisation des pharmacies ;
- réservation de médicaments.

### 7.2 Fonctionnalités côté pharmacie
- gestion des stocks ;
- suivi des réservations ;
- gestion des alertes de rupture et de péremption ;
- consultation d’un tableau de bord de synthèse.

## 8. Résultats obtenus
Le projet a permis de mettre en place une application fonctionnelle répondant aux besoins initiaux. L’interface propose une expérience utilisateur simple et moderne, tandis que le backend assure la logique métier et la gestion des données. Le système offre ainsi une base solide pour des futurs développements.

## 9. Bénéfices du projet
PharmaSync apporte plusieurs bénéfices :
- gain de temps pour les patients ;
- meilleure gestion des stocks pour les pharmacies ;
- réduction des risques de rupture ;
- amélioration de l’accès à l’information sanitaire.

## 10. Limites et perspectives
Bien que le projet soit fonctionnel, certaines limites restent à prendre en compte, notamment l’absence d’authentification avancée, de notifications automatisées ou d’une version mobile native. Ces points constituent des pistes d’évolution intéressantes pour enrichir la plateforme à moyen terme.

## 11. Conclusion
PharmaSync représente une solution pratique et innovante visant à améliorer l’accès aux médicaments et la gestion de la pharmacie. Grâce à une architecture moderne et à des fonctionnalités utiles, ce projet répond à un besoin réel et constitue une base solide pour des évolutions futures dans le domaine de la santé numérique.
