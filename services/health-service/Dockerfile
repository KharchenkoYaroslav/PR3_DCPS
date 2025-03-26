FROM node:alpine

WORKDIR /app

COPY package.json tsconfig.json ./
COPY src ./src

RUN npm install

CMD ["npm", "run", "start"]