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
O projeto está preparado para usar Neon Postgres via `@neondatabase/serverless`. A conexão exige `DATABASE_URL`. O protótipo atual guarda matérias e sessões no armazenamento local do navegador; ainda não existe conta de usuário nem sincronização entre dispositivos. Não configurei conexão fictícia.

## Questões do PAS
A base inicial contém itens autorais de treino, identificados como demonstrativos. Os cadernos e gabaritos oficiais estão ligados na biblioteca do app. A importação integral dos itens precisa de extração e conferência dos PDFs oficiais, classificação por matéria e revisão de gabaritos; não marquei questões autorais como oficiais.

Fontes para cadernos e gabaritos:
- https://www.cebraspe.org.br/pas-unb/publicacoes/
- https://passeandounb.com/provas-anteriores-do-pas-1/
- https://ue.com.br/banco-de-questoes/pas-unb
