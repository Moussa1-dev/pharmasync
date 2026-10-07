# ============================================================
#  Image Docker du serveur PharmaSync (Spring Boot, Java 21)
#  Utilisée par Render (ou tout hébergeur compatible Docker).
# ============================================================

# 1) Compilation avec Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# 2) Image finale, légère, qui lance le serveur
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Mémoire limitée pour l'offre gratuite de Render (512 Mo)
ENV JAVA_TOOL_OPTIONS="-Xmx350m -XX:+UseSerialGC"
EXPOSE 8081
CMD ["java", "-jar", "app.jar"]
