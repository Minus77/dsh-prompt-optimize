# Modèles

[中文](./TEMPLATES.md) · [English](./TEMPLATES.en.md) · [Español](./TEMPLATES.es.md) · **Français** · [Deutsch](./TEMPLATES.de.md) · [Русский](./TEMPLATES.ru.md) · [日本語](./TEMPLATES.ja.md)

Le plugin fournit sept modèles. Vous les changez depuis le coin supérieur droit du panneau de l'optimiseur ; en changer modifie **la façon dont le brouillon est réécrit**, jamais le brouillon lui-même.

Chaque modèle couvre une facette différente du même problème :

- **Basique** — transformer une phrase en tâche complète (Task brief, Role contract, Agent persona) ;
- **Structure** — remonter les critères d'acceptation en tête (Delivery contract) ;
- **Exemples** — fixer le style et le format par des exemples (Worked examples) ;
- **Raisonnement** — imposer une exécution par étapes avec points de contrôle (Reasoning steps) ;
- **Itération** — retouches minimales sur une version existante (Incremental edit).

---

## Task brief

**Mode** : prompt · **Groupe** : basique · **Par défaut**

L'option généraliste. Idéale pour les brouillons qui énoncent un objectif sans aucun détail : « écris-moi quelque chose », « jette un œil à ça ».

**Forme de sortie** : objectif / informations connues / livrable / contraintes / format de sortie. Les manques deviennent `待确认：…` (à confirmer) plutôt que des faits inventés.

**Quand l'utiliser**

- le brouillon tient en une phrase mais vous savez ce que vous voulez ;
- une demande orale doit devenir quelque chose qu'une autre personne pourrait exécuter ;
- vous voulez un prompt envoyable sans ajouter le contexte à la main.

**Quand l'éviter**

- l'exigence a déjà des critères d'acceptation stricts (utilisez Delivery contract) ;
- le style compte plus que la structure et seuls des exemples peuvent le transmettre (utilisez Worked examples).

**Exemple**

> Brouillon : écris une note de lancement pour notre nouvelle version, qui sort vendredi, à destination des utilisateurs existants

Devient à peu près :

```
Goal: a launch announcement for existing users about the release shipping this Friday.
Known: ships Friday; readers already use the product, so no from-scratch intro.
Deliverable: publishable Chinese note, under 300 characters.
Constraints: no overclaiming, no promises about unreleased features, no pricing.
Format: headline + three paragraphs + one call to action.
To confirm: what is the headline feature of this release?
```

---

## Delivery contract

**Mode** : prompt · **Groupe** : structure

Place « ce qui compte comme terminé » en premier. Idéal pour les travaux relus plusieurs fois : docs, rapports, modifications de code, nettoyage de données.

**Forme de sortie** : tâche / entrée / spécification de sortie / critères d'acceptation (3 à 6 points vérifiables) / limites et exceptions / interdictions.

**Quand l'utiliser**

- quelqu'un d'autre va vérifier le résultat ;
- les tentatives précédentes ont été refusées faute de standard écrit ;
- le modèle doit demander les éléments manquants au lieu de deviner.

**Quand l'éviter**

- la tâche est exploratoire et le standard n'est pas encore connu ;
- une demande d'une ligne suffirait — un contrat ne fait qu'alourdir.

**Exemple**

> Brouillon : transforme ce rapport hebdomadaire en une page pour mon responsable

La réécriture ajoute : quel rapport sert d'entrée, les champs et l'ordre de la page unique, des critères d'acceptation (conclusion d'abord, chaque affirmation appuyée par un chiffre, aucun acronyme non expliqué), et quoi faire si le texte déborde.

---

## Worked examples

**Mode** : prompt · **Groupe** : exemples

Pour les cas où deux exemples valent mieux qu'un paragraphe d'adjectifs. Les modèles imitent un format bien mieux qu'ils n'interprètent « rends-le professionnel ».

**Forme de sortie** : tâche et périmètre → 2 à 3 paires entrée → sortie attendue → règles pour les entrées hors exemples → une note indiquant que les exemples sont illustratifs.

**Quand l'utiliser**

- le format est strict : colonnes de tableau, ton de voix, style de code ;
- vous avez déjà deux ou trois exemples « écris-le comme ça » ;
- la couverture compte plus que la répétition d'un seul cas.

**Quand l'éviter**

- le brouillon n'offre aucune base pour des exemples — des exemples inventés induisent en erreur ;
- le travail est ouvert et créatif.

---

## Reasoning steps

**Mode** : prompt · **Groupe** : raisonnement

Découpe la tâche en étapes exécutables et indique où s'autovérifier et où se replier.

**Forme de sortie** : objectif reformulé → 3 à 7 étapes (entrée / action / signal de fin) → points de contrôle → gestion des échecs → format de livraison.

**Quand l'utiliser**

- analyse en plusieurs étapes, débogage ou comparaison d'options ;
- les résultats intermédiaires exigent une vérification humaine ;
- des exécutions passées ont suivi une mauvaise piste jusqu'au bout.

**Quand l'éviter**

- la tâche tient en une seule étape ;
- le travail demande une créativité libre.

---

## Role contract

**Mode** : system prompt · **Groupe** : basique

Transforme une ligne de description de rôle en un system prompt qu'un agent peut suivre longtemps. Le panneau n'expose pas encore le mode system ; utilisez `POST /prompt-optimize/optimize` avec `optimizationMode: "system"`.

**Forme de sortie** : identité / responsabilités / flux de travail / limites / accord de sortie.

**Quand l'utiliser**

- le même rôle est réutilisé d'une session à l'autre ;
- le rôle exige des critères de jugement, pas seulement un intitulé.

**Quand l'éviter**

- vous avez besoin d'un prompt de tâche ponctuel.

---

## Agent persona

**Mode** : system prompt · **Groupe** : basique

Écrit un fichier qui se lit comme une personne : sa façon de parler, de décider, ce qu'elle propose spontanément, ce qu'elle ne fait jamais, plus une réponse d'exemple.

**Quand l'utiliser**

- l'assistant a besoin d'une voix et d'un caractère stables ;
- vous voulez une persona, pas une fiche de poste.

**Quand l'éviter**

- la formulation doit rester strictement conforme ; le texte de persona gêne.

---

## Incremental edit

**Mode** : iterate · **Groupe** : itération

Applique une note de modification au résultat précédent avec un mouvement minimal : seules les parties mentionnées changent, tout le reste est conservé mot pour mot.

**Forme de sortie** : le prompt complet (pas un diff). En cas de conflit entre la note et le texte, la note l'emporte.

**Quand l'utiliser**

- le résultat est globalement bon et vous voulez ajuster le ton, la longueur ou un passage ;
- une note vague comme « rends-le plus formel » doit aboutir à quelque chose de concret.

**Quand l'éviter**

- la direction est mauvaise — une nouvelle exécution est plus rapide qu'une chirurgie phrase par phrase.

**Exemple**

> Note : ton plus léger, et condense la longue liste « à confirmer » en trois lignes

Seules les formulations liées au ton et cette liste changent ; les titres, la ponctuation et le reste restent identiques.

---

## Choisir

| Votre situation | Modèle |
| --- | --- |
| Une phrase à transformer en tâche complète | Task brief |
| Quelqu'un d'autre va valider le résultat | Delivery contract |
| Vous avez des exemples et craignez une dérive de format | Worked examples |
| Un travail en plusieurs étapes qui tend à partir dans tous les sens | Reasoning steps |
| Globalement satisfait, une petite retouche | Incremental edit |

Plus de modèles ne veut pas dire mieux : le même brouillon traité par des modèles différents produit des structures visiblement différentes. Choisissez un modèle par défaut, ne changez que lorsque le travail change.

Retour au [README principal](./../README_fr.md).
