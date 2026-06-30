# Etape 1: Build de l'application React
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etape 2: Déploiement sur Nginx avec ModSecurity (WAF/IPS)
FROM owasp/modsecurity-crs:nginx-alpine

# Activer ModSecurity et le moteur de règles
ENV SEC_RULE_ENGINE=On

# Copier le build React vers le dossier Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration personnalisée de Nginx (Reverse Proxy)
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
