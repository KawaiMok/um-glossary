# 註解：Multi-stage build，先用 Maven 打包，再用精簡 JRE 跑

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# 註解：先複製 pom.xml 以利用快取
COPY pom.xml ./
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package


FROM eclipse-temurin:21-jre
WORKDIR /app

# 註解：Render 會提供 PORT；Spring Boot 會從 application.yml 的 ${PORT:8080} 讀取
ENV PORT=8080
EXPOSE 8080

# 註解：複製打包後的 jar（Spring Boot Maven plugin 預設會產出一個可執行 jar）
COPY --from=build /app/target/*.jar /app/app.jar

CMD ["sh", "-c", "java -jar /app/app.jar"]

