FROM node:alpine

WORKDIR /app

COPY package.json tsconfig.json ./
COPY src ./src
COPY data ./data

RUN npm install

CMD ["npm", "run", "start"]
