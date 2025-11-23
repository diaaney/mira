FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create data directory for SQLite database
RUN mkdir -p /app/data

CMD ["node", "index.js"]
