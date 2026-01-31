FROM node:18-slim
WORKDIR /app
# Hazz d-data mn dossier backend
COPY backend/package.json ./
RUN npm install --no-package-lock
COPY backend/ .
# Darori PORT 8080
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
