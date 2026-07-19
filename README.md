<div align="center">
  <h1>🚗 Driving School Management System (ERP & CRM)</h1>
  <p><em>Plateforme complète de gestion pour Auto-École : CRM, Planification, Finances, Ressources Humaines et Intelligence Artificielle.</em></p>
  
  [![Enterprise CI/CD](https://github.com/AymanTN1/drivingSchool/actions/workflows/main-ci.yml/badge.svg)](https://github.com/AymanTN1/drivingSchool/actions/workflows/main-ci.yml)
  [![CodeQL](https://github.com/AymanTN1/drivingSchool/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/AymanTN1/drivingSchool/actions/workflows/codeql-analysis.yml)
  [![Java](https://img.shields.io/badge/Java-21-orange.svg?style=flat-square&logo=openjdk)](#)
  [![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg?style=flat-square&logo=spring)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-Vite-blue.svg?style=flat-square&logo=react)](https://reactjs.org/)
  [![Python](https://img.shields.io/badge/Python-3.11-blue.svg?style=flat-square&logo=python)](#)
  [![FastAPI](https://img.shields.io/badge/FastAPI-ML%20Service-009688.svg?style=flat-square&logo=fastapi)](#)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=flat-square&logo=postgresql)](#)
  [![Redis](https://img.shields.io/badge/Redis-Cache-red.svg?style=flat-square&logo=redis)](#)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker)](#)
  [![Trivy](https://img.shields.io/badge/Trivy-Security%20Scan-1904DA.svg?style=flat-square&logo=aquasecurity)](#)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](#)
</div>

<br/>

## 🎯 Contexte du Projet

La gestion d'une auto-école moderne va bien au-delà de la simple réservation de leçons de conduite. Elle implique une logistique complexe : suivi des paiements fragmentés, maintenance de la flotte automobile, quotas d'examens (NARSA) et gestion de la paie des moniteurs.

J'ai développé ce projet full-stack pour répondre à ces problématiques concrètes en centralisant toutes les opérations sur une plateforme unique, rapide et hautement sécurisée — **enrichie par une couche d'Intelligence Artificielle** pour la maintenance prédictive et l'analyse comportementale des candidats.

---

## 🏗️ Pipeline CI/CD (DevSecOps)

Le projet utilise un pipeline d'intégration et déploiement continu de **niveau entreprise**, composé de **7 étapes** orchestrées avec dépendances :

```mermaid
graph LR
    A["📥 Checkout"] --> B["☕ Build & Test<br/>(JUnit 5 + JaCoCo)"]
    B --> C["🔍 Code Quality<br/>(Checkstyle + SpotBugs)"]
    B --> D["🛡️ Trivy FS Scan<br/>(Vulnerabilities)"]
    B --> E["🧠 AI Service<br/>(Pytest + Coverage)"]
    B --> F["⚛️ Frontend<br/>(Lint + Build)"]
    C --> G["🐳 Docker Build<br/>& Push (GHCR)"]
    D --> G
    E --> G
    F --> G
    G --> H["🔒 Trivy Image Scan<br/>+ Pipeline Summary"]

    style B fill:#2d6a4f,color:#fff
    style C fill:#e9c46a,color:#000
    style D fill:#e76f51,color:#fff
    style E fill:#264653,color:#fff
    style F fill:#2a9d8f,color:#fff
    style G fill:#023e8a,color:#fff
    style H fill:#9b2226,color:#fff
```

| Étape | Outil | Objectif |
|---|---|---|
| **Build & Test** | JUnit 5, JaCoCo (seuil ≥ 40%) | Tests unitaires + couverture de code |
| **Code Quality** | Checkstyle, SpotBugs | Analyse statique (équivalent SonarQube) |
| **Security Scan** | Trivy (Filesystem) | Détection de CVEs dans le code source |
| **AI Service** | Pytest, pytest-cov | Tests + couverture du microservice Python |
| **Frontend** | Node.js, npm build | Vérification de la compilation React |
| **Docker Push** | GHCR (GitHub Packages) | Publication des images Docker |
| **Image Scan** | Trivy (Docker Image) | Détection de CVEs dans les images |

**Outils de sécurité additionnels :**
- 🔐 **GitHub CodeQL** — Analyse SAST (SQL Injection, XSS, etc.) sur Java, JavaScript et Python.
- 🤖 **Dependabot** — Mise à jour automatique des dépendances vulnérables (Maven, NPM, Pip).

---

## 🗺️ Architecture Système & Réseau

L'application est conçue selon une architecture **Microservices DevSecOps**, divisant l'infrastructure en zones de sécurité (DMZ / LAN) avec un filtrage actif.

```mermaid
graph TD
    Client(["💻 Client / Navigateur"]) -->|HTTPS / Port 80| WAF
    
    subgraph DMZ ["Zone Démilitarisée - Réseau Public"]
        WAF["🛡️ Nginx + ModSecurity WAF"]
        Frontend["⚛️ React SPA / Vite"]
    end
    
    subgraph LAN ["Réseau Local Privé - Aucun Accès Internet"]
        Backend["🍃 Spring Boot 3 API REST"]
        AI["🧠 FastAPI ML Service"]
        Cache[("⚡ Redis Cache")]
        DB[("🐘 PostgreSQL 15")]
    end

    WAF -->|Sert les fichiers statiques| Frontend
    WAF -->|"Reverse Proxy - Filtre XSS & SQLi"| Backend
    Frontend -.->|"Appels API sécurisés par JWT"| Backend
    Backend <-->|"Prédictions ML (HTTP interne)"| AI
    Backend <-->|"Cache rapide (~5ms)"| Cache
    Backend <-->|"JPA / Hibernate (Transactions)"| DB
```

---

## 🧠 Intelligence Artificielle & Data Science

### 📊 Maintenance Prédictive de la Flotte
Un microservice **FastAPI (Python)** analyse l'historique d'utilisation des véhicules (kilométrage, fréquence de conduite) pour générer un **Score de Risque** (0% à 100%) pour chaque composant :
- 🔧 Vidange moteur · 🛞 Pneus · 🔴 Plaquettes de frein · 💨 Essuie-glaces · ⚙️ Révision moteur

### 🧠 Détection de Risque d'Abandon (Analyse Comportementale)
L'IA analyse le parcours de chaque candidat (score au code, taux d'absentéisme, évaluation du moniteur) et génère une **Alerte Rouge** lorsqu'un candidat risque d'échouer ou d'abandonner, permettant d'agir de manière proactive.

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

### AI & Data Science (Microservice)
- **Python 3.11** & **FastAPI** (API de prédiction)
- Algorithmes de scoring prédictif (Maintenance & Comportement)
- Architecture microservices isolée (communication HTTP interne)

### Frontend (UI/UX)
- **React.js** (Vite)
- Composants interactifs (Calendriers, Jauges de risque IA, Tableaux de bord dynamiques)

### Base de données & Infrastructure
- **PostgreSQL 15** (Données relationnelles structurées)
- **Redis 7** (Mise en cache pour soulager la base de données)
- **Docker & Docker Compose** (Déploiement multi-services)

### DevSecOps & CI/CD
- **GitHub Actions** (Pipeline 7 étapes)
- **Trivy** (Scan de vulnérabilités : filesystem + images Docker)
- **Checkstyle + SpotBugs** (Analyse statique de code)
- **JaCoCo** (Couverture de code avec seuil minimum)
- **CodeQL** (SAST — détection SQL Injection, XSS)
- **Dependabot** (Surveillance automatique des dépendances)
- **GHCR** (GitHub Container Registry — stockage des images Docker)

---

## 🧪 Qualité du Code & Tests

Le projet est couvert par une suite de **tests d'intégration et unitaires** (JUnit 5, MockMvc, Pytest, H2 in-memory DB) garantissant la fiabilité des processus critiques :
- Moteur de conflit de réservation (Heures chevauchées, véhicule indisponible).
- Calculs financiers et algorithmes de paie.
- Sécurité RBAC et protection des endpoints.
- Modèles d'IA (Prédiction de maintenance & scoring de risque candidat).

**Le pipeline CI/CD s'assure automatiquement que :**
- ✅ 100% des tests passent avant toute intégration.
- ✅ La couverture de code reste au-dessus du seuil minimum (40%).
- ✅ Aucune vulnérabilité critique n'est introduite dans le code ou les images Docker.

---

## 🚀 Guide de Démarrage (Local)

Prérequis : `Docker` et `docker-compose` installés sur votre machine.

**1. Cloner le dépôt**
```bash
git clone https://github.com/AymanTN1/drivingSchool.git
cd drivingSchool
```

**2. Lancer l'infrastructure complète**
L'environnement Docker s'occupe de tout : Base de données, Redis, Backend, AI Service et Frontend.
```bash
docker-compose up --build -d
```

**3. Accéder à l'application**
- **Application Web** : `http://localhost:8080`
- **Documentation API (Swagger)** : `http://localhost:8080/swagger-ui/index.html`
- **AI Service Health** : `http://localhost:8000/health`

*(Les services intègrent des `healthchecks` pour garantir que le Backend ne démarre que lorsque PostgreSQL et Redis sont prêts).*

---
<div align="center">
  <i>Développé avec passion pour digitaliser et optimiser l'apprentissage de la conduite automobile au Maroc.</i>
</div>
