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
A base inicial contém itens autorais de treino, identificados como demonstrativos. Os cadernos e gabaritos oficiais estão ligados na biblioteca do app. A importação integral dos itens precisa de extração e conferência dos PDFs oficiais, classificação por matéria e revisão de gabaritos; não marquei questões autorais como oficiais.

Fontes para cadernos e gabaritos:
- https://www.cebraspe.org.br/pas-unb/publicacoes/
- https://passeandounb.com/provas-anteriores-do-pas-1/
- https://ue.com.br/banco-de-questoes/pas-unb


## Acervo de provas PAS 1 (2009–2025)

O catálogo `data/pas1-acervo.json` reúne os 17 anos de provas e aponta para o acervo de cadernos/gabaritos e para o banco externo por ano.

**Atenção:** catálogo de fontes não significa que os enunciados estejam importados para a tabela de questões. O acervo externo da UE informa 8.879 questões do PAS/UnB de 2005 a 2025, mas a consulta automatizada ao conteúdo foi bloqueada (HTTP 403). Por isso, não copiamos itens incompletos nem inventamos enunciados/gabaritos. O banco interno só deve receber questões integrais após extração e conferência do caderno e do gabarito definitivo, preservando a identificação do ano, etapa, idioma, tipo de item e eventual anulação.

Fontes:
- https://passeandounb.com/provas-anteriores-do-pas-1/
- https://ue.com.br/banco-de-questoes/pas-unb
- https://www.cebraspe.org.br/pas-unb/publicacoes/
