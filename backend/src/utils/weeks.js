/**
 * Extrai o número da semana do ano e o ano correspondente segundo a norma ISO-8601.
 * Ideal para agrupar e ordenar métricas em gráficos de evolução semanal.
 * 
 * @param {Date} data - Objeto Date contendo a data a ser processada.
 * @returns {{ label: string, chaveOrdenacao: string }} Objeto contendo:
 *   - `label`: Rótulo formatado para exibição (ex: "S01", "S42").
 *   - `chaveOrdenacao`: Identificador único ordenável cronologicamente no formato "YYYY-WW" (ex: "2026-42").
 */
export function extrairSemanaAno(data) {
    const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const anoInicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const numeroSemana = Math.ceil(((d - anoInicio) / 86400000 + 1) / 7);

    return {
        label: `S${String(numeroSemana).padStart(2, "0")}`,
        chaveOrdenacao: `${d.getUTCFullYear()}-${String(numeroSemana).padStart(2, "0")}`,
    };
}
