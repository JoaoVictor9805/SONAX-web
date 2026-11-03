# Pendências Técnicas: Segurança da API e Autenticação

Este documento reúne os débitos técnicos e melhorias de segurança que devem ser implementados antes de levar o backend da SONAX para ambiente de produção.

---

## 1. Restrição de Origens e Política de CORS (Cross-Origin Resource Sharing)

### Contexto Atual
No arquivo `backend/src/server.js`, o plugin `@fastify/cors` está configurado com `origin: true`, permitindo que requisições vindas de qualquer navegador/endereço acessem as rotas da API. Isso é conveniente para o desenvolvimento local, mas perigoso em produção.

### Risco
* Sites de terceiros ou maliciosos podem tentar interagir com a API no navegador de um usuário legítimo (ataques do tipo CSRF / leitura indevida de dados via navegador).

### Solução a Implementar
Configurar uma lista de permissões (*whitelist*) baseada no ambiente (`NODE_ENV`):
1. **Em desenvolvimento:** Permitir `http://localhost:5173` (Vite) e portas locais.
2. **Em produção:** Permitir estritamente os domínios oficiais da SONAX (ex: `https://app.sonax.com.br`).

#### Exemplo de Implementação Prática:
```javascript
// backend/src/server.js
const allowedOrigins = process.env.NODE_ENV === "production"
    ? ["https://app.sonax.com.br"] // Apenas domínio de produção
    : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]; // Ambientes locais

await fastify.register(cors, {
    origin: (origin, cb) => {
        // Permite requisições sem origin (como mobile apps, curl ou ferramentas internas)
        // e origens presentes na lista autorizada
        if (!origin || allowedOrigins.includes(origin)) {
            cb(null, true);
            return;
        }
        cb(new Error("Origem não autorizada pela política de CORS"), false);
    },
    credentials: true, // Se for utilizar cookies/sessões autenticadas
});
```

---

## 2. Autenticação e Proteção da API (Postman, Insomnia e Scripts)

### Contexto Atual
As rotas de dados (como `/api/performance/kpis`) estão públicas. Qualquer ferramenta fora do navegador (Postman, Insomnia, scripts em Python ou cURL) consegue consumir os dados do banco se tiver o endereço da API.

### Risco
* Acesso não autorizado a dados sensíveis de performance, clientes e ligações.
* Ausência de auditoria (impossibilidade de saber qual usuário realizou qual operação).

### Soluções a Implementar

### A. Autenticação por Token JWT (Para Usuários / Frontend)
O padrão da indústria para comunicação Frontend $\leftrightarrow$ Backend.

1. **Instalar dependência:**
   ```bash
   npm install @fastify/jwt
   ```
2. **Definir chave secreta no `.env`:**
   ```env
   JWT_SECRET="sua_chave_secreta_super_longa_e_aleatoria"
   ```
3. **Fluxo de Login e Proteção das Rotas:**
   * Criar rota `/api/auth/login` que recebe e-mail/senha, valida com hash no banco e emite o token:
     ```javascript
     const token = fastify.jwt.sign({ id: usuario.id, email: usuario.email }, { expiresIn: "8h" });
     return { token };
     ```
   * Adicionar um hook no Fastify para exigir o token nas rotas privadas:
     ```javascript
     // Decorator para proteger rotas específicas ou grupo de rotas
     fastify.decorate("authenticate", async function (request, reply) {
         try {
             await request.jwtVerify();
         } catch (err) {
             reply.status(401).send({ error: "Acesso não autorizado. Token inválido ou expirado." });
         }
     });

     // Exemplo aplicando na rota de KPIs:
     fastify.get("/api/performance/kpis", { onRequest: [fastify.authenticate] }, async (request, reply) => {
         // Código da rota...
     });
     ```

---

### B. Autenticação por API Key (Para Integrações / Ferramentas Externas)
Caso sistemas externos ou automações (RPA, Webhooks) precisem chamar a API diretamente sem login de usuário:

1. Criar chaves únicas no banco ou no `.env`:
   ```env
   INTEGRATION_API_KEY="sonax_live_secret_..."
   ```
2. Exigir o cabeçalho `x-api-key`:
   ```javascript
   fastify.addHook("preHandler", async (request, reply) => {
       const apiKey = request.headers["x-api-key"];
       if (apiKey !== process.env.INTEGRATION_API_KEY) {
           return reply.status(403).send({ error: "Chave de API inválida." });
       }
   });
   ```

---

### C. Rate Limiting (Proteção contra Ataques de Força Bruta e Sobrecarga)
Para evitar que scripts no Postman ou ferramentas automatizadas façam milhares de requisições por segundo:

1. **Instalar dependência:**
   ```bash
   npm install @fastify/rate-limit
   ```
2. **Configurar limite global no Fastify:**
   ```javascript
   import rateLimit from "@fastify/rate-limit";

   await fastify.register(rateLimit, {
       max: 100, // Limite de 100 requisições
       timeWindow: "1 minute", // por minuto por endereço de IP
       errorResponseBuilder: () => ({
           statusCode: 429,
           error: "Too Many Requests",
           message: "Você atingiu o limite de requisições. Tente novamente em 1 minuto."
       })
   });
   ```

---

## Checklist de Prioridades Futuras

- [ ] Configurar lista de origens seguras no CORS com base na variável `NODE_ENV`.
- [ ] Criar tabela/modelo de usuários no Prisma com senhas criptografadas (usando `bcrypt` ou `argon2`).
- [ ] Instalar e configurar `@fastify/jwt` para emissão e validação de tokens de acesso.
- [ ] Proteger as rotas de negócio (`/api/performance/*`, etc.) com o hook de autenticação.
- [ ] Configurar `@fastify/rate-limit` para barrar ataques de força bruta.
- [ ] Validar corpo das requisições com `zod` para integridade dos dados recebidos.

