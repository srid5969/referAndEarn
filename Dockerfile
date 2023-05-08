FROM node:latest

WORKDIR /ReferAndEarn

COPY package.json ./

RUN npm install

WORKDIR ../ReferAndEarn

RUN npm build

COPY . /build

EXPOSE 8080

CMD ["npm", "start"]