import {
    getDadosParaFechamentoSdr,
    dispararConsolidacaoManual,
} from "../controllers/processamento.controller.js";

export async function processamentoRoutes(app) {
    // GET /api/processamento/chamadas-consolidadas (Extração de dados analíticos brutos)
    app.get("/chamadas-consolidadas", getDadosParaFechamentoSdr);

    // POST /api/processamento/consolidar (Disparo da consolidação, aceitando dados_processamento opcionais)
    app.post("/consolidar", dispararConsolidacaoManual);
}
