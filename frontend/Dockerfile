# Stage 1: Builder
FROM node:24-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Install all dependencies + optional binaries for lightningcss
RUN npm ci
RUN npm install lightningcss-linux-arm64-musl lightningcss-linux-x64-gnu lightningcss-linux-x64-musl --save-optional

COPY . /app

# Build Next.js (after lightningcss is installed)
RUN npm run build

# Stage 2: Production
FROM node:24-slim AS prod

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Also copy next.config if you have one
COPY --from=builder /app/next.config.* ./

RUN npm ci --omit=dev

EXPOSE 3000
CMD ["npm", "start"]

# Stage 3: Development
FROM builder AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]