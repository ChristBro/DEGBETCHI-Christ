# Néotisse — site et back-office

Vitrine publiée précédemment sur [Netlify](https://effervescent-gecko-243f57.netlify.app/). Pour évaluer le back-office et les modifications de cette version, utilisez la copie locale du dépôt.

## Démarrage

Clonez le dépôt ou téléchargez son ZIP, puis ouvrez un terminal dans le dossier qui contient `index.html`. Avec Node.js 22 ou plus récent, lancez :

```sh
node admin/server.mjs
```

Ouvrez [l’administration](http://127.0.0.1:4173/) et gardez le terminal ouvert. Sous Windows, le lanceur `Ouvrir-le-back-office.cmd` utilise le port 4181 par défaut. Dans ce cas, suivez l’adresse affichée par le lanceur et utilisez ce même port pour l’administration et l’aperçu.

## Parcours de vérification

| Menu | Action | Vérification |
| --- | --- | --- |
| Rendez-vous | Ajouter un rendez-vous fictif et enregistrer | Il apparaît dans l’Agenda de l’aperçu. |
| Prestations | Modifier un titre et enregistrer | Le titre change sur la page Services. |
| Partenaires | Modifier le libellé d’un partenaire | Le nouveau libellé apparaît sur la vitrine locale. |
| Livre d’or | Ajouter un avis fictif et enregistrer | L’avis apparaît dans le livre d’or de l’aperçu. |
| Messages reçus | Envoyer un message fictif via l’aperçu Contact | Le message apparaît dans la boîte locale. |
| Coordonnées | Modifier un champ et enregistrer | Le nouveau contenu apparaît dans l’aperçu Contact. |
| Analytics | Ouvrir l’aperçu, accepter la mesure, visiter plusieurs pages, actualiser Analytics | Le total et la barre du jour augmentent. Le mode démo affiche des chiffres fictifs. |

Rechargez l’aperçu après chaque enregistrement. Les modifications éditoriales sont enregistrées dans `content.js`. Les messages et statistiques sont conservés dans des fichiers locaux ignorés par Git. Lancez `node --test admin/analytics.test.mjs` pour reproduire les tests automatisés de mesure. Voir aussi [la recette Analytics](Recette-Analytics.md).

## Google Analytics 4

Dans une propriété GA4 dédiée à Néotisse, créez le flux Web avec l’adresse de la vitrine. Copiez son identifiant `G-…` dans `gaMeasurementId`, dans `site.js`, puis redéployez les fichiers statiques sur Netlify. Le site charge la balise après accord, sur HTTPS. Dans le flux GA4, vérifiez les réglages de mesure améliorée et désactivez les événements automatiques hors périmètre du test. Le premier test couvre uniquement `page_view`. Avant une mise en ligne publique avec GA4, renseignez les informations effectives du traitement dans les notices du site.

Sur la vitrine déployée, ouvrez une session de test, acceptez la mesure, puis consultez Accueil, Services, Agenda et Contact. Dans GA4, relevez les `page_view` dans Temps réel ou dans DebugView via Tag Assistant. Indiquez l’URL, la date et le résultat de chaque action dans le rendu, avec les captures de GA4. Les messages reçus localement restent mesurés dans le back-office.

## Rendu H2 VibeCoding

Voir [la recette du cours](Recette-Cours-VibeCoding.md) pour les preuves et les étapes de démonstration.
