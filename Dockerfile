FROM node:10.15.3-alpine
WORKDIR /var/run/app
COPY . .
RUN yarn
CMD ["yarn", "start"]