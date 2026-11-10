# Ritmo PAS

Um painel simples para organizar a preparação do PAS/UnB.

## O que já tem
- Cadastro e remoção de matérias.
- Cronômetro por matéria, com registro das sessões.
- Painel com horas totais, tempo do dia e gráfico semanal.
- Simulado geral ou filtrado por matéria, com quantidade configurável.
- Correção e explicação das questões de treino.
- Layout responsivo e manifesto PWA.

## Rodar localmente

\`\`\`bash
npm install
npm run dev
\`\`\`

Abra http://localhost:3000.

## Banco de dados
O projeto está conectado ao Neon Postgres pela integração da Vercel, com `DATABASE_URL` disponível em Preview e Production. A rota `/api/health/db` executa uma consulta real (`SELECT 1`) para verificar a conexão. As matérias e sessões do painel ainda ficam no armazenamento local do navegador: o banco está provisionado e conectado, mas a persistência dos dados de estudo no Postgres e a sincronização entre dispositivos ainda não foram implementadas.

## Questões do PAS
O banco `data/pas1-questoes.json` contém 335 itens objetivos extraídos dos cadernos oficiais do PAS 1 de 2023, 2024 e 2025, com gabaritos definitivos do Cebraspe. As questões estão classificadas por matéria e tópico no simulado.

Itens anulados, discursivos (tipo D) e de cálculo (tipo B) não entram no simulado. Alguns enunciados de interpretação dependem do texto-base do caderno original, que permanece disponível na biblioteca de fontes do app.

Fontes para cadernos e gabaritos:
- https://www.cebraspe.org.br/pas-unb/publicacoes/
- https://passeandounb.com/provas-anteriores-do-pas-1/
- https://ue.com.br/banco-de-questoes/pas-unb


## Acervo de provas PAS 1 (2009–2025)

O catálogo `data/pas1-acervo.json` reúne os 17 anos de provas e aponta para o acervo de cadernos/gabaritos e para o banco externo por ano.

**Atenção:** o catálogo cobre 2009–2025, mas o banco interno já importou apenas os itens objetivos de 2023, 2024 e 2025 (335 questões). O acervo externo da UE informa 8.879 questões do PAS/UnB de 2005 a 2025, mas a consulta automatizada ao conteúdo foi bloqueada (HTTP 403). Itens incompletos, anulados, discursivos (tipo D) e de cálculo (tipo B) não entram no simulado; cada questão preserva ano, etapa, idioma, tipo e gabarito oficial.

Fontes:
- https://passeandounb.com/provas-anteriores-do-pas-1/
- https://ue.com.br/banco-de-questoes/pas-unb
- https://www.cebraspe.org.br/pas-unb/publicacoes/
