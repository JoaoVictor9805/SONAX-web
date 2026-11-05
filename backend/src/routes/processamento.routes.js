import { getDadosParaFechamentoSdr } from "../controllers/processamento.controller.js";

export async function processamentoRoutes(app) {
    // GET /api/processamento/chamadas-consolidadas (Extração de dados analíticos brutos)
    app.get("/chamadas-consolidadas", getDadosParaFechamentoSdr);
}
