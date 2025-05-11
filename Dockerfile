FROM node:24-alpine AS builder
ENV NODE_ENV=development
WORKDIR /app

COPY ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "./"]

RUN apk add --no-cache alpine-sdk python3 && \
    npm install -g pnpm && \
    pnpm install

COPY . .

RUN pnpm tsc && \
    pnpm prune --prod

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app .

CMD ["node", "dist/index.mjs"]