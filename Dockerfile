FROM node:16
COPY main.js main.js
COPY .env .env
COPY package.json package.json
RUN npm install
ENTRYPOINT [ "node", "main.js" ]
