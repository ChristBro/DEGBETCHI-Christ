# Recette Analytics · Néotisse

La mesure sert à repérer les pages qui attirent l’attention, à suivre l’intérêt pour l’agenda et à savoir si le formulaire aboutit à des demandes. Le tableau de bord se trouve dans l’onglet **Analytics** du back-office. Il affiche les 7, 30 ou 90 derniers jours, aujourd’hui inclus, dans le fuseau Europe/Paris.

Le bouton **Voir la démo** affiche un jeu de données fictif pour une présentation. Le bandeau signale ce mode et les données de démo ne sont jamais enregistrées dans les mesures locales.

### Mesures détaillées

- **Ateliers** — une vue par atelier et par chargement lorsque son titre apparaît à l’écran sur la page Services.
- **Parcours** — séquences de deux à quatre pages dans le même onglet. Les rechargements consécutifs de la même page n’ajoutent pas d’étape. Après 30 minutes sans nouvelle page, une nouvelle séquence commence.
- **Temps par page** — moyenne des durées reçues à la sortie, en comptant les secondes où la page était visible. Durée plafonnée à 30 minutes par mesure. Une fermeture du navigateur peut empêcher l’envoi.
- **Premier clic d’accueil** — un premier clic sur « Découvrir les ateliers » ou « Nos actions » par chargement de l’accueil après accord. Les pourcentages portent sur les premiers clics reçus.

Ces mesures démarrent à l’installation de cette version. Elles ne peuvent pas être calculées à partir des anciens totaux.

## Plan de marquage

| Signal | Déclencheur | Informations de mesure | Indicateur |
| --- | --- | --- | --- |
| `page_view` | Affichage d’une page publique de l’aperçu après accord. Sur la première page, l’accord déclenche la vue. | Nom de page issu d’une liste autorisée et UUID aléatoire de l’événement. | Pages vues par jour et classement des pages. |
| Consultation d’une fiche agenda | Une vue enregistrée pour `evenement.html`. | Même événement `page_view`, compté une seule fois dans le total général. | Total des ouvertures de fiches, toutes fiches confondues. |
| `contact_success` | Le serveur a enregistré un message valide et le formulaire indique que la mesure a été acceptée. | Compteur journalier incrémenté côté serveur. | Messages reçus sur la période parmi les envois mesurés. |

Le formulaire transmet ses champs à la boîte de réception locale. Les statistiques conservent uniquement les compteurs journaliers, les noms de pages autorisés et les identifiants techniques de déduplication des vues. Les termes de recherche, paramètres d’URL, provenances et champs du formulaire sont exclus du stockage statistique. Une vue mesure un affichage, et un rafraîchissement volontaire après accord constitue un nouvel affichage.

## Collecte et accès en recette

- Lancer `Ouvrir-le-back-office.cmd`, puis ouvrir `http://127.0.0.1:4181/`. L’aperçu et l’administration ne sont accessibles que depuis cet ordinateur.
- Le navigateur envoie les vues à `POST /analytics/view`. Le serveur horodate par jour, valide le format et les pages, déduplique un UUID répété et limite la collecte des vues à 120 requêtes par minute pour ce serveur local.
- Le stockage est privé et local. Les jours hors de la fenêtre de 90 jours sont purgés lors d’une prochaine écriture. Le tableau expose des totaux.
- Lorsqu’un message a été enregistré mais que le stockage statistique échoue, le formulaire confirme quand même l’enregistrement du message. Les compteurs peuvent donc être incomplets en cas de panne.

## Vérifications du 25 novembre 2026

Les tests reproductibles se lancent depuis le dossier du projet avec `node --test admin/analytics.test.mjs`. Les deux suites ont réussi. La première exécute le script du site avec stockage et réseau simulés. La seconde appelle les routes du serveur Node avec un dossier temporaire et des données fictives.

| Cas | Résultat automatisé |
| --- | --- |
| Première vue avant le choix, refus puis navigation | Aucun appel de mesure. |
| Accord, nouvel accord sur la même page, navigation vers une fiche | Une vue à l’accord, aucun doublon au deuxième clic, une vue pour la fiche. |
| Retrait puis chargement d’une autre page, hôte hors recette | Aucun nouvel appel de mesure. |
| Même UUID reçu deux fois | Les deux requêtes sont acceptées et une seule vue est comptée. |
| Origine externe, champs inattendus, requête volumineuse, trop de requêtes | Le serveur répond respectivement 403, 400, 413 et 429. |
| Formulaire refusé ou invalide | Aucun incrément. Un formulaire valide avec accord incrémente le total de 1. |
| Tableau de bord | État initial vide, filtre à 30 jours sélectionné, une vue, une fiche et un message après les essais. |

## Vérifications navigateur à effectuer sur la recette

Le navigateur intégré n’a pas pu atteindre le serveur de test. Les résultats automatisés ci-dessus restent distincts d’une preuve dans les outils de développement. Aucune recette en ligne n’a été publiée.

1. Ouvrir l’aperçu dans une fenêtre privée. Dans **Réseau**, conserver le journal et filtrer sur `analytics/view`. Recharger avant toute action. Résultat attendu : zéro requête.
2. Refuser et ouvrir **Agenda**. Résultat attendu : zéro requête. Dans **Application → Stockage local**, vérifier la préférence `neotisse-local-audience-choice`.
3. Rouvrir les paramètres de confidentialité et accepter. Résultat attendu : une réponse 204 et deux champs dans la requête, `page` et `event_id`. Ouvrir une fiche agenda et vérifier une nouvelle requête et les compteurs du tableau de bord.
4. Refuser depuis les paramètres, puis recharger. Résultat attendu : aucun nouvel envoi de mesure.
5. Avec accord, essayer le formulaire avec un champ requis vide, puis envoyer un message fictif avec `test@example.test`. Le compteur ne doit monter que pour le message enregistré. La requête du formulaire va à la boîte de réception et doit être distinguée de la requête de mesure des pages.
6. Relever la date, l’adresse de recette, les statuts réseau et une capture du tableau de bord sans données personnelles.

La mise en ligne de la recette nécessite un hébergement autorisé et un stockage persistant. Le back-office étant local, le déploiement statique Netlify existant n’héberge pas les routes de ce serveur Node. Une recette en ligne doit limiter l’accès au back-office, pointer vers un stockage de test et afficher la notice de mesure sur son propre hôte.
