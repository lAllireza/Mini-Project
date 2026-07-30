FROM node:26-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup  
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
CMD ["npm", "run", "dev"]