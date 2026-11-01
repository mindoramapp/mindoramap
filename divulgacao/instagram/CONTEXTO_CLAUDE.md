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

## Como produzir conteúdo novo

- **Carrossel de matéria** ("X em 1 mapa"): montar o mapa na conta demo, exportar PNG pelo menu
  ⋯ do editor (ou gravar com `gravar.mjs`), e montar os slides no Canva (1080×1350 ou 1080×1440).
- **Reels**: adaptar `ferramentas/gravar.mjs` (objeto `SCENES`) e `ferramentas/editar.sh`. A sessão
  da conta demo fica em `~/.cache/mindora-gravacao`; se expirar, o usuário entra de novo com
  `google-chrome --user-data-dir=$HOME/.cache/mindora-gravacao https://mindoramapp.github.io/#/login`
  e fecha a janela antes de gravar.
- Ganchos já pensados: "Leu e esqueceu?", "Seu resumo tem 10 páginas?", "Estude menos, lembre mais."

## Estado

- [x] Kit de lançamento pronto (vídeos, capas, post, legendas, foto, bio, passo a passo).
- [ ] Usuário criar o perfil e escolher o nome de usuário.
- [ ] Publicar os 6 a 9 primeiros posts antes de divulgar (tabela no passo a passo).
- [ ] Criar capas dos destaques no Canva.
- [ ] Reservar o mesmo nome no TikTok.

## Registro

- 01/11/2026: pasta criada com foto de perfil, post de apresentação, passo a passo, bio e este
  contexto.
