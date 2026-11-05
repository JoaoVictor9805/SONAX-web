import {
    dispararConsolidacaoManual,
    obterPerfilConsolidado,
} from "../controllers/consolidacao.controller.js";

export async function consolidacaoRoutes(app) {
    // GET /api/consolidacao/perfil (Leitura do perfil consolidado para o Frontend)
    app.get("/perfil", obterPerfilConsolidado);

    // POST /api/consolidacao/executar (Disparo manual individual)
    app.post("/executar", dispararConsolidacaoManual);
}
