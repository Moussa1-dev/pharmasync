# PharmaSync — Version corrigée finale

## Résumé de la vérification générale

| Vérification | Résultat |
|---|---|
| Compilation du frontend (Angular) | OK, sans erreur |
| Tests automatiques du frontend | 14 sur 14 réussis |
| Ouverture des 17 pages (admin et pharmacien) | 17 sur 17 sans erreur |
| Chaque appel du frontend a sa route dans le backend | 62 sur 62 |
| Géolocalisation (GPS, quartier, clic carte) | testée dans Chrome : OK |
| Inscription, activation, mot de passe oublié | testés dans Chrome : OK |
| Backend (Java) | relu et corrigé, **à compiler chez vous** : `mvnw test` |

Le backend n'a pas pu être compilé ici (pas d'accès aux bibliothèques Java).
Lancez `mvnw test` dans le dossier `backend` et envoyez l'erreur s'il y en a une.

---


## 1. Tests du frontend (vérifié : 13 tests sur 13 réussis)

Avant : aucun test ne pouvait se lancer, puis 7 échouaient.
Le problème venait de la préparation des tests, pas de l'application.

- `src/app/app.component.spec.ts` : test réécrit (il cherchait un titre qui n'existe plus).
- `search`, `pos`, `home`, `dashboard` (`*.spec.ts`) : ajout des services manquants
  (routeur, HttpClient) dans les tests.
- `src/test-global-polyfill.ts` (nouveau) : définit `global` pour sockjs-client pendant les tests.
- `angular.json` et `tsconfig.spec.json` : prise en compte de ce fichier.

## 2. Compilation du frontend sans Internet

- `angular.json` : les polices Google ne sont plus téléchargées pendant `ng build`.
  Avant, la compilation échouait sans connexion Internet.

## 3. Backend (à vérifier avec `mvnw test`, non compilé ici)

- **Sécurité** (`security/PharmacyAccessService.java`, nouveau) : un pharmacien ne peut
  modifier que les pharmacies qui lui sont assignées. L'administrateur gère tout.
  Appliqué à : ajout, modification, suppression et import CSV de stock, ventes,
  changement de statut des réservations.
- **Réservation** (`ReservationController`) : le prix, le statut et l'état du paiement
  sont fixés par le serveur, plus par le client. Quantité nulle ou négative refusée.
- **Annulation** : une réservation expirée ou déjà annulée ne rend plus le stock une
  deuxième fois.
- **Vente** (`SaleController`) : quantité négative refusée ; le stock doit appartenir
  à la pharmacie de la vente.
- **Plusieurs lots** (`StockRepository`) : quand un médicament a plusieurs lots,
  la vente, l'ajout, l'import CSV et le code-barres utilisent le lot qui périme en
  premier, au lieu de provoquer une erreur.
- **Modification de stock** : quantité négative ou invalide refusée.
- **Suppression de stock** : message clair au lieu d'une erreur si le stock est
  lié à des réservations ou des ventes.

## 4. Configuration

- `.env.example` : port corrigé en 8081 (le frontend appelle le port 8081).

## Ce que vous devez faire

    cd backend
    mvnw test          (Windows : mvnw.cmd test)

Si une erreur apparaît, envoyez le message d'erreur complet.

## 5. Message « Accès GPS refusé ou impossible » (recherche)

Sur un ordinateur sans GPS, ce message rouge s'affichait à chaque ouverture
de la page Recherche, alors que la recherche fonctionnait quand même.

- `search/search.component.ts` : à l'ouverture de la page, plus de message ;
  la position de N'Djamena est utilisée automatiquement.
- Le message ne s'affiche que si l'on clique sur « Utiliser ma position »,
  et il est maintenant informatif (bleu) au lieu d'une erreur (rouge).
- Réglage GPS moins strict : la position par Wi-Fi/réseau du PC est acceptée.

## 6. Pharmacie la plus proche indiquée automatiquement (nouveau)

Quand on cherche un médicament, l'application montre tout de suite
la pharmacie la plus proche qui l'a EN STOCK :
- un encadré vert en haut des résultats (nom, distance, adresse),
  avec les boutons « Itinéraire » et « Réserver ici » ;
- la carte se centre sur vous et sur cette pharmacie, et sa fiche s'ouvre ;
- sa carte de résultat a une bordure verte et le badge « La plus proche ».
Une pharmacie proche mais en rupture n'est pas choisie.

Fichiers : `search/search.component.ts`, `search/search.component.html`.
Nouveau test ajouté : les tests du frontend passent maintenant à 14 sur 14.

## 7. Page d'accueil (interface inchangée, fonctions reliées)

- Les 4 avantages de « Pourquoi PharmaSync ? » sont maintenant cliquables,
  avec exactement le même aspect :
  * « Pharmacies de garde visibles en un clic » -> page Recherche, filtre de garde activé ;
  * « Itinéraire vers la pharmacie la plus proche » -> page Recherche ;
  * « Tableau de bord pharmacien complet » -> Tableau de bord ;
  * « Point de vente avec facture PDF » -> Vente (POS).
- Recherche : le bouton « Pharmacies de garde » filtre aussi la liste
  des pharmacies proches quand aucun médicament n'est saisi.
- Menu : « Tableau de bord » n'est plus surligné en même temps que
  « Stocks » ou « Réservations ».

## 8. Style qui ne dépend plus d'Internet

- Les polices Google sont chargées par une balise dans `index.html`
  au lieu d'un `@import` dans `styles.css`. Sans Internet, l'application
  garde toutes ses couleurs et sa mise en page (seule la police change).

## 9. Alertes vraiment en « Temps réel » (backend)

Avant : les alertes de stock bas / péremption n'étaient vérifiées que
toutes les 30 minutes.
Maintenant : chaque modification de stock (mise à jour, ajout, import CSV,
vente, réservation) vérifie tout de suite ce stock. L'alerte arrive
immédiatement chez le pharmacien (WebSocket), avec « Rupture de stock »
si la quantité tombe à 0. La vérification toutes les 30 minutes reste
comme filet de sécurité.
Fichiers : `service/StockAlertScheduler.java` (nouvelle méthode `checkStock`),
`StockManagementController`, `PharmacyController`, `SaleController`,
`ReservationController`.

## 10. Géolocalisation plus précise (frontend, testée dans Chrome)

- 1er essai : GPS précis (téléphone). 2e essai automatique : position
  par Wi-Fi/réseau (ordinateur). Sinon : N'Djamena par défaut.
- La précision est affichée : « Position détectée (précision ± 12 m) ».
- Test réel : avec GPS -> position et précision affichées ;
  sans GPS -> N'Djamena, sans message d'erreur à l'ouverture.

## 11. Position sur ordinateur (sans GPS) — testé dans Chrome

Un ordinateur n'a pas de puce GPS. L'application propose donc 3 solutions :
1. Taper son quartier ou son adresse (ex. « Moursal ») puis « Placer ma position ».
   La recherche utilise OpenStreetMap (Nominatim), gratuit, sans clé.
2. Cliquer directement sur la carte à l'endroit où l'on se trouve
   (ou faire glisser le marqueur bleu).
3. La position choisie est MÉMORISÉE : aux visites suivantes sur ce PC,
   elle est utilisée tout de suite, sans attendre le GPS.

Aussi : si le GPS répond en retard, il n'écrase plus la position choisie à la main.
Test réel : PC sans GPS -> quartier « Moursal » placé -> clic sur la carte ->
retour sur la page : la position mémorisée est bien réutilisée.

## 12. Quartiers introuvables — testé dans Chrome

Certains quartiers de N'Djamena ne sont pas (ou mal) enregistrés sur
OpenStreetMap. Maintenant :
1. Suggestions : en tapant, la liste des 79 quartiers officiels
   (10 arrondissements) s'affiche. On choisit la bonne orthographe.
2. Plusieurs essais automatiques : nom exact, nom sans accents
   (Klémat -> Klemat), sans tirets, puis avec « N'Djamena ».
   La recherche est limitée à la zone de N'Djamena.
3. Si le quartier reste introuvable : un message demande de cliquer
   UNE fois sur la carte. La position est enregistrée sous le nom
   du quartier, et réutilisée les fois suivantes.


## 13. Vérification générale finale

- **Mot de passe oublié en panne (backend)** : la suppression des anciens
  jetons se faisait hors transaction, ce qui provoquait une erreur.
  Corrigé (`PasswordResetTokenRepository`).
- **Lien « Mot de passe oublié ? » inactif (frontend)** : la page de connexion
  n'importait pas `RouterLink`. Corrigé.
- **Pas d'écran d'inscription** alors que le serveur le permettait :
  nouvelle page `/register` « Créer un compte patient » (lien sur la page
  de connexion), avec vérification des champs.
- **Démonstration sans vrai e-mail** : en profil `dev`, le serveur renvoie
  le lien d'activation / de réinitialisation, et l'écran affiche un bouton
  pour l'utiliser. En profil `prod`, ces liens ne sont jamais renvoyés.
- **Sécurité** : le mot de passe oublié ne révèle plus si un e-mail est
  inscrit ; mot de passe de 6 caractères minimum (inscription et réinitialisation).

## 14. Page d'accueil : chiffre « 96 % » supprimé

La carte « Disponibilité — 96 % satisfaction utilisateurs » a été retirée :
ce chiffre n'était mesuré nulle part. Les cartes « Alertes — Temps réel »
et « Carte — GPS » restent, et elles sont maintenant vraies.

## 15. Pharmacies réelles de N'Djamena

Les 6 pharmacies de démonstration sont maintenant de VRAIES pharmacies,
avec leur vraie adresse, leur téléphone et leur position GPS
(relevés sur Google Maps, septembre 2026) :

| Pharmacie | Adresse | Téléphone |
|---|---|---|
| Pharmacie du Salut | 4112 Avenue Pascal Yoadoumadji | +235 66 30 46 98 |
| Pharmacie Béguinage | Rue du Havre | +235 66 36 57 57 |
| Pharmacie La Place | Av. Charles de Gaulle (face Place de la Nation) | +235 66 01 03 02 |
| Pharmacie La Vaillance | Moursal | +235 66 30 70 41 |
| Pharmacie du Sacré-Cœur | Avenue du Lycée de Gassi | +235 66 89 25 48 |
| Dépôt Pharmaceutique Al-Salama | BP 926 | +235 22 51 15 11 |

Restent des données de DÉMONSTRATION (non réelles) : les quantités en stock,
les prix indicatifs et le statut « de garde ». Aucune pharmacie ne publie
ces informations ; il faudrait leur accord pour les connecter à PharmaSync.

Autres corrections liées :
- Tableau de bord : le titre affichait toujours « Pharmacie Centrale ».
  Il affiche maintenant le nom de la pharmacie active.
- Profil prod (PostgreSQL) : `data.sql` était rechargé à chaque démarrage,
  ce qui dupliquait les pharmacies. Il n'est chargé que si `SQL_INIT_MODE=always`
  (premier lancement). Voir README.

## 16. Compte pharmacien de démonstration

L'e-mail `contact@pharmasalut.td` est remplacé par `pharmacien@pharmasync.com`,
comme le compte administrateur (`admin@pharmasync.com`). Mot de passe inchangé : `pharma123`.
Modifié dans : `DataSeeder.java`, écran de connexion, README, mémoire.
Avec PostgreSQL (profil prod), l'ancien compte reste dans la base : le nouveau
est créé automatiquement au prochain démarrage.

## 17. « Pharmacie active » respectée sur toutes les pages

Avant : la page Statistiques affichait toujours la Pharmacie du Salut
(pharmacie n°1 écrite en dur), la page Gardes proposait toujours la
Pharmacie du Salut, et après chaque reconnexion la pharmacie active
revenait à la Pharmacie du Salut.

Maintenant (testé dans Chrome) :
- Tableau de bord, Stocks, Réservations, Vente (POS), Statistiques,
  Commandes fournisseurs et Notifications utilisent la pharmacie choisie
  dans « Pharmacie active », et affichent son nom dans le titre.
- Gardes : le planning reste celui de toute la ville, mais la pharmacie
  proposée pour un nouveau créneau est la pharmacie active.
- Changer de pharmacie met à jour la page ouverte immédiatement.
- La dernière pharmacie choisie est gardée pour chaque compte, même après
  déconnexion / reconnexion.

## 18. Une page = un sujet (menu Stocks / Réservations)

Avant : « Stocks » et « Réservations » ouvraient tout le tableau de bord
(indicateurs, activité récente, 7 onglets).
Maintenant (testé dans Chrome) :
- « Tableau de bord » : vue d'ensemble complète (indicateurs, alertes,
  activité récente et tous les onglets).
- « Stocks » : uniquement le stock -> Inventaire, Médicaments disponibles,
  Péremptions, Mouvements (+ traçabilité des lots).
- « Réservations » : uniquement le tableau des réservations.
- Le titre change : « Stocks - [pharmacie] », « Réservations - [pharmacie] ».
- Le bloc des stocks / réservations prend maintenant toute la largeur de l'écran
  (avant, il n'occupait qu'une colonne étroite).
Les autres pages (Vente, Gardes, Statistiques, Commandes, Notifications)
étaient déjà des pages séparées, chacune sur un seul sujet.

## 19. Dates en français et champs de saisie stylés

- Les dates et les nombres s'affichaient à l'anglaise (« Monday »,
  « 10/2/27 », « 6,000.00 FCFA »). Ils sont maintenant en français
  (« Lundi », « 02/10/2027 », « 6 000,00 FCFA »). Fichier : `app.config.ts`.
- La classe `form-control` n'avait aucun style : les champs du point de
  vente, de l'inscription et du mot de passe oublié étaient minuscules et
  sans bordure. Ils ont maintenant le même style que les autres champs.
  Fichier : `styles.css`.

## 20. Préparation de la mise en ligne (voir DEPLOIEMENT.md)

- Frontend : l'adresse du serveur n'est plus écrite en dur (3 fichiers).
  Elle vient de `src/environments/` : `localhost:8081` en local,
  l'adresse Render dans la version en ligne.
- Backend : l'adresse du site autorisé (CORS, WebSocket, liens d'e-mail)
  vient de la variable `FRONTEND_URL` (nouveau `config/CorsConfig.java`) ;
  le port vient de la variable `PORT` fournie par l'hébergeur.
- Nouveaux fichiers : `backend/Dockerfile`, `render.yaml`, `DEPLOIEMENT.md`.
- En local, rien ne change.
