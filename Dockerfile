# Step 1: Use Node.js environment
FROM node:18

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy only backend files
COPY backend/package.json ./

# Step 4: Install dependencies (Koyeb will handle lockfile here)
RUN npm install

# Step 5: Copy the rest of the backend code
COPY backend/ .

# Step 6: Expose the port
EXPOSE 8080

# Step 7: Run the server
CMD ["node", "server.js"]
