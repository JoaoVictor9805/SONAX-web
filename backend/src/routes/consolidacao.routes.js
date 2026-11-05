import { dispararConsolidacaoManual } from "../controllers/consolidacao.controller.js";

export async function consolidacaoRoutes(app) {
    // POST /api/consolidacao/executar
    app.post("/executar", dispararConsolidacaoManual);
}

