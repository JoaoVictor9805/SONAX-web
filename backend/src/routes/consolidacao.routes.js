import {
    dispararConsolidacaoManual,
    obterPerfilConsolidado,
    listarFiltrosConsolidacao,
} from "../controllers/consolidacao.controller.js";

export async function consolidacaoRoutes(app) {
    // GET /api/consolidacao/filtros (Listagem de SDRs, Departamentos e Períodos para o Frontend)
    app.get("/filtros", listarFiltrosConsolidacao);
    app.get("/agentes", listarFiltrosConsolidacao);

    // GET /api/consolidacao/perfil (Leitura do perfil consolidado para o Frontend)
    app.get("/perfil", obterPerfilConsolidado);

    // POST /api/consolidacao/executar (Disparo manual individual)
    app.post("/executar", dispararConsolidacaoManual);
}
