# FX — Convertisseur de devises

Un convertisseur de devises et un outil de suivi des taux de change, avec un style inspiré des plateformes de trading.
Tout tient en **3 fichiers** (HTML, CSS, JavaScript), sans framework ni installation.

## Fonctionnalités

**Accueil**
- Présentation du site et accès direct au convertisseur ou aux courbes.

**Convertisseur**
- Conversion entre 20 devises (euro, dollar, livre, yen, dirham, dinar, franc CFA…).
- Montants rapides en un clic (10, 50, 100, 1 000).
- Frais bancaires : affiche ce que l'on reçoit vraiment après les frais.
- Taux unitaire, bouton « Copier le résultat », historique des 5 dernières conversions.
- Taux de secours approximatifs si internet ne fonctionne pas.

**Courbes**
- Graphique de 1 mois à 5 ans, en **ligne** ou en **bougies**.
- Réticule au survol avec la date et la valeur du jour.
- Mode **Monnaies** : compare la force de plusieurs monnaies en %.
- Liste de surveillance avec la variation du jour, bandeau de taux qui défile.

**Interface**
- Thème sombre aux couleurs néon, animations discrètes.
- Les animations se coupent si l'ordinateur est réglé sur « réduire les animations ».

## Lancer le projet

Aucune installation : ouvrez le fichier `.html` dans un navigateur (double-clic).
Une connexion internet est nécessaire pour les taux du jour et les courbes.

Pour ouvrir directement une vue, ajoutez `#convertisseur` ou `#courbes` à la fin de l'adresse.

## Structure

| Fichier     | Rôle                                                                            |
|-------------|---------------------------------------------------------------------------------|
| `.html`     | La structure de la page : menu, accueil, convertisseur, graphique, pied de page |
| `style.css` | L'apparence : thème sombre, mise en page, effets néon, animations               |
| `.js`       | La logique : téléchargement des taux, calculs, dessin du graphique, navigation  |

## Sources des données

| Donnée       | Source                                                                                       |
|--------------|----------------------------------------------------------------------------------------------|
| Taux du jour | [ExchangeRate-API](https://www.exchangerate-api.com) (`open.er-api.com`, gratuit, sans clé)  |
| Historique   | [Frankfurter](https://frankfurter.dev), données de la Banque centrale européenne             |

La BCE ne suit pas le dirham marocain, le dinar tunisien, le dinar algérien ni le franc CFA :
ces devises n'ont pas de courbe, mais elles restent disponibles dans le convertisseur.

Les taux sont fournis **à titre indicatif** et ne constituent pas un conseil financier.

## Sécurité

- **Content Security Policy** stricte : la page ne charge que ses propres fichiers et ne contacte que les 2 API de taux.
- Le contenu est affiché uniquement avec `textContent` (jamais `innerHTML`), ce qui empêche l'injection de code.
- Les montants, les frais et les taux reçus des API sont vérifiés avant d'être utilisés.
- Seules les 3 vues prévues sont acceptées dans l'adresse.
- Aucune clé d'API ni aucun secret dans le code.

## Vie privée (RGPD)

- Aucun cookie, aucun traceur, aucun stockage dans le navigateur.
- Polices déjà installées sur l'ordinateur (pas de Google Fonts), pour ne pas transmettre l'adresse IP à Google.
- Seule l'adresse IP du visiteur est transmise aux 2 fournisseurs de taux, au moment où la page télécharge les taux. C'est indiqué en bas de la page.

> Si le site est publié en ligne, la loi française (LCEN) impose d'ajouter des mentions légales : l'identité de l'éditeur et celle de l'hébergeur.

## Versions

- `v1-sobre` : première version, au design clair et sobre (étiquette git).
- `tradingview` : version actuelle, avec le thème trading, les courbes et l'accueil (branche git).

```bash
git switch main          # revenir à la version sobre
git switch tradingview   # revenir à la version actuelle
```

## Limites connues

- Windows n'affiche pas les drapeaux en émoji : il montre deux lettres à la place (« US », « EU »).
- Les bougies sont calculées à partir d'un seul taux par jour : ce ne sont pas les vrais plus hauts et plus bas de la journée.
- L'historique des conversions disparaît quand on ferme la page (c'est voulu : rien n'est stocké).

## Crédits

Site réalisé avec l'aide d'une intelligence artificielle (Claude, d'Anthropic).
