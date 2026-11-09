import { prisma } from "../src/lib/prisma.js";

const CRITERIA_OFFICIAL = {
    abertura: {
        codigo: "abertura",
        criterio: "Abertura",
        descricao: "Abertura clara, motivo do contato e relevância para o interlocutor",
        teto: 10,
    },
    spin: {
        codigo: "spin",
        criterio: "SPIN",
        descricao: "Descoberta SPIN: Situação (5), Problema (10), Implicação (8), Necessidade de solução (7)",
        teto: 30,
    },
    perfil: {
        codigo: "perfil",
        criterio: "Perfil ICP",
        descricao: "Investigação adequada do perfil: setor (5), regime tributário (10), faturamento (10)",
        teto: 25,
    },
    bant: {
        codigo: "bant",
        criterio: "BANT",
        descricao: "Investigação BANT: viabilidade comercial (2), autoridade (5), necessidade (5), prazo (3)",
        teto: 15,
    },
    escuta: {
        codigo: "escuta",
        criterio: "Escuta Ativa",
        descricao: "Escuta, aprofundamento e tratamento respeitoso de dúvidas ou objeções",
        teto: 10,
    },
    prox_passo: {
        codigo: "prox_passo",
        criterio: "Próximo Passo",
        descricao: "Proposta de próximo passo pertinente e tentativa de obter compromisso claro",
        teto: 10,
    },
};

const EVIDENCIAS_LUCAS = {
    top_3_melhores: [
        {
            protocolo: 202611040012,
            log: "LOG_20261104_0012",
            numero: "(11) 98765-4321",
            dt_inicio: "2026-11-04T10:15:00.000Z",
            dt_fim: "2026-11-04T10:21:30.000Z",
            duracao_segundos: 390,
            interlocutor: "Renato (Diretor Comercial - Distribuidora Alfa)",
            nota: 94,
            ligacao_relevante: "s",
            conversa_decisor: "s",
            reuniao_confirmada: "s",
            resultado_frase: "Reunião de demonstração confirmada para quinta-feira às 14h com o Diretor Comercial.",
            feedback_geral: "Ligação exemplar. Conexão direta, respeito ao tempo do decisor, identificação precisa do problema central e fechamento com alternativa dupla sem titubear.",
            acertos: "Excelente postura inicial, identificação imediata da dor e mapeamento completo de regime tributário e faturamento.",
            melhorias: "Poderia ter confirmado o número de filiais antes de desligar, mas a condução foi cirúrgica.",
            frase_original: "Que tal na quinta às 14h ou sexta às 10h para eu te mostrar em 15 minutos como a Alfa pode blindar isso?",
            frase_alternativa: "A condução utilizada foi ideal. Como refinamento opcional: 'Renato, só para eu levar o desenho exato na quinta às 14h, hoje vocês operam no Lucro Real em todas as filiais?'",
            ponto_forte: "Abertura objetiva e fechamento de horário seguro com técnica de dupla alternativa.",
            transcricao:
                "SDR: Olá Renato, bom dia! Aqui é o Lucas da SONAX. Vi que você lidera a operação da Distribuidora Alfa. Peguei você no meio de uma reunião ou temos 1 minuto?\nInterlocutor: Bom dia Lucas. Estou indo para um alinhamento agora, mas fala rápido.\nSDR: Perfeito, vou direto ao ponto. Notamos que distribuidoras no Lucro Presumido e Real com faturamento acima de R$ 2M/mês têm enfrentado gargalos sérios na operação e perda de eficiência fiscal e comercial. Esse tem sido um desafio aí na Alfa?\nInterlocutor: Rapaz, exatamente isso. Nossa operação cresceu muito este ano, estamos faturando cerca de R$ 3,5M no Lucro Real e o controle virou uma dor de cabeça diária.\nSDR: Imagino o impacto disso no caixa. Que tal na quinta às 14h ou sexta às 10h para eu te mostrar em 15 minutos como estruturamos isso para distribuidoras do porte de vocês?\nInterlocutor: Quinta às 14h é ótimo. Manda o convite no meu e-mail.",
            notas_criterios: { abertura: 10, spin: 28, perfil: 24, bant: 13, escuta: 9, prox_passo: 10 },
            justificativas_textuais: {
                abertura: "Ganhou a permissão para falar em menos de 10 segundos respeitando a rotina do lead e deixou claro o motivo do contato.",
                spin: "Explorou Situação (5/5), Problema (10/10), Implicação no caixa (7/8) e Necessidade de solução (6/7).",
                perfil: "Validou setor de distribuição (5/5), regime tributário Lucro Real (10/10) e faixa de faturamento R$ 3,5M (9/10).",
                bant: "Confirmou viabilidade comercial (2/2), autoridade direta do Diretor (5/5), necessidade ativa (4/5) e prazo curto (2/3).",
                escuta: "Não interrompeu o desabafo do lead e aprofundou com empatia.",
                prox_passo: "Fixou dia, horário com dupla alternativa e envio imediato de invite no calendário.",
            },
            criterios_qualitativos: {
                validacao_dor: "Conectou o crescimento da operação com o impacto direto na rotina do decisor.",
                contato_inicial: "Voz firme, educada, segura e profissional.",
                isolamento_objecao: "Respeitou a restrição de tempo inicial e converteu em agendamento rápido.",
                qualidade_investigacao: "Mapeou setor, regime tributário e faturamento de forma natural na conversa.",
            },
            detalhes_interlocutor: {
                interesse_expresso: "Estruturar controle operacional e eficiência para distribuidora no Lucro Real",
                duvidas: "Tempo de duração da reunião de diagnóstico",
                objecoes: "Pouco tempo no momento da ligação",
                resposta_sdr: "Respeitou o minuto solicitado, validou o perfil e propôs 15 minutos na quinta ou sexta",
                reacao_interlocutor: "Muito receptivo, confirmou quinta às 14h",
            },
        },
        {
            protocolo: 202611050033,
            log: "LOG_20261105_0033",
            numero: "(31) 99887-7665",
            dt_inicio: "2026-11-05T11:20:00.000Z",
            dt_fim: "2026-11-05T11:27:10.000Z",
            duracao_segundos: 430,
            interlocutor: "Juliana (Head de Operações - Grupo Vértice)",
            nota: 91,
            ligacao_relevante: "s",
            conversa_decisor: "s",
            reuniao_confirmada: "s",
            resultado_frase: "Reunião de diagnóstico marcada para sexta-feira às 11h.",
            feedback_geral: "Ótima exploração de critérios de qualificação (setor, regime e faturamento) e excelente rapport ao contornar contrato vigente.",
            acertos: "Rapport natural, qualificação completa do ICP e bom isolamento da objeção de fornecedor atual.",
            melhorias: "Aprofundar um pouco mais no prazo de decisão conjunta com a diretoria.",
            frase_original: "Vamos bater um papo de 15 minutos nesta sexta às 11h para você conhecer nosso SLA dedicado antes do seu contrato vencer?",
            frase_alternativa: "Deixar claro no convite os pontos de comparativo de SLA que serão abordados na sexta-feira.",
            ponto_forte: "Contornou a objeção de contrato vigente mostrando planejamento prévio de migração.",
            transcricao:
                "SDR: Juliana, bom dia! Aqui é o Lucas da SONAX...\nInterlocutor: Oi Lucas, nós já temos parceiro contratado aqui no Grupo Vértice, nosso contrato vence só daqui a 2 meses.\nSDR: Excelente, Juliana! Dois meses é exatamente a janela ideal para você avaliar opções com calma sem ficar refém de renovação automática. Hoje vocês atuam no setor industrial sob Lucro Presumido, correto? Qual a faixa de faturamento mensal aproximada?\nInterlocutor: Isso, indústria no Lucro Presumido, faturamos na casa de R$ 1,8 milhão por mês.\nSDR: Perfeito. E se você pudesse melhorar uma única coisa no atendimento que recebem hoje, o que seria?\nInterlocutor: Com certeza a demora nas entregas e no suporte técnico.\nSDR: Faz total sentido. Vamos bater um papo de 15 minutos nesta sexta às 11h para você comparar nossa metodologia antes do seu contrato vencer?\nInterlocutor: Combinado, sexta às 11h funciona.",
            notas_criterios: { abertura: 9, spin: 27, perfil: 23, bant: 13, escuta: 10, prox_passo: 9 },
            justificativas_textuais: {
                abertura: "Apresentação clara, cordial e contextualizada.",
                spin: "Pergunta cirúrgica para extrair insatisfação oculta e implicação da renovação automática.",
                perfil: "Confirmou setor industrial (5/5), regime Lucro Presumido (9/10) e faturamento de R$ 1,8M (9/10).",
                bant: "Mapeou janela exata de vencimento contratual (2 meses), necessidade e autoridade.",
                escuta: "Espaço de fala bem dosado e acolhimento respeitoso da objeção.",
                prox_passo: "Confirmação de compromisso claro para sexta às 11h.",
            },
            criterios_qualitativos: {
                validacao_dor: "Validou insatisfação com suporte lento da atual parceira.",
                contato_inicial: "Conexão rápida e consultiva.",
                isolamento_objecao: "Transformou o vencimento em 2 meses em argumento a favor da reunião.",
                qualidade_investigacao: "Investigou setor, regime tributário e faturamento com fluidez.",
            },
            detalhes_interlocutor: {
                interesse_expresso: "Avaliar alternativa antes da renovação contratual",
                duvidas: "Prazo de transição",
                objecoes: "Contrato vigente por mais 2 meses",
                resposta_sdr: "Mostrou que 2 meses é a janela ideal para avaliar sem pressa",
                reacao_interlocutor: "Concordou e agendou reunião",
            },
        },
        {
            protocolo: 202611030018,
            log: "LOG_20261103_0018",
            numero: "(41) 98811-2233",
            dt_inicio: "2026-11-03T15:40:00.000Z",
            dt_fim: "2026-11-03T15:46:20.000Z",
            duracao_segundos: 380,
            interlocutor: "Marcos (Diretor Administrativo - TechSul)",
            nota: 89,
            ligacao_relevante: "s",
            conversa_decisor: "s",
            reuniao_confirmada: "s",
            resultado_frase: "Reunião de alinhamento técnico agendada para segunda-feira às 15h.",
            feedback_geral: "Boa condução do funil com validação sólida de perfil (setor, regime e faturamento) e segurança técnica.",
            acertos: "Firmeza na condução do roteiro e resposta segura às dúvidas de compliance.",
            melhorias: "Poderia ter aprofundado mais nas implicações financeiras durante o SPIN.",
            frase_original: "Posso te demonstrar nossa estrutura na segunda às 15h ou terça às 10h?",
            frase_alternativa: "Além da sua participação, Marcos, vale convidar o contador ou responsável fiscal para avaliar o desenho na segunda-feira?",
            ponto_forte: "Assertividade no próximo passo e excelente postura investigativa.",
            transcricao:
                "SDR: Marcos, tudo bem? Aqui é o Lucas da SONAX. Falo com você sobre otimização para empresas de tecnologia no Lucro Real...\nInterlocutor: Tudo bem Lucas. Nós somos do setor de serviços de TI, estamos no Lucro Presumido faturando R$ 1,2M/mês, mas temos receio quanto à segurança e compliance.\nSDR: Perfeito questionamento, Marcos. Operamos com total conformidade e rastreabilidade. Posso te demonstrar a arquitetura na segunda às 15h ou terça às 10h?\nInterlocutor: Segunda às 15h está ótimo.",
            notas_criterios: { abertura: 9, spin: 26, perfil: 23, bant: 13, escuta: 9, prox_passo: 9 },
            justificativas_textuais: {
                abertura: "Tom positivo, seguro e motivo do contato explícito.",
                spin: "Identificou situação e problema de compliance com clareza.",
                perfil: "Mapeou setor de TI (5/5), Lucro Presumido (9/10) e faturamento de R$ 1,2M (9/10).",
                bant: "Autoridade validada e prazo de decisão alinhado para 15 dias.",
                escuta: "Boa tolerância a pausas e tratamento respeitoso da dúvida.",
                prox_passo: "Compromisso claro firmado para segunda às 15h.",
            },
            criterios_qualitativos: {
                validacao_dor: "Foco na segurança jurídica e conformidade da operação.",
                contato_inicial: "Cordial e objetivo.",
                isolamento_objecao: "Tratou receio de segurança com dados objetivos.",
                qualidade_investigacao: "Confirmou os três pilares do perfil ICP.",
            },
            detalhes_interlocutor: {
                interesse_expresso: "Segurança e conformidade operacional",
                duvidas: "Rastreabilidade e LGPD",
                objecoes: "Receio técnico inicial",
                resposta_sdr: "Esclareceu sobre certificações e propôs demonstração prática",
                reacao_interlocutor: "Satisfeito, confirmou reunião",
            },
        },
    ],
    top_3_piores: [
        {
            protocolo: 202611020005,
            log: "LOG_20261102_0005",
            numero: "(21) 97766-5544",
            dt_inicio: "2026-11-02T09:10:00.000Z",
            dt_fim: "2026-11-02T09:11:45.000Z",
            duracao_segundos: 105,
            interlocutor: "Carlos (Diretor Financeiro)",
            nota: 48,
            ligacao_relevante: "s",
            conversa_decisor: "s",
            reuniao_confirmada: "n",
            resultado_frase: "Lead descartou ligação pedindo envio de apresentação por e-mail.",
            feedback_geral: "Descarte imediato para e-mail sem qualquer tentativa de isolamento de objeção ou investigação mínima de regime tributário e faturamento.",
            acertos: "Educação e simpatia no atendimento.",
            melhorias: "Cedeu de primeira ao pedido de envio de e-mail sem validar se há interesse ou qualificar o perfil.",
            frase_original: "Ah, com certeza Carlos, sem problemas! Qual é o seu melhor e-mail? Vou te mandar um PDF completo tá bom?",
            frase_alternativa:
                "Entendo perfeitamente sua correria, Carlos! Só para eu não lotar sua caixa de entrada com um material genérico: hoje vocês operam no Lucro Real ou Presumido, e qual ponto mais pesa na rotina financeira de vocês?",
            falha_critica: "Descarte passivo sem validação de dor nem tentativa de isolamento da objeção de tempo.",
            transcricao:
                "SDR: Alô, Carlos? Tudo bem? Sou o Lucas da SONAX...\nInterlocutor: Olha Lucas, estou na correria danada aqui fechando a folha. Me manda um e-mail com a apresentação de vocês que depois eu vejo.\nSDR: Ah, com certeza Carlos, sem problemas! Qual é o seu melhor e-mail?\nInterlocutor: carlos@empresa.com.br\nSDR: Anotei aqui, vou te mandar um PDF completo tá bom? Muito obrigado pelo seu tempo e bom trabalho!\nInterlocutor: Valeu, tchau.",
            notas_criterios: { abertura: 6, spin: 12, perfil: 13, bant: 6, escuta: 6, prox_passo: 5 },
            justificativas_textuais: {
                abertura: "Apresentação padrão de telemarketing sem gancho de relevância (6/10).",
                spin: "Não aplicou perguntas de problema ou implicação antes de aceitar o descarte (12/30).",
                perfil: "Conhecia apenas o setor, não investigou regime tributário nem faturamento (13/25).",
                bant: "Falou com o Diretor Financeiro (autoridade), mas não validou necessidade nem prazo (6/15).",
                escuta: "Ouviu o lead, mas aceitou a barreira sem aprofundar (6/10).",
                prox_passo: "Prometeu envio de PDF genérico sem data de retorno acordada (5/10).",
            },
            criterios_qualitativos: {
                validacao_dor: "Não houve validação da dor; aceitou a desculpa de tempo como verdade absoluta.",
                contato_inicial: "Tom inseguro e sem quebra de padrão inicial.",
                isolamento_objecao: "Nenhuma tentativa de isolar a objeção de envio de e-mail.",
                qualidade_investigacao: "Nenhuma pergunta sobre regime tributário ou faturamento realizada.",
            },
            detalhes_interlocutor: {
                interesse_expresso: "Nenhum",
                duvidas: "Nenhuma",
                objecoes: "Me manda por e-mail para eu analisar",
                resposta_sdr: "Concorda de imediato, pede confirmação do e-mail e desliga a chamada",
                reacao_interlocutor: "Desligou rapidamente",
            },
        },
        {
            protocolo: 202611030022,
            log: "LOG_20261103_0022",
            numero: "(19) 98765-1234",
            dt_inicio: "2026-11-03T14:05:00.000Z",
            dt_fim: "2026-11-03T14:07:10.000Z",
            duracao_segundos: 130,
            interlocutor: "Mariana (Gestora Administrativa)",
            nota: 52,
            ligacao_relevante: "s",
            conversa_decisor: "s",
            reuniao_confirmada: "n",
            resultado_frase: "Lead informou que já possui solução contratada e encerrou a ligação.",
            feedback_geral: "Falta de firmeza ao ser confrontado com a objeção de concorrência, encerrando sem investigar faturamento ou brechas.",
            acertos: "Foi cordial durante toda a chamada.",
            melhorias: "Não explorou se a solução atual atende plenamente as expectativas do time.",
            frase_original: "Entendi Mariana. Bom, qualquer coisa fico à disposição então, ano que vem eu volto a ligar. Obrigado!",
            frase_alternativa:
                "Que ótimo que vocês já estruturaram essa frente, Mariana! Hoje, de 0 a 10, qual sua nota para a velocidade de entrega deles quando surge uma demanda urgente?",
            falha_critica: "Paralisou diante da objeção de concorrência e não buscou brechas de insatisfação.",
            transcricao:
                "SDR: Alô, Mariana? Aqui é o Lucas da SONAX.\nInterlocutor: Oi Lucas, nós já temos assessoria contratada há 2 anos e não pensamos em trocar agora.\nSDR: Entendi Mariana. Bom, qualquer coisa fico à disposição então, ano que vem eu volto a ligar. Obrigado!\nInterlocutor: Obrigada, bom dia.",
            notas_criterios: { abertura: 6, spin: 14, perfil: 14, bant: 7, escuta: 6, prox_passo: 5 },
            justificativas_textuais: {
                abertura: "Abertura aceitável, mas sem gancho de relevância (6/10).",
                spin: "Nenhuma pergunta de problema realizada após ouvir que já possuem fornecedor (14/30).",
                perfil: "Identificou setor e regime, mas não levantou faturamento (14/25).",
                bant: "Não explorou quando o contrato encerra (7/15).",
                escuta: "Aceitou a primeira negativa sem explorar contexto (6/10).",
                prox_passo: "Encerrou sem deixar porta aberta para follow-up estruturado (5/10).",
            },
            criterios_qualitativos: {
                validacao_dor: "Não investigou dores ocultas.",
                contato_inicial: "Faltou energia e autoridade no tom de voz.",
                isolamento_objecao: "Considerou contrato vigente como barreira intransponível.",
                qualidade_investigacao: "Faltou profundidade para mapear o perfil completo.",
            },
            detalhes_interlocutor: {
                interesse_expresso: "Baixo",
                duvidas: "Nenhuma",
                objecoes: "Já temos uma solução contratada",
                resposta_sdr: "Apenas agradeceu e disse que retornaria no ano que vem",
                reacao_interlocutor: "Fria e desinteressada",
            },
        },
        {
            protocolo: 202611050041,
            log: "LOG_20261105_0041",
            numero: "(85) 99123-4567",
            dt_inicio: "2026-11-05T16:30:00.000Z",
            dt_fim: "2026-11-05T16:32:20.000Z",
            duracao_segundos: 140,
            interlocutor: "Roberto (Gerente Financeiro)",
            nota: 56,
            ligacao_relevante: "s",
            conversa_decisor: "s",
            reuniao_confirmada: "n",
            resultado_frase: "Interlocutor recusou prosseguir alegando corte de investimentos.",
            feedback_geral: "Falhou em reposicionar a conversa como oportunidade de recuperação/redução de custos operacionais.",
            acertos: "Conseguiu chegar diretamente no decisor financeiro.",
            melhorias: "Posicionar o diagnóstico como alavanca de economia antes de aceitar a negativa de budget.",
            frase_original: "Compreendo Roberto, o mercado está difícil mesmo. Vou deixar para entrar em contato mais pra frente então.",
            frase_alternativa:
                "Compreendo perfeitamente que o momento é de contenção de despesas, Roberto. É justamente por isso que te liguei: 80% dos nossos clientes no Lucro Real entraram para gerar caixa e reduzir custos. Vale 10 minutos na quinta para avaliarmos sem compromisso?",
            falha_critica: "Falhou em transformar a objeção de corte de custos em oportunidade de economia.",
            transcricao:
                "SDR: Bom dia Roberto, falo da SONAX sobre novos projetos para a área financeira.\nInterlocutor: Lucas, estamos com orçamento travado e cortando todos os investimentos novos neste trimestre.\nSDR: Compreendo Roberto, o mercado está difícil mesmo. Vou deixar para entrar em contato mais pra frente então. Um abraço!\nInterlocutor: Abraço, tchau.",
            notas_criterios: { abertura: 6, spin: 16, perfil: 15, bant: 8, escuta: 6, prox_passo: 5 },
            justificativas_textuais: {
                abertura: "Abordou falando em 'novos projetos' (que soa como despesa) em vez de 'eficiência e caixa' (6/10).",
                spin: "Pouco foco em implicação financeira da inação (16/30).",
                perfil: "Mapeou setor e regime tributário, mas faltou faturamento exato (15/25).",
                bant: "Travou na resposta de falta de budget (8/15).",
                escuta: "Razoável, mas passiva diante da objeção (6/10).",
                prox_passo: "Sem próximo passo definido (5/10).",
            },
            criterios_qualitativos: {
                validacao_dor: "Não conectou com a necessidade de geração de caixa.",
                contato_inicial: "Abordagem genérica.",
                isolamento_objecao: "Não contornou a objeção de orçamento travado.",
                qualidade_investigacao: "Investigação parcial do perfil ICP.",
            },
            detalhes_interlocutor: {
                interesse_expresso: "Contenção de despesas",
                duvidas: "Nenhuma",
                objecoes: "Orçamento travado neste trimestre",
                resposta_sdr: "Concordou e encerrou sem contraproposta de economia",
                reacao_interlocutor: "Cortês, porém encerrou rapidamente",
            },
        },
    ],
};

async function main() {
    console.log("🌱 Iniciando seed relacional completo do banco SONAX...");

    // Limpa dados anteriores respeitando a ordem das FKs
    await prisma.perfis_consolidados.deleteMany();
    await prisma.interlocutor.deleteMany();
    await prisma.avaliacao_sdr.deleteMany();
    await prisma.avaliacao_ia.deleteMany();
    await prisma.registro_chamadas.deleteMany();
    await prisma.chamadas.deleteMany();
    await prisma.agentes.deleteMany();
    await prisma.departamentos.deleteMany();

    // 1. Departamentos
    const deptGeral = await prisma.departamentos.create({
        data: { nome: "Comercial Geral", ativo: true },
    });
    const deptTributario = await prisma.departamentos.create({
        data: { nome: "Comercial Tributário", ativo: true },
    });
    const deptInbound = await prisma.departamentos.create({
        data: { nome: "Inbound Corporativo", ativo: true },
    });

    console.log("✅ Departamentos criados.");

    // 2. Agentes (SDRs)
    const agentesData = [
        { agente_login: "sdr_lucas", agente_nome: "Lucas Silveira", id_departamento: deptGeral.id_departamento },
        { agente_login: "sdr_prado", agente_nome: "Lucas Prado", id_departamento: deptGeral.id_departamento },
        { agente_login: "sdr_beatriz", agente_nome: "Beatriz Lima", id_departamento: deptTributario.id_departamento },
        { agente_login: "sdr_thiago", agente_nome: "Thiago Ramos", id_departamento: deptInbound.id_departamento },
        { agente_login: "sdr_mariana", agente_nome: "Mariana Souza", id_departamento: deptTributario.id_departamento },
        { agente_login: "sdr_felipe", agente_nome: "Felipe Mendes", id_departamento: deptGeral.id_departamento },
        { agente_login: "sdr_karolyne", agente_nome: "Karolyne Gluszczynski", id_departamento: deptInbound.id_departamento },
    ];

    const mapaAgentes = {};
    for (const ag of agentesData) {
        const criado = await prisma.agentes.create({ data: { ...ag, ativo: true } });
        mapaAgentes[ag.agente_login] = criado;
    }

    console.log("✅ Agentes (SDRs) criados.");

    // 3. Chamadas, Registro_Chamadas, Avaliacao_IA, Avaliacao_SDR e Interlocutor (Semana 1 Nov 2026 - Lucas Silveira)
    const todasEvidencias = [
        ...EVIDENCIAS_LUCAS.top_3_melhores,
        ...EVIDENCIAS_LUCAS.top_3_piores,
    ];

    for (const ev of todasEvidencias) {
        const protoBig = BigInt(ev.protocolo);
        await prisma.chamadas.create({
            data: {
                protocolo: protoBig,
                estado_ddd: "11",
                numero: ev.numero,
                atendido: "s",
                ramal: "1001",
                duracao_segundos: ev.duracao_segundos,
                fila_id: 1,
                fila_descricao: "Outbound Comercial Geral",
                tabulacao_id: ev.reuniao_confirmada === "s" ? 10 : 20,
                tabulacao_descricao: ev.reuniao_confirmada === "s" ? "Reunião Agendada" : "Descarte / Follow-up",
                agente_login: "sdr_lucas",
                agente_nome: "Lucas Silveira",
                campanha_id: 101,
                campanha_descricao: "Prospecção Novembro 2026",
                dt_inicio: new Date(ev.dt_inicio),
                dt_fim: new Date(ev.dt_fim),
                status: "FINALIZADA",
            },
        });

        await prisma.registro_chamadas.create({
            data: {
                log: ev.log,
                protocolo: protoBig,
                transcricao: ev.transcricao,
            },
        });

        await prisma.avaliacao_ia.create({
            data: {
                log: ev.log,
                data_avaliacao: new Date(ev.dt_inicio),
                modelo_ia: "gemini-2.5-flash",
                ligacao_relevante: ev.ligacao_relevante,
                conversa_decisor: ev.conversa_decisor,
                reuniao_confirmada: ev.reuniao_confirmada,
                resultado_frase: ev.resultado_frase,
            },
        });

        await prisma.avaliacao_sdr.create({
            data: {
                log: ev.log,
                nota_final: ev.nota,
                feedback_geral: ev.feedback_geral,
                frase_original: ev.frase_original,
                frase_alternativa: ev.frase_alternativa,
                validacao_dor: ev.criterios_qualitativos.validacao_dor,
                contato_inicial: ev.criterios_qualitativos.contato_inicial,
                isolamento_objecao: ev.criterios_qualitativos.isolamento_objecao,
                qualidade_investigacao: ev.criterios_qualitativos.qualidade_investigacao,
                acertos: ev.acertos,
                melhorias: ev.melhorias,
                nota_abertura: ev.notas_criterios.abertura,
                justificativa_abertura: ev.justificativas_textuais.abertura,
                nota_spin: ev.notas_criterios.spin,
                justificativa_spin: ev.justificativas_textuais.spin,
                nota_perfil: ev.notas_criterios.perfil,
                justificativa_perfil: ev.justificativas_textuais.perfil,
                nota_bant: ev.notas_criterios.bant,
                justificativa_bant: ev.justificativas_textuais.bant,
                nota_escuta: ev.notas_criterios.escuta,
                justificativa_escuta: ev.justificativas_textuais.escuta,
                nota_prox_passo: ev.notas_criterios.prox_passo,
                justificativa_prox_passo: ev.justificativas_textuais.prox_passo,
            },
        });

        await prisma.interlocutor.create({
            data: {
                log: ev.log,
                interesse_expresso: ev.detalhes_interlocutor.interesse_expresso,
                duvidas: ev.detalhes_interlocutor.duvidas,
                objecoes: ev.detalhes_interlocutor.objecoes,
                resposta_sdr: ev.detalhes_interlocutor.resposta_sdr,
                reacao_interlocutor: ev.detalhes_interlocutor.reacao_interlocutor,
            },
        });
    }

    // Adiciona o restante das chamadas de Lucas na Semana 1 Nov 2026 para fechar exatamente:
    // 62 realizadas, 44 atendidas, 26 relevantes, 16 decisor, 5 reuniões
    // Já inserimos 6 chamadas (todas atendidas=s, relevantes=s, decisor=s, sendo 3 com reuniao=s e 3 com reuniao=n).
    // Faltam 56 chamadas:
    // - 38 atendidas (sendo 20 relevantes: 10 com decisor=s [2 com reuniao=s], 10 com decisor=n; e 18 não relevantes)
    // - 18 não atendidas
    let seqProto = 202611021000;
    for (let i = 1; i <= 56; i++) {
        seqProto++;
        const protoBig = BigInt(seqProto);
        const logId = `LOG_20261102_${1000 + i}`;
        const atendido = i <= 38 ? "s" : "n";
        const relevante = i <= 20 ? "s" : "n";
        const decisor = i <= 10 ? "s" : "n";
        const reuniao = i <= 2 ? "s" : "n";

        await prisma.chamadas.create({
            data: {
                protocolo: protoBig,
                estado_ddd: "11",
                numero: `(11) 97000-${String(1000 + i)}`,
                atendido,
                ramal: "1001",
                duracao_segundos: atendido === "s" ? 180 : 15,
                fila_id: 1,
                fila_descricao: "Outbound Comercial Geral",
                tabulacao_id: reuniao === "s" ? 10 : 20,
                tabulacao_descricao: reuniao === "s" ? "Reunião Agendada" : "Contato Realizado",
                agente_login: "sdr_lucas",
                agente_nome: "Lucas Silveira",
                campanha_id: 101,
                campanha_descricao: "Prospecção Novembro 2026",
                dt_inicio: new Date("2026-11-04T14:00:00.000Z"),
                dt_fim: new Date("2026-11-04T14:03:00.000Z"),
                status: "FINALIZADA",
            },
        });

        if (atendido === "s") {
            await prisma.registro_chamadas.create({
                data: {
                    log: logId,
                    protocolo: protoBig,
                    transcricao: "SDR: Bom dia, aqui é o Lucas da SONAX... Interlocutor: Olá Lucas, podemos conversar.",
                },
            });

            await prisma.avaliacao_ia.create({
                data: {
                    log: logId,
                    data_avaliacao: new Date("2026-11-04T14:00:00.000Z"),
                    modelo_ia: "gemini-2.5-flash",
                    ligacao_relevante: relevante,
                    conversa_decisor: decisor,
                    reuniao_confirmada: reuniao,
                    resultado_frase: reuniao === "s" ? "Reunião agendada com sucesso." : "Qualificação inicial realizada.",
                },
            });

            if (relevante === "s") {
                await prisma.avaliacao_sdr.create({
                    data: {
                        log: logId,
                        nota_final: 75,
                        feedback_geral: "Boa condução técnica dentro dos parâmetros esperados na semana.",
                        nota_abertura: 8,
                        justificativa_abertura: "Abertura clara e objetiva.",
                        nota_spin: 21,
                        justificativa_spin: "Explorou situação e problema adecuadamente.",
                        nota_perfil: 19,
                        justificativa_perfil: "Validou setor, regime tributário e faixa de faturamento.",
                        nota_bant: 10,
                        justificativa_bant: "Mapeou autoridade e necessidade.",
                        nota_escuta: 8,
                        justificativa_escuta: "Escuta ativa respeitosa.",
                        nota_prox_passo: 9,
                        justificativa_prox_passo: "Tentativa clara de agendamento.",
                    },
                });
            }
        }
    }

    console.log("✅ Chamadas, transcrições e avaliações populadas.");

    // 4. Perfis Consolidados (Múltiplas Semanas e Múltiplos SDRs para teste completo no Frontend)
    const lucas = mapaAgentes["sdr_lucas"];
    const beatriz = mapaAgentes["sdr_beatriz"];
    const prado = mapaAgentes["sdr_prado"];
    const thiago = mapaAgentes["sdr_thiago"];
    const mariana = mapaAgentes["sdr_mariana"];
    const felipe = mapaAgentes["sdr_felipe"];
    const karolyne = mapaAgentes["sdr_karolyne"];

    // Perfil 1: Lucas Silveira - Semana 1 Novembro 2026 (02/11 a 06/11)
    await prisma.perfis_consolidados.create({
        data: {
            tipo_escopo: "AGENTE",
            granularidade: "SEMANAL",
            ano: 2026,
            mes: 11,
            semana_do_mes: 1,
            data_inicio: new Date("2026-11-02T00:00:00.000Z"),
            data_fim: new Date("2026-11-06T00:00:00.000Z"),
            id_agente: lucas.id_agente,
            id_departamento: lucas.id_departamento,
            parecer_executivo:
                "O SDR Lucas Silveira apresentou uma curva de evolução consistente ao longo das últimas 4 semanas, saindo de uma média geral de 61.2 para 74.5 na semana atual, acompanhado de um aumento expressivo na conversão de reuniões (de 2 para 5 agendamentos confirmados).\n\nDemonstrou forte habilidade de conexão empática no contato inicial, reduzindo drasticamente os desligamentos nos primeiros 15 segundos, além de excelente evolução na escuta ativa e na investigação de perfil (setor, regime tributário e faturamento).\n\nO maior ponto de atrito continua sendo o isolamento de objeções de envio de material por e-mail. Em aproximadamente 45% das ligações descartadas sem reunião, o SDR aceitou passivamente a objeção 'Me manda por e-mail que eu dou uma olhada' sem validar se a falta de tempo era o único impeditivo ou se havia real interesse na resolução do problema.",
            metricas_camada_1: {
                fluxo_bruto: {
                    realizadas: 62,
                    atendidas: 44,
                    relevantes: 26,
                    decisor: 16,
                    reunioes: 5,
                },
                funil_passagem: {
                    atendimento: 71,
                    relevancia: 59,
                    decisor: 62,
                    conversao_final: 31,
                    gargalo_etapa: "conversao_final",
                },
                ranking_adaptativo: [
                    { periodo: "Semana 1 (Out)", reunioes: 2, nota_media: 61.2 },
                    { periodo: "Semana 2 (Out)", reunioes: 3, nota_media: 64.0 },
                    { periodo: "Semana 3 (Out)", reunioes: 3, nota_media: 68.5 },
                    { periodo: "Semana Atual", reunioes: 5, nota_media: 74.5 },
                ],
            },
            metricas_camada_2: {
                nota_media_geral: 74.5,
                delta_periodo_anterior: 6.0,
                criterios_radar: [
                    { ...CRITERIA_OFFICIAL.abertura, nota: 7.8, nota_anterior: 7.0, delta: 0.8 },
                    { ...CRITERIA_OFFICIAL.spin, nota: 20.7, nota_anterior: 18.6, delta: 2.1 },
                    { ...CRITERIA_OFFICIAL.perfil, nota: 18.5, nota_anterior: 16.5, delta: 2.0 },
                    { ...CRITERIA_OFFICIAL.bant, nota: 10.0, nota_anterior: 9.5, delta: 0.5 },
                    { ...CRITERIA_OFFICIAL.escuta, nota: 8.0, nota_anterior: 7.4, delta: 0.6 },
                    { ...CRITERIA_OFFICIAL.prox_passo, nota: 9.5, nota_anterior: 9.5, delta: 0.0 },
                ],
            },
            diagnostico_camada_3: {
                sintese_executiva: {
                    destaque: "Assertividade ao propor horários com dupla alternativa no fechamento da reunião e investigação completa de setor, regime tributário e faturamento.",
                    gargalo_principal: "Aceitação passiva e imediata de pedidos de envio de material por e-mail antes de qualificar a dor.",
                    foco_da_semana: "Treinar técnicas de isolamento de objeções ('Entendo perfeitamente, Fulano. Mas se desconsiderarmos o envio do e-mail por um instante, esse problema tributário/operacional hoje é prioridade para você?').",
                },
                sintese_qualitativa: {
                    validacao_dor: "O SDR identifica bem problemas superficiais relatados pelo lead, mas ainda tem espaço para aprofundar as consequências financeiras e operacionais da inação antes de transicionar para o agendamento.",
                    contato_inicial: "Excelente tom de voz, clareza no motivo do contato e respeito ao tempo do interlocutor nos primeiros 15 segundos, gerando rapport imediato e reduzindo quedas prematuras.",
                    isolamento_objecao: "Apresenta hesitação quando o tomador levanta falta de tempo ou solicita material prévio por e-mail, optando pelo caminho de menor resistência sem isolar a objeção real.",
                    qualidade_investigacao: "Evolução nítida no mapeamento do Perfil ICP (setor, regime tributário e faturamento) e no uso de perguntas abertas situacionais.",
                },
                oportunidades_unificadas: [
                    {
                        codigo: "OP_OBJ_ENVIO_EMAIL",
                        prioridade: "ALTA",
                        percentual_aparicao: 45.0,
                        diagnostico_consolidado: "Em quase metade dos descartes de leads com fit, o SDR concorda imediatamente em mandar material por e-mail sem antes alinhar qual ponto específico o tomador gostaria de avaliar.",
                    },
                    {
                        codigo: "OP_APROFUNDAMENTO_IMPLICACAO",
                        prioridade: "MEDIA",
                        percentual_aparicao: 30.0,
                        diagnostico_consolidado: "Ao ouvir uma queixa sobre o cenário atual, o SDR passa rápido para a solução em vez de explorar o impacto financeiro disso no caixa mensal (Implicação do SPIN).",
                    },
                    {
                        codigo: "OP_REGISTRO_FOLLOWUP",
                        prioridade: "BAIXA",
                        percentual_aparicao: 12.0,
                        diagnostico_consolidado: "Em alguns contatos, o próximo passo fica combinado de forma genérica, sem registrar uma data e horário claros para o retorno.",
                    },
                ],
                perfil_objecoes: [
                    {
                        objecao_padrao: "Me manda por e-mail para eu analisar",
                        frequencia_percentual: 48.0,
                        reacao_predominante_sdr: "Concorda de imediato, pede confirmação do e-mail e desliga a chamada.",
                        efetividade: "BAIXA",
                        recomendacao_curta: "Validar qual informação específica é prioritária antes de enviar, propondo alinhar em 10 minutos de reunião.",
                    },
                    {
                        objecao_padrao: "Já temos uma solução contratada",
                        frequencia_percentual: 32.0,
                        reacao_predominante_sdr: "Questiona há quanto tempo estão com ela e se há planos de revisão contratual.",
                        efetividade: "MEDIA",
                        recomendacao_curta: "Investigar o nível de satisfação com o atendimento do fornecedor atual para identificar potenciais brechas.",
                    },
                ],
            },
            evidencias_camada_4: EVIDENCIAS_LUCAS,
        },
    });

    // Perfil 2: Lucas Silveira - Semana 4 Outubro 2026 (26/10 a 30/10)
    await prisma.perfis_consolidados.create({
        data: {
            tipo_escopo: "AGENTE",
            granularidade: "SEMANAL",
            ano: 2026,
            mes: 10,
            semana_do_mes: 4,
            data_inicio: new Date("2026-10-26T00:00:00.000Z"),
            data_fim: new Date("2026-10-30T00:00:00.000Z"),
            id_agente: lucas.id_agente,
            id_departamento: lucas.id_departamento,
            parecer_executivo:
                "Na última semana de Outubro, Lucas Silveira consolidou avanço importante na qualificação de Perfil ICP (chegando a 16.5 / 25 pontos), mantendo 3 reuniões qualificadas agendadas.\n\nO foco principal de melhoria identificado para a transição do mês foi aprimorar as perguntas de Implicação e Necessidade de Solução dentro da metodologia SPIN.",
            metricas_camada_1: {
                fluxo_bruto: { realizadas: 58, atendidas: 39, relevantes: 22, decisor: 13, reunioes: 3 },
                funil_passagem: { atendimento: 67, relevancia: 56, decisor: 59, conversao_final: 23, gargalo_etapa: "conversao_final" },
                ranking_adaptativo: [
                    { periodo: "Semana 1 (Out)", reunioes: 2, nota_media: 61.2 },
                    { periodo: "Semana 2 (Out)", reunioes: 3, nota_media: 64.0 },
                    { periodo: "Semana Atual", reunioes: 3, nota_media: 68.5 },
                ],
            },
            metricas_camada_2: {
                nota_media_geral: 68.5,
                delta_periodo_anterior: 4.5,
                criterios_radar: [
                    { ...CRITERIA_OFFICIAL.abertura, nota: 7.0, nota_anterior: 6.5, delta: 0.5 },
                    { ...CRITERIA_OFFICIAL.spin, nota: 18.6, nota_anterior: 17.0, delta: 1.6 },
                    { ...CRITERIA_OFFICIAL.perfil, nota: 16.5, nota_anterior: 15.5, delta: 1.0 },
                    { ...CRITERIA_OFFICIAL.bant, nota: 9.5, nota_anterior: 9.0, delta: 0.5 },
                    { ...CRITERIA_OFFICIAL.escuta, nota: 7.4, nota_anterior: 7.0, delta: 0.4 },
                    { ...CRITERIA_OFFICIAL.prox_passo, nota: 9.5, nota_anterior: 9.0, delta: 0.5 },
                ],
            },
            diagnostico_camada_3: {
                sintese_executiva: {
                    destaque: "Boa cadência operacional e disciplina na confirmação de horários de reunião.",
                    gargalo_principal: "Falta de aprofundamento no faturamento exato durante a etapa de Perfil ICP em 35% das chamadas.",
                    foco_da_semana: "Garantir que setor, regime tributário e faturamento sejam validados antes de apresentar os benefícios.",
                },
                sintese_qualitativa: {
                    validacao_dor: "Identifica o problema inicial, mas transiciona rápido demais para o agendamento.",
                    contato_inicial: "Apresentação segura e cordial.",
                    isolamento_objecao: "Dificuldade moderada diante da objeção de falta de tempo.",
                    qualidade_investigacao: "Investigou setor e regime tributário, mas hesitou em perguntar faixa de faturamento.",
                },
                oportunidades_unificadas: [
                    {
                        codigo: "OP_PERFIL_FATURAMENTO",
                        prioridade: "ALTA",
                        percentual_aparicao: 38.0,
                        diagnostico_consolidado: "Em mais de um terço das ligações relevantes, o SDR validou o regime tributário mas deixou de confirmar a faixa de faturamento mensal.",
                    },
                ],
                perfil_objecoes: [
                    {
                        objecao_padrao: "Me manda por e-mail para eu analisar",
                        frequencia_percentual: 52.0,
                        reacao_predominante_sdr: "Aceita enviar material sem qualificar urgência.",
                        efetividade: "BAIXA",
                        recomendacao_curta: "Isolar a objeção perguntando qual o principal desafio da área fiscal/comercial hoje.",
                    },
                ],
            },
            evidencias_camada_4: EVIDENCIAS_LUCAS,
        },
    });

    // Perfis adicionais para os demais SDRs na Semana 1 de Novembro 2026 para permitir troca de agente na UI
    const outrosPerfis = [
        {
            agente: beatriz,
            notaGeral: 81.2,
            delta: 4.8,
            fluxo: { realizadas: 70, atendidas: 52, relevantes: 34, decisor: 22, reunioes: 7 },
            notas: { abertura: 8.5, spin: 24.2, perfil: 21.5, bant: 12.0, escuta: 8.0, prox_passo: 7.0 },
            notasAnt: { abertura: 8.0, spin: 22.0, perfil: 20.0, bant: 11.4, escuta: 8.0, prox_passo: 7.0 },
            parecer:
                "A SDR Beatriz Lima liderou as conversões do Comercial Tributário na semana, atingindo 81.2 pontos de média técnica e 7 reuniões confirmadas.\n\nSeu grande diferencial foi o domínio da investigação de Perfil ICP (21.5 / 25 pts), extraindo com naturalidade o regime tributário (Lucro Real/Presumido) e a faixa de faturamento logo nos primeiros 2 minutos de conversa.",
        },
        {
            agente: prado,
            notaGeral: 69.0,
            delta: -1.5,
            fluxo: { realizadas: 55, atendidas: 36, relevantes: 20, decisor: 11, reunioes: 3 },
            notas: { abertura: 7.2, spin: 19.5, perfil: 17.0, bant: 9.8, escuta: 7.5, prox_passo: 8.0 },
            notasAnt: { abertura: 7.5, spin: 20.0, perfil: 17.5, bant: 10.0, escuta: 7.5, prox_passo: 8.0 },
            parecer:
                "O SDR Lucas Prado manteve volume estável de 55 ligações e 3 reuniões agendadas, com leve oscilação na nota técnica (-1.5 pts).\n\nRecomenda-se reforçar as perguntas de Implicação no SPIN e a validação de autoridade e prazo no BANT.",
        },
        {
            agente: thiago,
            notaGeral: 77.4,
            delta: 3.2,
            fluxo: { realizadas: 48, atendidas: 38, relevantes: 28, decisor: 19, reunioes: 6 },
            notas: { abertura: 8.2, spin: 22.8, perfil: 19.4, bant: 11.5, escuta: 8.0, prox_passo: 7.5 },
            notasAnt: { abertura: 7.8, spin: 21.0, perfil: 18.8, bant: 11.1, escuta: 8.0, prox_passo: 7.5 },
            parecer:
                "Atuando no Inbound Corporativo, Thiago Ramos obteve excelente taxa de atendimento (79%) e conversão em reuniões (6 agendamentos), destacando-se pela rapidez de resposta e qualificação de regime tributário.",
        },
        {
            agente: mariana,
            notaGeral: 72.8,
            delta: 5.1,
            fluxo: { realizadas: 64, atendidas: 45, relevantes: 27, decisor: 15, reunioes: 4 },
            notas: { abertura: 7.9, spin: 21.0, perfil: 18.2, bant: 10.2, escuta: 8.0, prox_passo: 7.5 },
            notasAnt: { abertura: 7.0, spin: 19.2, perfil: 17.0, bant: 9.5, escuta: 7.5, prox_passo: 7.5 },
            parecer:
                "Mariana Souza apresentou evolução expressiva de +5.1 pontos na semana no Comercial Tributário, melhorando significativamente sua abertura e a investigação de faturamento e regime tributário.",
        },
        {
            agente: felipe,
            notaGeral: 65.4,
            delta: 2.0,
            fluxo: { realizadas: 60, atendidas: 39, relevantes: 21, decisor: 12, reunioes: 3 },
            notas: { abertura: 6.8, spin: 18.0, perfil: 16.0, bant: 9.6, escuta: 7.5, prox_passo: 7.5 },
            notasAnt: { abertura: 6.5, spin: 17.2, perfil: 15.5, bant: 9.2, escuta: 7.5, prox_passo: 7.5 },
            parecer:
                "Felipe Mendes manteve consistência de discagens (60 chamadas) e evoluiu +2.0 pontos. Seu principal ponto de atenção para a próxima semana é o contorno da objeção de envio de apresentação por e-mail.",
        },
        {
            agente: karolyne,
            notaGeral: 79.6,
            delta: 4.4,
            fluxo: { realizadas: 52, atendidas: 41, relevantes: 30, decisor: 20, reunioes: 6 },
            notas: { abertura: 8.6, spin: 23.4, perfil: 20.0, bant: 11.6, escuta: 8.2, prox_passo: 7.8 },
            notasAnt: { abertura: 8.0, spin: 21.8, perfil: 19.0, bant: 11.0, escuta: 7.9, prox_passo: 7.5 },
            parecer:
                "Karolyne Gluszczynski teve excelente desempenho no Inbound Corporativo (79.6 pts), demonstrando escuta ativa apurada e condução consultiva nas etapas de SPIN e Perfil ICP.",
        },
    ];

    for (const item of outrosPerfis) {
        const { realizadas, atendidas, relevantes, decisor, reunioes } = item.fluxo;
        await prisma.perfis_consolidados.create({
            data: {
                tipo_escopo: "AGENTE",
                granularidade: "SEMANAL",
                ano: 2026,
                mes: 11,
                semana_do_mes: 1,
                data_inicio: new Date("2026-11-02T00:00:00.000Z"),
                data_fim: new Date("2026-11-06T00:00:00.000Z"),
                id_agente: item.agente.id_agente,
                id_departamento: item.agente.id_departamento,
                parecer_executivo: item.parecer,
                metricas_camada_1: {
                    fluxo_bruto: item.fluxo,
                    funil_passagem: {
                        atendimento: Math.round((atendidas / realizadas) * 100),
                        relevancia: Math.round((relevantes / atendidas) * 100),
                        decisor: Math.round((decisor / relevantes) * 100),
                        conversao_final: Math.round((reunioes / decisor) * 100),
                        gargalo_etapa: "conversao_final",
                    },
                    ranking_adaptativo: [
                        { periodo: "Semana 2 (Out)", reunioes: Math.max(1, reunioes - 2), nota_media: +(item.notaGeral - 6.5).toFixed(1) },
                        { periodo: "Semana 3 (Out)", reunioes: Math.max(2, reunioes - 1), nota_media: +(item.notaGeral - item.delta).toFixed(1) },
                        { periodo: "Semana Atual", reunioes, nota_media: item.notaGeral },
                    ],
                },
                metricas_camada_2: {
                    nota_media_geral: item.notaGeral,
                    delta_periodo_anterior: item.delta,
                    criterios_radar: [
                        { ...CRITERIA_OFFICIAL.abertura, nota: item.notas.abertura, nota_anterior: item.notasAnt.abertura, delta: +(item.notas.abertura - item.notasAnt.abertura).toFixed(1) },
                        { ...CRITERIA_OFFICIAL.spin, nota: item.notas.spin, nota_anterior: item.notasAnt.spin, delta: +(item.notas.spin - item.notasAnt.spin).toFixed(1) },
                        { ...CRITERIA_OFFICIAL.perfil, nota: item.notas.perfil, nota_anterior: item.notasAnt.perfil, delta: +(item.notas.perfil - item.notasAnt.perfil).toFixed(1) },
                        { ...CRITERIA_OFFICIAL.bant, nota: item.notas.bant, nota_anterior: item.notasAnt.bant, delta: +(item.notas.bant - item.notasAnt.bant).toFixed(1) },
                        { ...CRITERIA_OFFICIAL.escuta, nota: item.notas.escuta, nota_anterior: item.notasAnt.escuta, delta: +(item.notas.escuta - item.notasAnt.escuta).toFixed(1) },
                        { ...CRITERIA_OFFICIAL.prox_passo, nota: item.notas.prox_passo, nota_anterior: item.notasAnt.prox_passo, delta: +(item.notas.prox_passo - item.notasAnt.prox_passo).toFixed(1) },
                    ],
                },
                diagnostico_camada_3: {
                    sintese_executiva: {
                        destaque: "Qualificação consistente dos critérios de Perfil ICP (setor, regime tributário e faturamento) e boa postura consultiva.",
                        gargalo_principal: "Necessidade de aprofundar a etapa de Implicação (8 pts) dentro do SPIN antes de propor o agendamento.",
                        foco_da_semana: "Explorar o impacto financeiro do problema relatado pelo interlocutor para elevar a taxa de conversão final.",
                    },
                    sintese_qualitativa: {
                        validacao_dor: "Boa identificação inicial do problema, com oportunidade de quantificar melhor o impacto no caixa do cliente.",
                        contato_inicial: "Abertura clara, cordial e com propósito bem definido.",
                        isolamento_objecao: "Isola bem objeções de concorrência, mas pode ser mais incisivo quando o lead alega falta de tempo.",
                        qualidade_investigacao: "Cumpre rigorosamente o mapeamento de setor, regime tributário e faturamento.",
                    },
                    oportunidades_unificadas: [
                        {
                            codigo: "OP_SPIN_IMPLICACAO",
                            prioridade: "ALTA",
                            percentual_aparicao: 36.0,
                            diagnostico_consolidado: "Aprofundar as perguntas de Implicação no SPIN para aumentar a percepção de urgência do decisor.",
                        },
                        {
                            codigo: "OP_BANT_PRAZO",
                            prioridade: "MEDIA",
                            percentual_aparicao: 24.0,
                            diagnostico_consolidado: "Validar com maior clareza o prazo de decisão (3 pts do BANT) antes do encerramento da chamada.",
                        },
                    ],
                    perfil_objecoes: [
                        {
                            objecao_padrao: "Me manda por e-mail para eu analisar",
                            frequencia_percentual: 42.0,
                            reacao_predominante_sdr: "Questiona o ponto de interesse antes de enviar o resumo.",
                            efetividade: "MEDIA",
                            recomendacao_curta: "Converter o envio do material em uma rápida apresentação guiada de 10 minutos.",
                        },
                    ],
                },
                evidencias_camada_4: EVIDENCIAS_LUCAS,
            },
        });
    }

    console.log("✅ Perfis consolidados semanais criados para todos os SDRs.");
    console.log("🎉 Seed finalizado com sucesso!");
}

main()
    .catch((e) => {
        console.error("❌ Erro no seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

