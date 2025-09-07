# Use official Node.js LTS image
FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

# Expose the app port
EXPOSE 4000

CMD ["node", "dist/server.js"]
