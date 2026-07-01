# Driving School Management System (ERP & CRM)

Un système de planification des ressources d'entreprise (ERP) et de gestion de la relation client (CRM) conçu sur mesure pour la digitalisation complète d'une auto-école.

## 🎯 Contexte du Projet

La gestion d'une auto-école moderne va bien au-delà de la simple réservation de leçons de conduite. Elle implique une logistique complexe : suivi des paiements fragmentés, maintenance de la flotte automobile, quotas d'examens (NARSA) et gestion de la paie des moniteurs.

J'ai développé ce projet full-stack pour répondre à ces problématiques concrètes en centralisant toutes les opérations sur une plateforme unique, rapide et hautement sécurisée.

## 💡 Fonctionnalités Principales

*   **Gestion Financière (Caisse)** : Suivi des versements des candidats, calcul automatique des reliquats et blocage intelligent des réservations d'examen en cas de solde débiteur.
*   **Logistique & Flotte** : Suivi des entretiens périodiques, gestion de la consommation de carburant et calcul de rentabilité par véhicule.
*   **Ressources Humaines** : Génération automatique des fiches de paie pour les moniteurs en fonction des heures de conduite réellement effectuées.
*   **Planning Interactif** : Interface calendrier (drag-and-drop) pour la planification des leçons de conduite.
*   **CRM Candidats/Prospects** : Tunnel de conversion complet, de la prise de contact initiale (Landing Page) jusqu'à l'obtention du permis.

## 🛠️ Stack Technique & Architecture DevSecOps

Ce projet a été conçu en respectant les standards de l'industrie, avec une attention particulière portée aux performances et à la cybersécurité.

**Frontend**
*   React (Vite)
*   Architecture orientée composants
*   Consommation d'API RESTful (Fetch/Promises)

**Backend**
*   Java 21 / Spring Boot 3
*   Spring Security & authentification par token (JWT)
*   Spring Data JPA / Hibernate

**Bases de Données & Optimisations**
*   PostgreSQL 15 (Données relationnelles complexes)
*   **Redis** : Mise en cache (In-Memory) des requêtes analytiques lourdes (temps de réponse réduit à ~5ms).
*   Indexation SQL ciblée pour garantir de bonnes performances de lecture sur les grosses volumétries.

**Infrastructure, Sécurité & CI/CD**
L'application est conteneurisée et segmentée (DMZ/LAN) pour simuler un réseau d'entreprise strict.
*   **Docker & Docker Compose** : Isolation du Backend/DB (réseau `lan_net` sans accès internet) et exposition du Frontend (réseau `dmz_net`).
*   **Nginx & ModSecurity (WAF/IPS)** : Le trafic entrant est inspecté en temps réel par les règles OWASP Core Rule Set pour bloquer les injections SQL et failles XSS. (Compression Gzip activée pour les performances).
*   **Terraform** : Blueprint d'Infrastructure-as-Code (IaC) disponible dans `terraform/` pour provisionner automatiquement l'environnement (EC2, Security Groups) sur AWS.
*   **GitHub Actions** : Pipeline d'intégration continue validant la compilation Java et le build React à chaque push.

## 🚀 Démarrer le projet en local

Prérequis : `Docker` et `docker-compose` installés sur votre machine.

1.  Cloner le dépôt
2.  Copier le fichier de variables d'environnement :
    ```bash
    cp .env.example .env
    ```
3.  Lancer l'infrastructure réseau complète :
    ```bash
    docker-compose up --build -d
    ```

L'application (qui intègre des *healthchecks* pour attendre l'initialisation de la DB) sera accessible sur `http://localhost:80`.
