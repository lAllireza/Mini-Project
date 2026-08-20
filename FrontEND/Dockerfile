FROM node:26-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir /app && chown appuser:appgroup /app
WORKDIR /app
COPY --chown=appuser:appgroup package*.json ./
USER appuser
RUN npm install
COPY --chown=appuser:appgroup . .
RUN npm run build
EXPOSE 3000
<<<<<<< HEAD
CMD ["npm", "run", "dev"]
=======
CMD ["npm", "run", "dev"]
#CMD ["npm", "run", "build"]
>>>>>>> new
