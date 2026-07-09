FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /workspace/app

# Copier le fichier pom
COPY pom.xml .

# Télécharger les dépendances
RUN mvn dependency:go-offline

# Copier le code source
COPY src src

# Compiler l'application en ignorant les tests
RUN mvn clean package -DskipTests

# Étape d'exécution
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/app/target/*.jar app.jar

# Variables d'environnement par défaut
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
