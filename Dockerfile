# Step 1: Node.js Environment
FROM node:18-slim

# Step 2: Working Directory west l-container
WORKDIR /app

# Step 3: Copy package files first
# Docker ghadi i-qelleb f-west dossier backend
COPY backend/package.json ./

# Step 4: Install dependencies
RUN npm install --no-package-lock

# Step 5: Copy l-code dyal l-backend kamel
COPY backend/ .

# Step 6: Port 8080
ENV PORT=8080
EXPOSE 8080

# Step 7: Run
CMD ["node", "server.js"]
