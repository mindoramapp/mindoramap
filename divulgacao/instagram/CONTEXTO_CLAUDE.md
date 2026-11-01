# Contexto para o Claude: Instagram do Mindora

Leia este arquivo no início de qualquer conversa sobre o perfil do Mindora no Instagram. Ele
resume o que já existe, as regras e o que falta. Atualize o "Estado" e o "Registro" ao concluir
algo.

## Produto

- **Mindora**: editor de mapas mentais com modo de revisão espaçada (cada ramo vira um cartão).
  Grátis para começar (plano Free: 5 mapas, 2 pastas, 100 balões por mapa, exportação PNG/SVG).
  Navegador e celular (instalável). Site: https://mindoramapp.github.io
- Código: `/mnt/dados/projetos/mindoramap` (React + Supabase; deploy automático pela branch
  `main` do GitHub `mindoramapp/mindoramapp.github.io`).
- **Recursos reais que podem ser mostrados**: Tab/Enter criam ideias; Árvore e Grafo; Conectar;
  Organizar; Aparência (temas Padrão, Escuro, Pastel, Neon, Minimalista); modo Revisar (Espaço
  revela, 1-2-3 avaliam, domínio em %); submapas; pastas e favoritos; exportação; salva sozinho;
  "Esqueci minha senha"; cadastro aberto (só confirmar o e-mail).

## Regras da comunicação

- Público principal: **estudantes** (Enem, vestibular, concurso, faculdade). Tom direto e jovem,
  sem gíria forçada.
- **Nunca** prometer IA, colaboração, números de desempenho ou recursos que o app não tem.
- Prints e vídeos só da **conta demo** (`nunesnbnxn+demo@gmail.com`), nunca da conta pessoal.
- 80% conteúdo útil de estudo feito no Mindora, 20% sobre o app.
- Música: só áudio escolhido na própria rede (não baixar faixas de terceiros).
- O Claude não cria contas, não digita senhas e não posta: prepara o material e o usuário publica.
- Identidade: gradiente `#3177DC` → `#00B1C4`, fundo `#06090F`, texto branco, Noto Sans Bold.

## Onde está cada coisa

| O quê | Onde |
|---|---|
| Estratégia (pilares, fases, técnicas, limites éticos, preços do dia) | `instagram/ESTRATEGIA.md` |
| Calendário de 8 semanas (24 posts) | `instagram/CALENDARIO.md` |
| Um post por pasta: `BRIEFING.md`, `legenda.txt`, `midia/` | `instagram/posts/SNN_PNN_slug/` |
| Gerador das pastas e do calendário | `ferramentas/gerar_posts_instagram.py` (não sobrescreve briefings; o calendário lê o "Status:") |
| Passo a passo do perfil | `instagram/PASSO_A_PASSO.md` |
| Bio, nomes, destaques | `instagram/BIO.md` |
| Foto de perfil (1080×1080, gradiente até a borda) | `instagram/foto_perfil.png` (fonte: `ferramentas/cenas/foto_perfil.svg`) |
| Post de apresentação (1080×1440) | `instagram/post_01_apresentacao.png`; design no Canva: https://canva.link/ktl6ykrlnz26tql |
| Vídeos 9:16, 4:5, 16:9 e capas | `video/` |
| Legendas por rede | `04_LEGENDAS.md` e `legendas/*.srt` |
| Brief, roteiro, efeitos | `01_PROMPT.md`, `02_ROTEIRO.md`, `03_EFEITOS.md` |
| Regravar ou reeditar vídeos | `00_PLANO_DE_ACAO.md`, seção "Como refazer" |

(Caminhos relativos a `/mnt/dados/projetos/mindoramap/divulgacao/`. Imagens e vídeos ficam fora
do Git; os textos estão versionados.)

**Google Drive:** a pasta é espelhada, legível, em `Meu Drive/Mindora/divulgacao` por
`ferramentas/subir-drive.sh` (sentido único HD → Drive; `brutos/` fica de fora; o que muda vai
para `Mindora/_versoes/<data>`). Rodar o script depois de cada mudança. Não editar arquivos pelo
Drive: a próxima sincronização os substitui.

## Como produzir conteúdo novo

- **Carrossel de matéria** ("X em 1 mapa"): montar o mapa na conta demo, exportar PNG pelo menu
  ⋯ do editor (ou gravar com `gravar.mjs`), e montar os slides no Canva (1080×1350 ou 1080×1440).
- **Reels**: adaptar `ferramentas/gravar.mjs` (objeto `SCENES`) e `ferramentas/editar.sh`. A sessão
  da conta demo fica em `~/.cache/mindora-gravacao`; se expirar, o usuário entra de novo com
  `google-chrome --user-data-dir=$HOME/.cache/mindora-gravacao https://mindoramapp.github.io/#/login`
  e fecha a janela antes de gravar.
- Ganchos já pensados: "Leu e esqueceu?", "Seu resumo tem 10 páginas?", "Estude menos, lembre mais."

## Rotina semanal (sexta)

1. Atualizar "Status" e métricas nos briefings da semana.
2. `python3 divulgacao/ferramentas/gerar_posts_instagram.py` (refaz o calendário).
3. `divulgacao/ferramentas/subir-drive.sh` (atualiza o Drive).
4. Semanas 4 e 8: repetir o formato dos 2 posts com mais salvamentos; depois da semana 8,
   planejar as semanas 9–16 acrescentando posts ao gerador.

## Estado

- [x] Kit de lançamento pronto (vídeos, capas, post, legendas, foto, bio, passo a passo).
- [x] Estratégia, calendário (09/11/2026 a 15/01/2027, pausa de festas) e 24 briefings prontos.
- [ ] Usuário criar o perfil e escolher o nome de usuário (`@mindora.app` ocupado; sugerido `@mindoramapp`).
- [ ] Publicar os 6 a 9 primeiros posts antes de divulgar (tabela no passo a passo).
- [ ] Criar capas dos destaques no Canva.
- [ ] Reservar o mesmo nome no TikTok.

## Registro

- 01/11/2026: pasta criada com foto de perfil, post de apresentação, passo a passo, bio e este
  contexto. `@mindora.app` estava ocupado; sugerido `@mindoramapp`. Nome do perfil tem limite
  de 30 caracteres. Espelho no Google Drive criado e conferido (27 arquivos).
