# Néotisse · Recette Analytics VibeCoding

Consignes de référence : cours H2 « Analytics — Comprendre et mesurer l’usage d’un site », notamment fiches A, D, E, F et G.

## Recette et accès
Avec Node.js 22 ou plus récent, lancez `node admin/server.mjs` à la racine. Ouvrez http://127.0.0.1:4173/analytics. Sous Windows, le lanceur fourni indique son propre port (4181 par défaut). Utilisez le même port pour le back-office et l’aperçu. Le propriétaire de la recette est l’équipe projet qui exécute le serveur. Le prototype n’utilise aucun compte fournisseur pour son tableau de bord local. Les fichiers privés de messages et de statistiques sont ignorés par Git.

## Démonstration
1. Ouvrez une fenêtre privée et ouvrez Réseau (conserver le journal) et Application. Visitez /apercu/index.html. Filtrez sur analytics/view.
2. Avant choix, puis après un refus et une navigation, vérifiez l’absence de requête de mesure. Vérifiez la préférence dans le stockage local.
3. Sur Gestion des cookies, acceptez la mesure. Vérifiez la première vue et un seul envoi par nouvelle page consultée. Ouvrez Agenda puis une fiche. Dans Payload, relevez page et event_id.
4. Dans Contact, essayez un formulaire invalide, puis envoyez un message fictif avec test@example.test. Vérifiez l’arrivée dans Messages reçus et l’incrément dans Analytics après l’enregistrement.
5. Actualisez Analytics et essayez 1 jour, 1 semaine, 1 mois et 1 an. Vérifiez la source, le fuseau et la barre d’aujourd’hui. Le mode démo indique que ses chiffres sont fictifs.
6. Retirez votre accord dans Gestion des cookies, rechargez et naviguez. Vérifiez que les envois ont cessé.

Les périodes correspondent aux 1, 7, 30 et 365 derniers jours, aujourd’hui inclus (Europe/Paris). La vue annuelle regroupe les pages vues par mois. Les données supprimées par l’ancienne limite de 90 jours ne sont pas récupérables.

## Tests automatisés
`node --test admin/analytics.test.mjs`

La première suite exécute le script public avec des doubles pour le navigateur et le réseau. La seconde appelle les routes et inspecte le HTML produit par le serveur. Le test d’indisponibilité corrompt volontairement un fichier temporaire isolé. Le message d’erreur dans le terminal est donc attendu. La recette navigateur reste à confirmer avec des captures Réseau, Application, Messages reçus et Analytics.

## Passation
Aucun compte GA4, rapport fournisseur ni lien d’administration distant n’est nécessaire pour cette recette locale. L’intégration GA4 optionnelle du site public reste inactive sans identifiant G-… et déploiement. Le dépôt GitHub de remise doit contenir l’intégralité de ce dossier. Le professeur utilise une copie locale pour vérifier que les changements administratifs se répercutent dans l’aperçu.
