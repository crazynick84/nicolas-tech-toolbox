# Nicolas Tech Toolbox

Boîte à outils web légère destinée au support technique, au tracking et au traitement de données.

## Première version

- Générateur d’URL avec paramètres UTM
- Validateur, formateur et minificateur JSON
- Convertisseur CSV vers requêtes SQL `INSERT`
- Générateur de réponses clients et de commentaires JIRA
- Interface responsive, sans dépendance externe

Les traitements de cette première version sont exécutés dans le navigateur : les données saisies ne sont pas envoyées à un service tiers.

## Prérequis

- PHP 8.1 ou supérieur
- Apache avec `mod_rewrite`
- MySQL/MariaDB uniquement pour les futurs modules persistants

## Lancement local

```bash
php -S localhost:8080 -t public
```

Ouvrir ensuite `http://localhost:8080`.

## Installation sur o2switch

Dans cPanel, créer un sous-domaine, par exemple `tools.example.org`, et définir sa racine sur :

```text
/home/VOTRE_COMPTE/nicolas-tech-toolbox/public
```

Puis, depuis le terminal cPanel :

```bash
cd ~
git clone https://github.com/crazynick84/nicolas-tech-toolbox.git
cd nicolas-tech-toolbox
cp .env.example .env
```

Le fichier `.env` ne doit jamais être ajouté au dépôt Git.

## Mise à jour

```bash
cd ~/nicolas-tech-toolbox
git pull origin main
```

## Feuille de route

- Testeur de webhooks et postbacks
- Visualiseur de dataLayer GTM/GA4
- Vérificateur DNS (CNAME, SPF, DKIM, DMARC)
- Bibliothèque SQL
- Suivi des incidents
- Monitoring de formulaires
