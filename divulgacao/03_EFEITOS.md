# Guia de efeitos e edição

Tudo é feito com ffmpeg a partir das gravações em `brutos/` (script `ferramentas/editar.sh`), para
poder refazer qualquer corte sem editor de vídeo.

## Identidade

| Item | Valor |
|---|---|
| Gradiente da marca | `#3177DC` → `#00B1C4` (135°), o mesmo `--gradient-hero` do app |
| Fundo das telas de texto | `#06090F` com o gradiente a 25% |
| Texto | Branco, Noto Sans Bold; título 88 px (9:16), 72 px (4:5), 64 px (16:9) |
| Faixa do texto | Retângulo `#06090F` a 70%, cantos arredondados, margem de 28 px |
| Tema do app nas gravações | Escuro (mais contraste no celular) e uma cena no claro |

## Movimento

- **Zoom lento ("Ken Burns")** em todas as cenas gravadas: 100% → 106% ao longo da cena, para o
  vídeo nunca ficar parado.
- **Zoom de destaque** nas ações principais (balão novo, cartão de revisão): 1,0 → 1,25 em 0,4 s
  com desaceleração, centralizado no ponto da ação.
- **Aceleração:** a digitação e a criação de ramos rodam a 2× (`setpts=0.5*PTS`).
- **Cursor:** o Chrome sem interface não desenha o mouse; a gravação injeta um círculo azul
  semitransparente que segue o ponteiro e um anel que se expande a cada clique.

## Transições

- Corte seco na batida como padrão.
- `xfade` **slideup** de 0,3 s entre "problema" (cena 1) e "solução" (cena 2).
- `xfade` **fade** de 0,4 s para a tela final.

## Texto na tela

- Entrada: surge com opacidade 0 → 1 em 0,15 s e sobe 20 px.
- Uma ideia por cartela; palavra-chave em ciano `#00B1C4` quando couber.
- Sempre dentro da área segura (ver roteiro).

## Elementos extras

- **Barra de progresso** fina no topo (gradiente da marca), útil para retenção.
- **Moldura de celular** desenhada em ffmpeg (retângulo arredondado escuro com a gravação móvel
  dentro) na cena 8.
- **Tela final** com logo (`public/icon-512.png`), nome, "Crie sua conta grátis" e o endereço.

## Exportação

| Formato | Resolução | Codec | Taxa |
|---|---|---|---|
| 9:16 | 1080×1920, 30 fps | H.264 High, yuv420p, `+faststart` | CRF 20 |
| 4:5 | 1080×1350, 30 fps | idem | CRF 20 |
| 16:9 | 1920×1080, 30 fps | idem | CRF 20 |

Áudio: faixa silenciosa AAC (algumas redes recusam vídeo sem áudio); a música entra na hora de
postar.
