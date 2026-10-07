# Mettre PharmaSync en ligne (gratuit, avec Render)

Résultat : un site accessible partout, par exemple
- le site : https://pharmasync-web.onrender.com
- le serveur : https://pharmasync-api.onrender.com

Tout est déjà préparé dans le projet (fichiers `render.yaml` et `backend/Dockerfile`).

---

## Étape 1 — Mettre le projet sur GitHub

1. Créez un compte gratuit sur https://github.com
2. Créez un nouveau dépôt (bouton **New**), par exemple `pharmasync`.
   Laissez-le **Public** (plus simple avec Render).
3. **Important :** le dossier `frontend` contient un dossier caché `.git`
   (un ancien dépôt séparé). Supprimez-le, sinon GitHub n'enverra pas les
   fichiers du site et le déploiement échouera :

   ```
   rm -rf frontend/.git
   ```

   (Sous Windows : affichez les fichiers cachés et supprimez `frontend\.git`.)

4. Envoyez le projet dans ce dépôt. Dans un terminal, dans le dossier `gestion_parmacie` :

   ```
   git init
   git add .
   git commit -m "PharmaSync - version finale"
   git branch -M main
   git remote add origin https://github.com/VOTRE-NOM/pharmasync.git
   git push -u origin main
   ```

   (Remplacez `VOTRE-NOM` par votre nom d'utilisateur GitHub.)

## Étape 2 — Créer un compte Render

1. Allez sur https://render.com
2. Cliquez sur **Get Started** puis **GitHub** : connectez-vous avec votre compte GitHub.
   Aucune carte bancaire n'est demandée pour l'offre gratuite.

## Étape 3 — Lancer le déploiement (Blueprint)

1. Dans Render, cliquez sur **New +** puis **Blueprint**.
2. Choisissez votre dépôt `pharmasync`.
3. Render lit le fichier `render.yaml` et propose 2 services :
   `pharmasync-api` (le serveur) et `pharmasync-web` (le site).
4. Cliquez sur **Apply** (ou **Deploy Blueprint**).
5. Attendez **10 à 15 minutes** : la première compilation est longue.

## Étape 4 — Vérifier les adresses (important)

Ouvrez chaque service dans Render et regardez son adresse en haut de la page.

- Si les adresses sont exactement `https://pharmasync-api.onrender.com`
  et `https://pharmasync-web.onrender.com` : **rien à faire**, passez à l'étape 5.
- Si Render a ajouté des lettres (ex. `pharmasync-api-x7k2.onrender.com`),
  car le nom était déjà pris :
  1. Dans le fichier `frontend/src/environments/environment.prod.ts`,
     remplacez l'adresse par celle de **votre** serveur (`pharmasync-api-...`).
  2. Dans Render, service `pharmasync-api` → **Environment** →
     modifiez `FRONTEND_URL` avec l'adresse de **votre** site (`pharmasync-web-...`).
  3. Envoyez la modification sur GitHub :
     ```
     git add .
     git commit -m "Adresses Render"
     git push
     ```
     Render redéploie tout seul.

## Étape 5 — Tester

1. Ouvrez l'adresse du **site**.
2. Connectez-vous : `pharmacien@pharmasync.com` / `pharma123`.
3. Faites une recherche (« Coartem »), une réservation, une vente.

## Bon à savoir

- **Le serveur gratuit s'endort** après 15 minutes sans visite.
  La première ouverture prend alors environ 1 minute.
  👉 Le jour de la soutenance, ouvrez le site **2 minutes avant**.
- La base de démonstration (H2) **repart à zéro** à chaque redémarrage
  du serveur : les 6 pharmacies et les stocks de démonstration reviennent.
  C'est parfait pour une démonstration.
- Les comptes de démonstration :
  `admin@pharmasync.com` / `admin123`, `pharmacien@pharmasync.com` / `pharma123`,
  `patient@gmail.com` / `patient123`.
- Gardez toujours la version **sur votre ordinateur** en secours,
  au cas où Internet ne marche pas pendant la soutenance.
