# Driving School ERP - Secure Architecture (DevSecOps)

Ce projet intègre une plateforme de gestion d'auto-école (ERP) avec une architecture Cloud-Native orientée **Sécurité**, modélisant un véritable réseau d'entreprise.

## 🏗️ Architecture Réseau Isolée (SDN via Docker)

L'infrastructure est déployée via `docker-compose` en séparant strictement les flux réseaux :

1. **DMZ (Zone Démilitarisée)** : `dmz_net`
   - **Frontend (Nginx / React)** : Seul composant exposé à internet (Port 80).
   - **WAF / IPS (ModSecurity)** : Intégré directement au reverse proxy Nginx via l'image OWASP Core Rule Set. Il inspecte tout le trafic entrant pour bloquer les injections SQL, XSS et autres anomalies, agissant comme un Pare-Feu Applicatif et un Système de Prévention d'Intrusion (IPS).
   - **Backend API (Spring Boot)** : Situé entre la DMZ et le LAN, il reçoit les requêtes filtrées depuis le reverse proxy.

2. **LAN (Réseau Interne Sécurisé)** : `lan_net`
   - **Base de données (PostgreSQL)** : Totalement isolée de l'extérieur. Seul le conteneur Backend y a accès. Le réseau est configuré en mode `internal: true` dans Docker, rendant le sniffing ou le dump distant de la base impossible.

## 🚀 Comment lancer l'infrastructure en local

1. **Configurer l'environnement**
   Copiez le fichier `.env.example` vers `.env` et ajustez les mots de passe si nécessaire :
   ```bash
   cp .env.example .env
   ```

2. **Démarrer les conteneurs**
   ```bash
   docker-compose up --build -d
   ```
   > **Note** : Le système utilise des *Healthchecks*. Le backend attendra intelligemment que PostgreSQL soit prêt avant de se lancer.

- Le site web (et la partie ERP) est accessible sur : `http://localhost:80`
- Toute tentative d'attaque basique (ex: `http://localhost/?id=1' OR '1'='1`) sera bloquée et journalisée par ModSecurity (IPS).

## ⚙️ Intégration Continue (CI/CD)

Le projet est équipé d'une pipeline GitHub Actions (`.github/workflows/ci.yml`).
À chaque *push* sur la branche principale, les serveurs GitHub vérifient automatiquement :
- La compilation Java / Spring Boot.
- Le build React / Vite.
- La validité de l'orchestration Docker Compose.
