FROM node:26-alpine AS dev-stage

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir /app && chown appuser:appgroup /app

WORKDIR /app

COPY --chown=appuser:appgroup package*.json ./

USER appuser

RUN npm install

COPY --chown=appuser:appgroup . .



FROM dev-stage AS build-stage

RUN npm run build



FROM nginx:1.31-alpine AS prod-stage

COPY --from=build-stage /app/out /usr/share/nginx/html
EXPOSE 80