<div align="center">
  <h1>🚗 Driving School Management System (ERP & CRM)</h1>
  <p><em>Plateforme complète de gestion pour Auto-École : CRM, Planification, Finances et Ressources Humaines.</em></p>
  
  [![Java](https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=java)](#)
  [![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg?style=flat-square&logo=spring)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-Vite-blue.svg?style=flat-square&logo=react)](https://reactjs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=flat-square&logo=postgresql)](#)
  [![Redis](https://img.shields.io/badge/Redis-Cache-red.svg?style=flat-square&logo=redis)](#)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker)](#)
  [![Build](https://img.shields.io/badge/Build-Passing-success.svg?style=flat-square&logo=githubactions)](#)
  [![Tests](https://img.shields.io/badge/Tests-49%2F49%20Passing-success.svg?style=flat-square)](#)
</div>

<br/>

## 🎯 Contexte du Projet

La gestion d'une auto-école moderne va bien au-delà de la simple réservation de leçons de conduite. Elle implique une logistique complexe : suivi des paiements fragmentés, maintenance de la flotte automobile, quotas d'examens (NARSA) et gestion de la paie des moniteurs.

J'ai développé ce projet full-stack pour répondre à ces problématiques concrètes en centralisant toutes les opérations sur une plateforme unique, rapide et hautement sécurisée.

---

## 🗺️ Architecture Système & Réseau

L'application est conçue selon une architecture **DevSecOps** stricte, divisant l'infrastructure en zones de sécurité (DMZ / LAN) avec un filtrage actif.

```mermaid
graph TD
    Client([💻 Client / Navigateur]) -->|HTTPS / Port 80| WAF
    
    subgraph DMZ [Zone Démilitarisée - Réseau Public]
        WAF[🛡️ Nginx + ModSecurity WAF]
        Frontend[⚛️ React SPA / Vite]
    end
    
    subgraph LAN [Réseau Local Privé - Aucun Accès Internet]
        Backend[🍃 Spring Boot 3 API REST]
        Cache[(⚡ Redis Cache)]
        DB[(🐘 PostgreSQL 15)]
    end

    WAF -->|Sert les fichiers statiques| Frontend
    WAF -->|Reverse Proxy - Filtre XSS & SQLi| Backend
    Frontend -.->|Appels API sécurisés par JWT| Backend
    Backend <-->|Cache rapide (~5ms)| Cache
    Backend <-->|JPA / Hibernate (Transactions)| DB
```

---

## 💡 Fonctionnalités Principales

* 💰 **Gestion Financière (Caisse)** : Suivi des versements des candidats, calcul automatique des reliquats et blocage intelligent des réservations d'examen en cas de solde débiteur.
* 🚗 **Logistique & Flotte** : Suivi des entretiens périodiques (Visites techniques, Vidanges), gestion de la consommation de carburant et calcul de rentabilité par véhicule. Détection des pics anormaux de consommation (Alerte > 50%).
* 👥 **Ressources Humaines** : Génération automatique des fiches de paie pour les moniteurs en fonction des heures de conduite réellement effectuées, avec primes et déductions dynamiques.
* 📅 **Planning Interactif & Moteur de Règles** : Planification des leçons avec gestion anti-conflits (véhicules ou moniteurs double-bookés) et respect des plafonds horaires hebdomadaires.
* 📈 **CRM & Pipeline de Vente** : Tunnel de conversion complet (Landing Page ➔ Appel ➔ Attente Dossier ➔ Inscrit) pour optimiser l'acquisition de nouveaux élèves.
* 📊 **Dashboard Analytique** : KPIs en temps réel, évolution mensuelle du chiffre d'affaires, et alertes préventives.

---

## 🛠️ Stack Technique

### Backend (Core API)
- **Java 21** & **Spring Boot 3.2.5** (RESTful API)
- **Spring Security** avec authentification **JWT** (RBAC : Admin, Assistant, Moniteur, Candidat)
- **Spring Data JPA / Hibernate**
- **Jakarta Validation** (Validation stricte des DTOs)
- **Swagger / OpenAPI 3** (Documentation interactive)

### Frontend (UI/UX)
- **React.js** (Vite)
- **Tailwind CSS** (Design moderne et responsive)
- Composants interactifs (Calendriers, Tableaux de bord dynamiques)

### Base de données & Infrastructure
- **PostgreSQL 15** (Données relationnelles structurées)
- **Redis 7** (Mise en cache pour soulager la base de données)
- **Docker & Docker Compose** (Déploiement en 1-clic)
- **GitHub Actions** (CI/CD Pipeline)

---

## 🧪 Qualité du Code & Tests

Le projet est couvert par une suite de **49 tests d'intégration et unitaires** (JUnit 5, MockMvc, H2 in-memory DB) garantissant la fiabilité des processus critiques :
- Moteur de conflit de réservation (Heures chevauchées, véhicule indisponible).
- Calculs financiers et algorithmes de paie.
- Sécurité RBAC et protection des endpoints.

*(Une pipeline GitHub Actions s'assure que 100% des tests passent avant toute intégration).*

---

## 🚀 Guide de Démarrage (Local)

Prérequis : `Docker` et `docker-compose` installés sur votre machine.

**1. Cloner le dépôt**
```bash
git clone https://github.com/AymanTN1/drivingSchool.git
cd drivingSchool
```

**2. Lancer l'infrastructure complète**
L'environnement Docker s'occupe de tout : Base de données, Redis, Backend (compilation Maven incluse) et Frontend.
```bash
docker-compose up --build -d
```

**3. Accéder à l'application**
- **Application Web** : `http://localhost:8080` (Ou port défini pour le Frontend)
- **Documentation API (Swagger)** : `http://localhost:8080/swagger-ui/index.html`

*(Les services intègrent des `healthchecks` pour garantir que le Backend ne démarre que lorsque PostgreSQL et Redis sont prêts).*

---
<div align="center">
  <i>Développé avec passion pour digitaliser et optimiser l'apprentissage de la conduite automobile au Maroc.</i>
</div>
