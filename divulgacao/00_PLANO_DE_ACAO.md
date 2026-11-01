# Plano de ação: vídeo e posts de divulgação do Mindora

Criado em 01/11/2026. Tudo o que é texto fica versionado; vídeos, imagens e gravações brutas ficam
nesta pasta, mas fora do Git (ver `.gitignore` da raiz).

## Objetivo

Atrair **estudantes** (Enem, vestibular, concurso, faculdade) para criar uma conta grátis no
Mindora, mostrando o produto real em uso: montar um mapa em segundos e transformá-lo em cartões
de revisão.

## Decisões já tomadas

| Tema | Decisão |
|---|---|
| Público | Estudantes; LinkedIn com tom para quem estuda e trabalha |
| Formatos | 9:16 (Reels, TikTok, Shorts, Status), 4:5 (feed Instagram/LinkedIn), 16:9 (YouTube) |
| Imagens | Gravadas do app real, numa **conta de demonstração** (sem dados pessoais) |
| Som | Sem locução; texto na tela. Música: áudio em alta escolhido na hora de postar (direitos) |
| Promessas | Só recursos reais. Nada de "IA" nem números inventados |
| Post estático | Feito no Canva, exportado em PNG para `canva/` |

## Etapas

1. **Brief** (`01_PROMPT.md`): o pedido completo, reutilizável para próximas campanhas.
2. **Roteiro** (`02_ROTEIRO.md`): cenas, tempos, texto na tela e o que é gravado em cada uma.
3. **Efeitos** (`03_EFEITOS.md`): tipografia, cores, transições, zooms, cursor e ritmo.
4. **Legendas** (`04_LEGENDAS.md` e `legendas/*.srt`): textos dos posts por rede e legendas do vídeo.
5. **Conta demo**: o usuário cria a conta e entra num Chrome separado só para a gravação
   (perfil em `~/.cache/mindora-gravacao`, fora do projeto, porque guarda a sessão). O Claude não
   digita senhas.
6. **Mapa de exemplo**: "Fotossíntese" (tema do Enem), montado pelo script de gravação.
7. **Gravação** (`ferramentas/gravar.mjs`): Chrome sem interface, comandado pelo protocolo de
   depuração; captura em 1080×1920 (vertical) e 1920×1080 (horizontal). Brutos em `brutos/`.
8. **Edição** (`ferramentas/editar.sh`): ffmpeg monta as cenas, textos, transições e a tela final.
   Saídas em `video/`: `mindora_9x16.mp4`, `mindora_4x5.mp4`, `mindora_16x9.mp4`, mais capas.
9. **Canva**: post retrato com a frase principal e o mapa de exemplo; exportado em PNG para `canva/post_instagram_3x4.png` (1080×1440, o retrato atual do Instagram). Design editável: https://canva.link/ktl6ykrlnz26tql
10. **Revisão**: assistir os três cortes, conferir legibilidade no celular, tamanho dos arquivos
    (Instagram aceita até 4 GB; mirar < 30 MB), e apagar a conta demo se não for reaproveitada.

## Estrutura

```
divulgacao/
├── 00_PLANO_DE_ACAO.md   este arquivo
├── 01_PROMPT.md          brief da campanha
├── 02_ROTEIRO.md         cenas e tempos
├── 03_EFEITOS.md         guia de edição
├── 04_LEGENDAS.md        textos dos posts por rede
├── legendas/             .srt do vídeo (pt-BR)
├── ferramentas/          scripts de gravação e edição
├── brutos/               gravações cruas (fora do Git)
├── video/                vídeos finais e capas (fora do Git)
└── canva/                post exportado do Canva (fora do Git)
```

## Riscos e cuidados

- **Sessão da conta demo**: o perfil do Chrome de gravação guarda o login; fica fora do projeto e
  pode ser apagado no fim (`rm -r ~/.cache/mindora-gravacao`).
- **Máquina com 8 GB**: gravar e codificar um formato por vez.
- **Música**: não incluir faixa de terceiros no arquivo; o corte foi pensado para batidas de
  ~120 BPM (cortes a cada 1 s ou 2 s) e encaixa em áudios populares.
