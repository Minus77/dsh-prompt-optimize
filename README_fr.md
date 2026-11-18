# Optimiseur de prompts

[![npm](https://img.shields.io/npm/v/@minus77/dsh-prompt-optimize?color=3a42d6)](https://www.npmjs.com/package/@minus77/dsh-prompt-optimize) [![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

[中文](./README.md) · [English](./README_en.md) · [Español](./README_es.md) · **Français** · [Deutsch](./README_de.md) · [Русский](./README_ru.md) · [日本語](./README_ja.md)

Un plugin DeepSeek Harness qui transforme le brouillon approximatif de votre zone de saisie en un prompt réellement utilisable. Vous relisez un diff ligne par ligne avant tout remplacement, vous pouvez annuler pendant neuf secondes ensuite, et le plugin conserve un historique local avec comparaison de versions et une bibliothèque de modèles réutilisables.

Pour savoir quel modèle choisir et à quoi sert chacun, voir le [guide des modèles](./docs/TEMPLATES.fr.md).

![Panneau de l'optimiseur](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/02-panel.png)

## Pourquoi

La plupart des prompts qui « ne fonctionnent pas » ne relèvent pas d'un problème de modèle, mais d'un problème de brouillon : la demande est là, mais le matériau, le livrable et les limites manquent. Ce plugin comble cet écart **sans quitter la zone de saisie**, et il laisse le diff et la fenêtre d'annulation décider s'il peut toucher à vos mots.

- **Aucun changement de contexte** : un bouton ouvre un panneau au-dessus de la zone de saisie.
- **Vérifiable** : un diff ligne à ligne montre ce qui change avant toute réécriture.
- **Réversible** : neuf secondes d'annulation après le remplacement.
- **Itérable** : demandez une modification sur le résultat ; seule cette partie bouge.
- **Local** : l'historique reste sur cette machine, et son activation est facultative.

## Fonctionnalités

| Capacité | Détail |
| --- | --- |
| Réécriture automatique | L'ouverture du panneau lance une passe automatique ; relancez après modification du brouillon |
| Flux en continu | Le texte arrive par fragments, peut être interrompu, ne bloque jamais la zone de saisie |
| Diff ligne à ligne | Lignes `-` / `+` avant remplacement, passages inchangés repliés |
| Annulation 9 secondes | Barre d'annulation après remplacement, expiration automatique |
| Historique | Les 50 dernières exécutions, groupées en chaînes de versions, rejouer / comparer / supprimer |
| Comparaison | Deux colonnes plus un résumé de structure local, au niveau des lignes |
| Espaces réservés | Extraire jusqu'à 5 fragments réutilisables en variables `{{snake_case}}` |
| Bilan | Note clarté, contexte, format, contraintes, exemples et robustesse, puis liste des corrections applicables en un clic |
| Autre version | Garde le résultat précédent derrière une puce pour basculer entre deux versions |
| Modèles | 15 intégrés, groupés en base / structure / exemples / raisonnement / ingénierie / rédaction / itération |
| Modèles personnalisés | Écrivez votre propre consigne de réécriture, stockez-la dans ce navigateur, importez et exportez en JSON |
| Modèle figé | Suivre le modèle de la session, ou en figer un pour ce panneau uniquement |
| Interface bilingue (zh/en) | Suit automatiquement la langue de l'application |
| Confidentialité | Historique désactivé par défaut ; s'il est activé, il reste dans `localStorage` |

## Installation

Nécessite DeepSeek Harness `>= 0.1.7-0` et Node.js `>= 18`.

### 1. Installation depuis npm (recommandé)

```bash
dsh plugin --profile web add @minus77/dsh-prompt-optimize
```

Cette commande récupère le paquet publié ([npm](https://www.npmjs.com/package/@minus77/dsh-prompt-optimize) / [release](https://github.com/Minus77/dsh-prompt-optimize/releases)) ; passez ensuite à l'étape 2.

<details>
<summary>Installation hors ligne : depuis les sources ou l'archive de release</summary>

```bash
git clone https://github.com/Minus77/dsh-prompt-optimize.git
cd dsh-prompt-optimize
npm pack          # produces minus77-dsh-prompt-optimize-0.2.0.tgz
dsh plugin --profile web add file:$PWD/minus77-dsh-prompt-optimize-0.2.0.tgz
```

</details>

### 2. Chargement dans ce profil

Modifiez `~/.dsh/profiles/<profile>/package.json` et ajoutez le paquet à `dsh.profile.bundles` :

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@minus77/dsh-prompt-optimize"
      ]
    }
  }
}
```

Redémarrez ce profil (`dsh --profile <profile>`) ; le bouton « Prompt optimizer » apparaît à droite de la zone de saisie.

> Installer avec `install_bundle` de `plugin_manager` depuis ce dépôt effectue les deux étapes à votre place — aucune modification JSON.

### Développement local

```bash
npm test                                   # 32 unit tests, no network
dsh plugin --profile dev add file:$PWD     # symlinked; restart to pick up edits
```

## Utilisation

### Ouvrir

Rédigez un brouillon, puis cliquez sur le bouton à droite de la zone de saisie.

![Entrée](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/01-entry.png)

Le panneau s'ouvre au-dessus de la zone de saisie et lance la réécriture. La première exécution demande si vous souhaitez conserver l'historique ; la réponse est mémorisée.

### Relire et remplacer

À la fin du flux, cliquez sur « Replace draft » pour afficher d'abord le diff :

![Relecture du diff](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/04-diff.png)

Après confirmation, le brouillon est remplacé et une barre d'annulation apparaît pendant neuf secondes :

![Annulation](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/05-undo.png)

### Bilan

Le bouton de bilan dans l'en-tête du résultat ne modifie jamais le brouillon. Il renvoie une note globale, six notes par dimension et jusqu'à cinq problèmes classés par gravité. Chaque problème cite le passage exact et propose un remplacement applicable sur place ; le reste du texte ne bouge pas.

![Bilan](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/10-checkup.png)

### Autre version

Le résultat ne convient pas ? Appuyez sur « Autre version » en bas. La version précédente passe derrière la puce « autre version » et les deux se basculent ; le nombre de caractères, la durée et les tokens suivent la version active.

![Autre version](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/12-variants.png)

### Modèles

Quinze modèles intégrés, groupés par intention. Les descriptions complètes sont dans [docs/TEMPLATES.fr.md](./docs/TEMPLATES.fr.md).

| Modèle | Mode | Groupe | Pour |
| --- | --- | --- | --- |
| Task brief | Prompt | Base | La plupart des brouillons « aide-moi à faire X » |
| Delivery contract | Prompt | Structure | Travail avec critères d'acceptation explicites |
| Structured extraction | Prompt | Structure | Extraire des champs fixes d'un matériau |
| Worked examples | Prompt | Exemples | Style ou format fixé par des exemples |
| Reasoning steps | Prompt | Raisonnement | Analyse en plusieurs étapes avec contrôles |
| Grounded Q&A | Prompt | Raisonnement | Répondre depuis le matériau fourni, avec citations |
| Code review | Prompt | Ingénierie | Une relecture cadrée et priorisée |
| Implementation task | Prompt | Ingénierie | Travail de code avec acceptation et interfaces |
| SQL query | Prompt | Ingénierie | Définition des métriques, champs et performance |
| Test design | Prompt | Ingénierie | Cas normaux, limites, erreurs et permissions |
| Translation | Prompt | Rédaction | Public, glossaire et format |
| Copy polish | Prompt | Rédaction | Jusqu'où la retouche peut aller |
| Role contract | System | Base | Contraintes de rôle durables |
| Agent persona | System | Base | Voix et habitudes de jugement |
| Incremental edit | Iterate | Itérer | Petites modifications sur une version |

Les modèles se changent dans le panneau ; le pied de page propose alors « rerun with new template » au lieu d'écraser le résultat en silence. Le même menu permet de créer un modèle personnalisé et de l'importer ou l'exporter en JSON.

### Modèles personnalisés

Le dernier élément du menu ouvre l'éditeur : nom, consigne de réécriture et type de brouillon concerné. Le modèle n'est conservé que dans le `localStorage` de ce navigateur et n'est envoyé nulle part ; pour le transférer ou le partager, utilisez « Exporter JSON » et « Importer JSON » dans le même éditeur.

![Modèles personnalisés](https://raw.githubusercontent.com/Minus77/dsh-prompt-optimize/main/docs/screenshots/11-custom-template.png)

## Raccourcis

| Action | Touche |
| --- | --- |
| Exécuter / relancer | `⌘ Enter` (`Ctrl Enter` sous Windows/Linux) |
| Fermer | `Esc` (menu → relecture du diff → panneau) |
| Arrêter | « Stop » dans le panneau |

## Confidentialité

- L'historique est désactivé par défaut ; une fois activé, il n'est écrit que dans le `localStorage` du navigateur.
- Le plugin envoie au modèle de langage courant le brouillon en cours, la note d'itération et le contenu du modèle — jamais votre historique.
- Désactiver l'historique conserve les entrées existantes ; « Clear » les supprime.
- Figer un modèle n'affecte que les requêtes de ce plugin, pas le modèle par défaut de la session.

## Limites connues

- Texte uniquement : les pièces jointes image ne sont pas encore acceptées comme entrée de réécriture.
- 60 000 caractères par brouillon ; au maximum 5 variables extraites.
- Les modèles de type system prompt existent dans l'API, mais le panneau n'expose que Prompt et Iterate.
- Le bilan ne fait que diagnostiquer : il ne réécrit pas le brouillon, et un passage doit faire 10 à 80 caractères pour être cité ; les brouillons très courts peuvent donc ne rien proposer.
- Les modèles personnalisés restent dans le localStorage de ce navigateur ; utilisez JSON pour les déplacer.
- Un modèle par défaut est requis ; le panneau l'indique clairement au lieu d'échouer en silence.

## Développement

```
src/spec.js          template metadata and queries
src/prompts.js       prompt construction per template
src/placeholders.js  variable parsing, anchoring and application
src/review.js        checkup parsing, validation and normalization
src/catalog.js       model and template catalog
src/index.js         host routes (models / optimize / variables / review)
src/web.js           client panel (React + theme tokens)
test/                node:test unit tests
```

- Tests : `npm test`
- ESM, aucune étape de build, pas de JSX côté client ; toutes les couleurs viennent des tokens `--dsw-alias-*`.
- Routes côté hôte : `GET /prompt-optimize/models`, `POST /prompt-optimize/optimize` (NDJSON), `POST /prompt-optimize/variables`, `POST /prompt-optimize/review`.

## Licence

MIT. Les captures d'écran proviennent d'une instance réellement en cours d'exécution sur cette machine.
