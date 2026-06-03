FROM node:22-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
ARG BUILD_ID=BUILD_1780462950
RUN echo "Build: BUILD_1780462950"
EXPOSE 8080
CMD ["node", "railway_start.js"]
