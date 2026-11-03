import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

import { performanceRoutes } from "./routes/performance.routes.js";

const fastify = Fastify({ logger: true });

// Permite requisições do frontend React
await fastify.register(cors, {
    origin: true,
});

// Rota de Healthcheck
fastify.get("/api/health", async () => {
    return { status: "online", timestamp: new Date() };
});

// Registra as rotas da Visão Executiva sob o prefixo /api/performance
await fastify.register(performanceRoutes, { prefix: "/api/performance" });

// Inicialização do Servidor HTTP
const start = async () => {
    try {
        await fastify.listen({ port: 3333, host: "0.0.0.0" });
        console.log("Servidor SONAX rodando em http://localhost:3333");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();