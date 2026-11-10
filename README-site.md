# Néotisse

Ouvrez ce dossier dans Visual Studio Code avec **Fichier → Ouvrir le dossier**.
Pour consulter le site, ouvrez **index.html** dans votre navigateur. Aucun téléchargement ni démarrage de WordPress n’est nécessaire.

- Les six pages HTML contiennent les textes et la navigation.
- **styles.css** gère la mise en page, les couleurs et la version mobile.
- **site.js** gère le menu mobile, le filtre de l’agenda et le brouillon d’e-mail.
- **assets/** contient le logo et les photos récupérés du site Néotisse.

Les dates de l’agenda sont les exemples fictifs du WordPress. Le contact ouvre un brouillon dans la messagerie du visiteur. Les liens de mentions légales et certaines fiches d’événements ouvrent le site WordPress de démonstration.

## Back-office local

Dans le terminal de VS Code, depuis le dossier du site, lancez `node admin/server.mjs` avec Node.js 22 ou plus récent. Ouvrez ensuite [le back-office](http://127.0.0.1:4173/).

Ajoutez, modifiez ou retirez les événements et les avis, puis cliquez sur **Enregistrer**. Le statut « Fictif » affiche une mention sur le site. Rechargez l’accueil ou l’agenda pour voir les changements. Ils sont stockés dans `content.js`, que vous pouvez ensuite inclure dans un commit.

Le back-office fonctionne sur votre ordinateur. Les visiteurs consultent le site statique. Arrêtez le back-office avec Ctrl + C dans le terminal.

Le back-office propose six menus : Rendez-vous, Prestations, Partenaires, Livre d’or, Messages reçus et Coordonnées. Les prestations existantes peuvent être renommées et leurs descriptions modifiées. Pour associer un logo à un partenaire, placez son image dans `assets/partenaires/` et indiquez le nom du fichier.

Pour tester la boîte de réception, utilisez [le formulaire de contact dans l’aperçu local](http://127.0.0.1:4173/apercu/contact.html). La boîte de réception est conservée sur cet ordinateur et exclue de Git. La version statique du site continue d’ouvrir la messagerie du visiteur.
