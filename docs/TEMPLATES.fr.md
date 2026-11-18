# Modèles

[中文](./TEMPLATES.md) · [English](./TEMPLATES.en.md) · [Español](./TEMPLATES.es.md) · **Français** · [Deutsch](./TEMPLATES.de.md) · [Русский](./TEMPLATES.ru.md) · [日本語](./TEMPLATES.ja.md)

Le plugin fournit quinze modèles. Vous les changez depuis le coin supérieur droit du panneau de l'optimiseur ; en changer modifie **la façon dont le brouillon est réécrit**, jamais le brouillon lui-même.

Chaque modèle couvre une facette différente du même problème :

- **Basique** — transformer une phrase en tâche complète (Task brief, Role contract, Agent persona) ;
- **Structure** — remonter les critères d'acceptation ou le schéma visé (Delivery contract, Structured extraction) ;
- **Exemples** — fixer le style et le format par des exemples (Worked examples) ;
- **Raisonnement** — étapes et contrôles intermédiaires, ou répondre uniquement à partir du matériau fourni (Reasoning steps, Grounded Q&A) ;
- **Ingénierie** — relecture de code, implémentation, SQL et conception de tests ;
- **Rédaction** — traduction et polissage, où l'enjeu est jusqu'où la retouche peut aller ;
- **Itération** — retouches minimales sur une version existante (Incremental edit).

Le dernier élément du menu crée un **modèle personnalisé** : votre propre consigne de réécriture, stockée dans ce navigateur, importable et exportable en JSON.

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

## Code review

**Mode** : prompt · **Groupe** : ingénierie

Transforme « jette un œil à ce code » en relecture cadrée et priorisée : à quoi sert le changement, quoi regarder d'abord, et dans quel format répondre.

**Sortie** : périmètre / priorités / format (gravité, emplacement, problème, impact, correctif) / hors périmètre / preuves.

**Pour** : auto-relecture avant un commit ; changement sur plusieurs fichiers pouvant casser des appels.
**Pas pour** : expliquer ce que fait un code, ou implémenter le correctif.

**Exemple**

> Brouillon : regarde ce code, il y a un problème ?

Devient : périmètre = les trois fichiers du PR qui ajoute l'idempotence au checkout ; priorités = correction > concurrence > performance > lisibilité ; chaque constat cite fichier:ligne ; pas de réécriture complète ni de remarques sur les noms.

---

## Implementation task

**Mode** : prompt · **Groupe** : ingénierie

Complète une demande de code en brief d'ingénierie : objectif et acceptation, contraintes techniques, contrats d'interface, cas limites et forme de livraison. Produit une **description de tâche**, pas le code.

**Sortie** : objectif et acceptation / contraintes / interfaces / bords et échecs / livraison / questions ouvertes.

**Pour** : confier un changement moyen à un agent ou un collègue ; modules partagés dont l'interface doit être convenue avant.
**Pas pour** : prototypes exploratoires dont la conception naît en écrivant.

**Exemple**

> Brouillon : rends l'export asynchrone pour qu'il ne bloque plus

Devient : endpoint de déclenchement, champ de statut, polling ou callback, plafond de concurrence, reprise et délai maximal, permissions, affichage de la progression et appels existants à modifier.

---

## SQL query

**Mode** : prompt · **Groupe** : ingénierie

Écrit une demande de données comme tâche SQL avec définitions, champs et limites de performance explicites, et demande de lister les hypothèses à part.

**Sortie** : tables et champs / définitions (temps, doublons, nuls, unités) / forme du résultat / performance / permissions / hypothèses.

**Pour** : rapports et analyses ponctuelles ; métriques ambiguës (actif, rétention, GMV).
**Pas pour** : expliquer une requête existante ou migrer un schéma.

**Exemple**

> Brouillon : nouveaux utilisateurs par canal la semaine dernière

Devient : définition d'un nouvel utilisateur, champ canal et clé de dédoublonnage, fuseau et bornes exactes de la semaine, comptes de test ou non, ordre, plage de scan et index autorisés.

---

## Test design

**Mode** : prompt · **Groupe** : ingénierie

Écrit une demande de tests comme tableau de cas couvrant chemin nominal, limites, échecs et permissions, avec priorités et ce qu'il faut automatiser d'abord.

**Sortie** : objet et risques / tableau (id, préconditions, étapes, attendu) / couverture / priorité / automatisation.

**Pour** : compléter les cas avant une mise en ligne ; vérifier qu'un correctif ne casse rien.
**Pas pour** : demander des scripts, sauf si le brouillon le précise.

**Exemple**

> Brouillon : écris des cas de test pour le login

Devient : mot de passe, SMS et tiers séparément ; blocage après N échecs ; vide, très long, caractères spéciaux ; e-mail non vérifié ; différences par rôle ; chaque cas numéroté et priorisé.

---

## Structured extraction

**Mode** : prompt · **Groupe** : structure

Transforme « sors quelques champs de ça » en extraction guidée par schéma, avec JSON strict et règles explicites pour l'absent.

**Sortie** : forme d'entrée / schéma (nom, type, obligatoire, énum) / règles d'absence et de conflit / JSON seul / un exemple.

**Pour** : contrats, e-mails, tickets ou pages convertis en données ; lots devant entrer en base.
**Pas pour** : résumer ou réécrire ; images nécessitant de l'OCR.

**Exemple**

> Brouillon : extrais société, contact et montant de ces e-mails

Devient : société du corps ou de la signature, contact avec ou sans fonction, devise et fiscalité du montant, quel montant retenir s'il y en a plusieurs, null sinon, JSON seul.

---

## Translation

**Mode** : prompt · **Groupe** : rédaction

Écrit une demande de traduction comme tâche de localisation avec public, glossaire et format. L'enjeu est ce qui ne bouge pas : marques, champs, espaces réservés, structure Markdown.

**Sortie** : langue et région / public et ton / glossaire / format / sans ajout ni omission.

**Pour** : textes produit, aide et e-mail ; un marché précis où réécrire vaut mieux que traduire littéralement ; textes avec `{{variables}}` ou blocs de code.
**Pas pour** : textes juridiques exigeant encore une relecture humaine.

**Exemple**

> Brouillon : traduis ça en japonais pour un client

Devient : japonais des affaires pour un client japonais ; conserver noms de produit et `{{user_name}}` ; conserver titres et listes Markdown ; ne rien ajouter ni retrancher ; uniquement la traduction.

---

## Copy polish

**Mode** : prompt · **Groupe** : rédaction

Écrit une demande de polissage comme révision bornée : jusqu'où modifier, ce qui doit rester, et pas d'ajout. Empêche le modèle d'ajouter des arguments, des exemples ou de la longueur.

**Sortie** : registre et lecteur / profondeur permise / à conserver / interdits / texte complet et trois notes max.

**Pour** : brouillons exacts mais mal écrits ; garder une seule voix ; limiter la modification aux mots.
**Pas pour** : contenu auquel il manque l'argumentation.

**Exemple**

> Brouillon : rends ça plus formel

Devient : à quel point (avis public ou e-mail interne), si l'ordre des paragraphes peut changer, quels chiffres et conclusions restent littéraux, si les phrases peuvent fusionner, et une courte liste des changements à la fin.

---

## Grounded Q&A

**Mode** : prompt · **Groupe** : raisonnement

Écrit « réponds à partir de ces documents » comme tâche sourcée avec citations et déclaration explicite du non-couvert ; en cas de conflit, demande de citer les sources avant de juger.

**Sortie** : périmètre du matériau / règles de citation / déclaration de non-couvert / conflits / structure (réponse, preuves, manques).

**Pour** : répondre depuis documentation, politiques ou contrats ; réponses traçables.
**Pas pour** : questions sans matériau de référence.

**Exemple**

> Brouillon : d'après le manuel, comment sont calculés les congés ?

Devient : le manuel seul, avec numéros de clause ; dire « non couvert » pour ce qui manque (prorata au départ) ; si le manuel et une note ultérieure divergent, citer les deux puis juger.

---

## Modèles personnalisés

Le dernier élément du menu est « Nouveau modèle personnalisé », avec trois champs :

| Champ | Rôle |
| --- | --- |
| Nom | Affiché dans le menu ; 40 caractères max |
| Consigne de réécriture | Comment le modèle doit réécrire ; 2000 caractères max |
| Public visé | Une ligne sur les brouillons concernés ; facultatif |

Ils vivent dans le `localStorage` de ce navigateur et disparaissent avec les données du site. Utilisez l'export et l'import JSON de l'éditeur pour les transférer ou les partager.

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
