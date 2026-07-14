FROM node:20-bullseye-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (cached when package.json doesn't change)
COPY package.json package-lock.json* ./
RUN npm install --silent

# Copy source
COPY . .

# Expose dev port
EXPOSE 3000

# Default to dev server (uses tsx)
CMD ["npm", "run", "dev"]
