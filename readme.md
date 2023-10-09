# BDE LABETE - Bot Discord Emploi du temps

## Description

Ce bot Discord permet d'afficher l'emploi du temps d'un groupe de la filiaire MMI ou RT de l'IUT de Rouen antenne d'Elbeuf. Il offre la possibilité d'utiliser une commande pour afficher l'emploi du temps de la semaine en cours ou d'une semaine spécifique, permettant ainsi au membre du serveur discord officiel de voir leurs emplois du temps des semaines à venir.

## Technologies utilisées

Ce bot utilise les technologies suivantes :

- NodeJS
- DiscordJS
- ADE Campus
- ICS Parser
- Canva Html

## Notes de mise à jour

### 1.0.0

- Sortie initiale
- Ajout des fonctionnalités de base
  - Ajout de la commande "/timetable [promo] [groupe]" pour afficher l'emploi du temps
  - Mise en place des emplois du temps pour les membres de la filiaire "MMI"
- Ajout d'un système de sauvegarde des fichiers ical pour éviter de les télécharger à chaque fois

### 1.1.0

- Des modifications ont été apportées au code pour le rendre plus lisible et plus facile à maintenir

### 1.2.0

- Modification de la commande
  - Changement de la commande "/timetable [promo] [groupe]" à "/timetable [filiaire] [année] [groupe] [semaine*]"
  - Changement de l'ordre des paramètres
  - Ajout du paramètre optionel "semaine" pour afficher l'emploi du temps d'une semaine spécifique
  - Mise en place des emplois du temps pour les membres de la filiaire "RT"
- Ajout de la commande "/ping" pour tester la connexion au bot

### 1.3.0

- Mise en avant des examents avec une couleur différente : jaune
- Ajout de commande
  - Ajout de "/ds [filiaire] [groupe]" pour afficher les dates des DS
- Modification de commande
  - Dans "/timetable" Ajout du numéro de la semaine lors de la génération de l'image de l'emploi du temps
