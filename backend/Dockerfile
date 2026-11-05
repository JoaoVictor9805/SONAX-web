FROM node:20-slim

WORKDIR /app

# Instala OpenSSL necessário para o Prisma Client no Linux
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copia arquivos de dependências e configuração do Prisma
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Instala dependências do projeto e gera os artefatos do Prisma
RUN npm install
RUN npx prisma generate

# Copia o restante dos arquivos do backend
COPY . .

EXPOSE 3333

CMD ["npm", "start"]

