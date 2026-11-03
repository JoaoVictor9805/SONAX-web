import "dotenv/config";                         // Carrega automaticamente as variáveis do arquivo .env para o process.env
import pkg from "@prisma/client";               // Cliente do Prisma (ORM) para consultar e manipular o banco de dados
import { PrismaPg } from "@prisma/adapter-pg";  // Adaptador do driver do PostgreSQL (pg) utilizado pelo Prisma 7

const { PrismaClient } = pkg;

// Cria o adaptador usando a string de conexão do .env
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

// Instância única (Singleton) do Prisma Client
export const prisma = new PrismaClient({ adapter });