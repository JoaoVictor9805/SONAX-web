`docker restart sonax-backend`

[localhost:3333/api/processamento/chamadas-consolidadas?data_inicio=2026-11-01&amp;data_fim=2026-11-07&amp;agente_login=sdr_lucas](http://localhost:3333/api/processamento/chamadas-consolidadas?data_inicio=2026-11-01&data_fim=2026-11-07&agente_login=sdr_lucas)



Você deve implementar a integração de dados entre o Front-end e o Back-end da SONAX para exibir o Dashboard do SDR/Consolidação.

### 1. Endpoint e Comunicação HTTP

- **URL:** `GET http://localhost:3333/api/consolidacao/perfil`
- **Query Params obrigatórios:**
  - `ano` (número, ex: `2026`)
  - `mes` (número de 1 a 12, ex: `11`)
- **Query Params de filtro/escopo:**
  - `tipo_escopo`: `'AGENTE'` (padrão), `'DEPARTAMENTO'` ou `'EQUIPE'`
  - `granularidade`: `'SEMANAL'` (padrão) ou `'MENSAL'`
  - `semana_do_mes`: número de 1 a 5 (obrigatório se granularidade for `'SEMANAL'`, omitir ou null se for `'MENSAL'`)
  - `id_agente`: ID numérico do SDR (ex: `11`, obrigatório para visão de AGENTE)
  - `id_departamento`: ID do departamento (se escopo for DEPARTAMENTO)

### 2. Estrutura Exata do Objeto JSON Retornado (Status 200)

A resposta é padronizada e contém estritamente estas propriedades:

```json
{
  "id_perfil": 1,
  "tipo_escopo": "AGENTE",
  "granularidade": "SEMANAL",
  "ano": 2026,
  "mes": 11,
  "semana_do_mes": 1,
  "data_inicio": "2026-11-02T00:00:00.000Z",
  "data_fim": "2026-11-06T00:00:00.000Z",
  "id_agente": 11,
  "id_departamento": 5,
  "parecer_executivo": "Texto analítico em Markdown gerado pelo treinador...",

  "metricas_camada_1": {
    "fluxo_bruto": {
      "realizadas": 48,
      "atendidas": 32,
      "relevantes": 18,
      "decisor": 12,
      "reunioes": 4
    },
    "funil_passagem": {
      "atendimento": 67,
      "relevancia": 56,
      "decisor": 67,
      "conversao_final": 33,
      "gargalo_etapa": "relevancia"
    },
    "ranking_adaptativo": [
      { "periodo": "Semana 1", "reunioes": 4, "nota_media": 70 },
      { "periodo": "Semana Anterior", "reunioes": 2, "nota_media": 64 }
    ]
  },

  "metricas_camada_2": {
    "nota_media_geral": 70,
    "delta_periodo_anterior": 6,
    "criterios_radar": [
      { "criterio": "Abertura", "nota": 72 },
      { "criterio": "SPIN", "nota": 60 },
      { "criterio": "Perfil ICP", "nota": 70 },
      { "criterio": "BANT", "nota": 65 },
      { "criterio": "Escuta Ativa", "nota": 77 },
      { "criterio": "Próximo Passo", "nota": 72 }
    ],
    "metodologias": {
      "spin_aderencia": 60,
      "bant_aderencia": 65
    }
  },

  "diagnostico_camada_3": {
    "sintese_executiva": {
      "destaque": "Conexão empática rápida e assertividade ao sugerir horários...",
      "gargalo_principal": "Cede com muita facilidade a objeções aceitando enviar e-mail...",
      "foco_da_semana": "Treinar técnicas de isolamento de objeções antes de concordar..."
    },
    "oportunidades_unificadas": [
      {
        "codigo": "OP_OBJ_ENVIO_EMAIL",
        "prioridade": "ALTA",
        "percentual_aparicao": 55,
        "diagnostico_consolidado": "Em mais da metade dos descartes, o SDR aceita a desculpa..."
      }
    ],
    "perfil_objecoes": [
      {
        "objecao_padrao": "Me mande por e-mail",
        "frequencia_percentual": 50,
        "reacao_predominante_sdr": "Aceita passivamente e anota o endereço",
        "efetividade": "BAIXA",
        "recomendacao_curta": "Perguntar qual o maior desafio da área antes de enviar"
      }
    ]
  },

  "evidencias_camada_4": {
    "top_3_melhores": [
      {
        "protocolo": 20261102001,
        "log": "LOG_20261102_001",
        "nota": 92,
        "audio_url": "/audios/20261102001.mp3",
        "interlocutor": "Marcos (Controladoria)",
        "ponto_forte": "Abertura direta e fechamento seguro com alternativa dupla",
        "transcricao": "SDR: Bom dia Marcos... Interlocutor: Bom dia...",
        "justificativa_criterios": { "abertura": 95, "spin": 90, "perfil": 90, "bant": 90, "escuta": 95, "prox_passo": 95 }
      }
    ],
    "top_3_piores": [
      {
        "protocolo": 20261103002,
        "log": "LOG_20261103_002",
        "nota": 48,
        "audio_url": "/audios/20261103002.mp3",
        "interlocutor": "Carlos (Diretor)",
        "falha_critica": "Descarte imediato para e-mail sem qualificação",
        "frase_alternativa": "Entendo sua pressa Carlos...",
        "transcricao": "SDR: Alô, Carlos?... Interlocutor: Manda por e-mail...",
        "justificativa_criterios": { "abertura": 50, "spin": 30, "perfil": 50, "bant": 40, "escuta": 60, "prox_passo": 50 }
      }
    ]
  }
}
```

### 3. Diretrizes de Consumo no Front:

1. **Zero Chamadas de IA no Front:** Não invoque APIs de LLM. Todo o processamento analítico e textual já vem mastigado nas chaves `diagnostico_camada_3` e `parecer_executivo`.
2. **Mapeamento das Camadas:**
   - `metricas_camada_1` alimenta os gráficos de Funil de Conversão e Métricas Brutas.
   - `metricas_camada_2` alimenta o gráfico Radar/Teia de aranha (notas de 0 a 100).
   - `diagnostico_camada_3` alimenta os Cards de Feedback, Gargalos e Tabela de Objeções.
   - `evidencias_camada_4` alimenta a Lista/Player das ligações selecionadas (utilizando `audio_url` e `transcricao`).
3. **Casos Especiais:**
   - Em visões de `DEPARTAMENTO` ou `EQUIPE`, `evidencias_camada_4.top_3_melhores` e `top_3_piores` podem ser arrays vazios (`[]`). Trate exibindo uma mensagem de estado vazio ("Sem evidências para o escopo selecionado").
   - Se o backend retornar status `404`, exiba um Empty State amigável: *"Perfil não consolidado para este período."*
