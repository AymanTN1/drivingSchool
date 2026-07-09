FROM eclipse-temurin:21-jdk-alpine as build
WORKDIR /workspace/app

# Copier le wrapper maven et les fichiers pom
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Télécharger les dépendances
RUN ./mvnw dependency:go-offline

# Copier le code source
COPY src src

# Compiler l'application en ignorant les tests
RUN ./mvnw clean package -DskipTests

# Étape d'exécution
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/app/target/*.jar app.jar

# Variables d'environnement par défaut
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
