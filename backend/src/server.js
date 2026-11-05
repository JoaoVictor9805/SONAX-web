import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

BigInt.prototype.toJSON = function () {
    const int = Number(this);
    return Number.isSafeInteger(int) ? int : this.toString();
};

import { processamentoRoutes } from "./routes/processamento.routes.js";
import { consolidacaoRoutes } from "./routes/consolidacao.routes.js";
import { initConsolidacaoCron } from "./cron/consolidacao.cron.js";

const fastify = Fastify({ logger: true });

// Permite requisições do frontend React / ferramentas
await fastify.register(cors, {
    origin: true,
});

// Rota de Healthcheck
fastify.get("/api/health", async () => {
    return { status: "online", timestamp: new Date() };
});

// Registra as rotas de Processamento sob o prefixo /api/processamento
await fastify.register(processamentoRoutes, { prefix: "/api/processamento" });

// Registra as rotas de Consolidação sob o prefixo /api/consolidacao
await fastify.register(consolidacaoRoutes, { prefix: "/api/consolidacao" });

// Inicialização do Servidor HTTP
const start = async () => {
    try {
        await fastify.listen({ port: 3333, host: "0.0.0.0" });
        console.log("Servidor SONAX rodando em http://localhost:3333");

        // Inicializa o agendador semanal
        initConsolidacaoCron();
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
