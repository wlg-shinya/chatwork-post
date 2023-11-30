FROM node:20.9.0 as builder
WORKDIR /usr/src/app
COPY . /usr/src/app
ENV NODE_ENV=development
RUN npm install
RUN npm run build
RUN npm run serve:build

FROM node:20.9.0-alpine as prod
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app /usr/src/app
ENV NODE_ENV=production
RUN npm install
RUN npm install -g serve
