#!/usr/bin/env python3
"""Gera divulgacao/instagram/posts/<semana>_<post>/ e divulgacao/instagram/CALENDARIO.md.

Cada post ganha BRIEFING.md (objetivo, técnica, roteiro, legenda, checklist), legenda.txt (pronta
para colar) e midia/ (imagens e vídeos do post, fora do Git). Um briefing já existente NÃO é
sobrescrito: editar à mão é seguro. O calendário é sempre refeito e lê a linha "Status:" de cada
briefing.

Uso: python3 divulgacao/ferramentas/gerar_posts_instagram.py [AAAA-MM-DD do 1º post, segunda]
"""
import datetime as dt
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "instagram"
POSTS = BASE / "posts"
INICIO = dt.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else dt.date(2026, 11, 9)
DIAS = {"seg": 0, "qua": 2, "sex": 4}
LINK = "Link na bio 🔗"
PLANOS = (
    "⚠️ Conferir a página Planos no dia: em 01/11/2026 eram Free (5 mapas, 100 balões, revisão "
    "em 1 mapa), Estudante R$ 9,90/mês ou R$ 49,90/semestre (30 mapas, 300 balões, revisão sem "
    "limite) e Pro R$ 19,90/mês (mapas ilimitados, 1.000 balões). Pagamento por Pix."
)

HASHTAGS = {
    "estudo": "#dicasdeestudo #estudos #studygram #mapamental #revisao #comoestudar",
    "enem": "#enem #enem2027 #vestibular #vestibulando #dicasdeestudo #mapamental",
    "concurso": "#concurso #concurseiro #concursopublico #estudos #mapamental #revisao",
    "app": "#mindora #appdeestudos #mapamental #estudos #produtividade #studygram",
}

FASES = {1: "Atrair", 2: "Atrair", 3: "Ensinar", 4: "Ensinar",
         5: "Provar", 6: "Provar", 7: "Converter", 8: "Converter"}

# (semana, dia, formato, pilar, técnica, slug, título, objetivo, gancho, estrutura, legenda, cta,
#  hashtags, material, observação)
P = [
    (1, "seg", "Reels", "D", "PAS", "leu-e-esqueceu", "Leu e esqueceu?",
     "Apresentar o problema e o app em 36 s.", "Leu e esqueceu?",
     ["Vídeo pronto: resumo desfocando → mapa nascendo → Organizar → Conectar → Revisar → celular → tela final."],
     "Leu, grifou… e esqueceu na prova? 😅\n\nNo Mindora você transforma o conteúdo em mapa mental em minutos e revisa com cartões que te lembram na hora certa.\n\n✅ Tab cria uma ideia, Enter cria outra\n✅ Cada ramo vira um cartão de revisão\n✅ No celular e no PC, salva sozinho\n\nÉ grátis para começar.",
     "Salva este post e testa na próxima matéria. " + LINK, "app",
     "../../video/mindora_9x16.mp4 + capa ../../video/capa_9x16.jpg", "Fixar no perfil. Escolher áudio em alta."),
    (1, "qua", "Foto", "D", "Proposta de valor", "apresentacao", "O que é o Mindora",
     "Explicar em uma imagem o que o app faz.", "Transforme o resumo em mapa mental",
     ["Imagem pronta do Canva (post_01_apresentacao.png)."],
     "Mapa mental + revisão espaçada no mesmo app. 🧠\n\nVocê monta o conteúdo em ramos e o Mindora transforma cada ramo em um cartão para revisar. Sem papel, sem perder o resumo, no celular ou no computador.",
     "Comenta qual matéria você transformaria em mapa primeiro 👇", "app",
     "../post_01_apresentacao.png", ""),
    (1, "sex", "Carrossel", "P", "Autoridade", "curva-do-esquecimento", "Por que você esquece o que estuda",
     "Ganhar autoridade com ciência explicada simples.", "Por que você esquece o que estudou ontem?",
     ["1. Capa: 'Por que você esquece o que estudou ontem?'",
      "2. A curva do esquecimento (Ebbinghaus, 1885): a memória cai rápido nos primeiros dias.",
      "3. Gráfico simples da curva caindo e 'subindo' a cada revisão.",
      "4. A saída: revisar em intervalos crescentes (1, 3, 7, 15 dias).",
      "5. O difícil é lembrar QUANDO revisar.",
      "6. O modo Revisar do Mindora calcula isso para você (print da revisão).",
      "7. CTA: salve para lembrar."],
     "A culpa não é sua: o cérebro esquece rápido o que não é revisado. 📉\n\nA boa notícia é que poucas revisões, nos dias certos, mudam tudo. Arrasta para entender a curva do esquecimento e como usar a revisão espaçada a seu favor.",
     "Salva para lembrar da próxima vez que for estudar 📌", "estudo",
     "Canva (7 slides) + print do modo Revisar da conta demo",
     "Não citar porcentagens exatas como verdade absoluta; dizer 'boa parte' e citar Ebbinghaus."),
    (2, "seg", "Carrossel", "E", "Lista passo a passo", "mapa-em-5-passos", "Mapa mental em 5 passos",
     "Ensinar o método (reciprocidade) e mostrar o app de leve.", "Mapa mental do jeito certo",
     ["1. Capa: 'Mapa mental em 5 passos (do jeito que funciona)'",
      "2. Passo 1: uma ideia central curta.",
      "3. Passo 2: 3 a 6 ramos principais (os tópicos da matéria).",
      "4. Passo 3: palavras-chave, não frases.",
      "5. Passo 4: ligue ramos que conversam entre si.",
      "6. Passo 5: revise o mapa, não releia o resumo.",
      "7. No Mindora: Tab e Enter para criar, Conectar para ligar, Revisar para revisar.",
      "8. CTA."],
     "Mapa mental não é desenhar bonito: é organizar o raciocínio. 🧩\n\nEsses 5 passos funcionam no caderno e ficam ainda mais rápidos no Mindora.",
     "Salva e manda para quem estuda com você 📌", "estudo",
     "Canva (8 slides) + 2 prints da conta demo", ""),
    (2, "qua", "Reels", "D", "Gancho de curiosidade", "resumo-de-10-paginas", "Seu resumo tem 10 páginas?",
     "Testar o gancho B com o mesmo vídeo.", "Seu resumo tem 10 páginas?",
     ["Mesmo vídeo com outra cartela inicial: ferramentas/editar.sh 9x16 B."],
     "Se o resumo é maior que a matéria, alguma coisa está errada. 😬\n\nUm mapa cabe numa tela, e cada ramo vira um cartão de revisão.",
     LINK, "enem",
     "../../video/mindora_9x16_ganchoB.mp4 (gerar com editar.sh 9x16 B)",
     "Comparar o alcance dos 3 primeiros segundos com o post 1 (teste A/B)."),
    (2, "sex", "Reels", "R", "Storytelling", "por-que-criei", "Por que o Mindora existe",
     "Criar conexão humana com quem fez o app.", "Eu criei um app porque esquecia tudo",
     ["Gravação sua (rosto ou só voz + tela), 30–45 s:",
      "- O problema que você viveu estudando.",
      "- O que tentou (resumos, flashcards soltos).",
      "- A ideia: mapa + revisão no mesmo lugar.",
      "- Convite: 'testa e me conta o que falta'."],
     "Esse app nasceu de uma frustração bem conhecida de quem estuda. 💬\n\nConta aqui embaixo: qual é a sua maior dificuldade para revisar?",
     "Comenta a sua dificuldade 👇 eu leio todas", "app",
     "Gravar no celular (vertical). Telas da conta demo como apoio.",
     "Opcional: se não quiser aparecer, usar só voz sobre a tela."),
    (3, "seg", "Carrossel", "E", "Reciprocidade (isca)", "fotossintese-em-1-mapa", "Fotossíntese em 1 mapa",
     "Entregar conteúdo de Enem pronto e gerar comentários.", "Fotossíntese inteira em 1 mapa",
     ["1. Capa: 'Fotossíntese inteira em 1 mapa'",
      "2–6. Um ramo por slide (O que é, Onde acontece, Fases, Equação, Fatores).",
      "7. O mapa completo.",
      "8. 'Quer o arquivo? Comenta MAPA que eu te mando' (JSON importável no Mindora)."],
     "Biologia do Enem num mapa só. 🌱\n\nComenta MAPA que eu te mando o arquivo para importar no Mindora e revisar com cartões.",
     "Comenta MAPA 👇", "enem",
     "Prints do mapa 'Fotossíntese (Enem)' da conta demo + ferramentas/mapa-fotossintese.json",
     "Responder os comentários por mensagem direta com o arquivo JSON (exportar pelo menu ⋯ → Mindora JSON)."),
    (3, "qua", "Reels", "D", "Demonstração", "revisao-em-20s", "Revisão espaçada em 20 segundos",
     "Mostrar o diferencial (modo Revisar).", "Seu mapa vira cartão de revisão",
     ["Recorte da cena 7 do vídeo + 2 cartões a mais: Espaço revela, 1-2-3 avaliam, domínio em %."],
     "O mapa que você monta vira cartão de revisão automaticamente. 🔁\n\nEspaço mostra a resposta, 1, 2 ou 3 dizem o quanto você lembrou, e o app decide quando você revisa de novo.",
     LINK, "estudo",
     "Gravar com gravar.mjs (cena c7_revisar) ou recortar ../../video/mindora_9x16.mp4 (21 s a 28 s)", ""),
    (3, "sex", "Foto + enquete", "R", "Co-criação", "enquete-proxima-materia", "Qual matéria vira mapa?",
     "Engajar e decidir o conteúdo do post 12.", "Você escolhe o próximo mapa",
     ["Imagem simples: 'Qual matéria vira o próximo mapa?' com 4 opções.",
      "Nos stories: enquete com 2 opções por vez durante 2 dias."],
     "Vocês escolhem: qual matéria vira o próximo mapa pronto? 🗳️\n\nComenta a matéria e o assunto (ex.: História, Revolução Francesa).",
     "Comenta a matéria 👇", "enem", "Canva (1 imagem) + enquete nos stories", ""),
    (4, "seg", "Carrossel", "E", "Erros comuns", "3-erros-mapa-mental", "3 erros ao fazer mapa mental",
     "Gerar salvamentos com conteúdo prático.", "Você comete o erro nº 2?",
     ["1. Capa: '3 erros que deixam seu mapa mental inútil'",
      "2. Erro 1: copiar frases inteiras.",
      "3. Erro 2: fazer o mapa e nunca mais olhar.",
      "4. Erro 3: um mapa gigante para a matéria toda.",
      "5. Como corrigir cada um (palavras-chave, revisão, submapas).",
      "6. No Mindora: submapas e modo Revisar (prints).",
      "7. CTA."],
     "Mapa mental mal feito vira só mais um resumo esquecido. 🚫\n\nArrasta e vê se você comete algum desses erros.",
     "Salva e confere no próximo mapa 📌", "estudo", "Canva (7 slides) + prints", ""),
    (4, "qua", "Reels", "D", "Antes e depois", "caderno-vs-mapa", "Caderno × mapa",
     "Mostrar a transformação de forma visual.", "Antes / depois",
     ["Tela dividida: 3 s de página de caderno lotada (ou o resumo da cena 1) → corte → mapa organizado no Mindora."],
     "Antes: 4 páginas. Depois: 1 mapa que vira revisão. ✨",
     LINK, "enem", "Cena c1_resumo + c4_organizar (brutos/9x16) montadas em 10–15 s", ""),
    (4, "sex", "Carrossel", "E", "Entrega da enquete", "mapa-escolhido", "O mapa que vocês escolheram",
     "Cumprir a promessa do post 9 (coerência gera confiança).", "Vocês pediram, tá aqui",
     ["Mapa da matéria mais votada no post 9, por ramos, como no post 7.",
      "Último slide: 'Comenta MAPA para receber o arquivo'."],
     "Vocês pediram e o mapa saiu. 🙌\n\nComenta MAPA que eu mando o arquivo para importar no Mindora.",
     "Comenta MAPA 👇", "enem", "Montar o mapa na conta demo + prints", "Matéria definida pela enquete do post 9."),
    (5, "seg", "Carrossel", "E", "Guia prático", "cronograma-em-mapa", "Cronograma da semana em mapa",
     "Mostrar outro uso do app (planejamento).", "Planeje a semana em 5 minutos",
     ["1. Capa: 'Seu cronograma da semana em 1 mapa'",
      "2. Ideia central: Semana.",
      "3. Ramos: dias; sub-ramos: matérias.",
      "4. Tipo Tarefa (checklist) para marcar o que já fez.",
      "5. Print do mapa pronto no Mindora (modelo Projeto).",
      "6. CTA."],
     "Mapa mental também serve para planejar, não só para revisar. 🗓️\n\nUsa o modelo Projeto do Mindora e marca as tarefas como feitas.",
     "Salva para montar o seu no domingo 📌", "concurso", "Mapa 'Minha semana' na conta demo (modelo Projeto) + Canva", ""),
    (5, "qua", "Reels", "D", "Contexto de uso", "estude-no-onibus", "Estude no ônibus",
     "Mostrar que funciona no celular (objeção comum).", "Revisão no ônibus? Dá.",
     ["Gravação real no celular (instalado como app): abrir, revisar 2 cartões, fechar. 15–20 s."],
     "15 minutos de ônibus viram uma revisão inteira. 🚌\n\nO Mindora instala no celular como app e salva sozinho.",
     LINK, "concurso", "Gravar a tela do celular (conta demo) ou usar a cena c8_celular", ""),
    (5, "sex", "Carrossel", "C", "Quebra de objeção", "perguntas-frequentes", "Perguntas frequentes",
     "Tirar as dúvidas que impedem o cadastro.", "É grátis mesmo?",
     ["1. 'É grátis mesmo?' Sim: plano Free sem cartão.",
      "2. 'Funciona no celular?' Sim, e instala como app.",
      "3. 'E sem internet?' Abre sem internet; as alterações ficam no aparelho e sobem quando a conexão volta.",
      "4. 'Perco meus mapas?' Não: ficam salvos na sua conta.",
      "5. 'Como pago se quiser mais?' Por Pix, sem cartão.",
      "6. CTA."],
     "As perguntas que mais chegam por aqui, respondidas. ❓",
     "Ficou alguma dúvida? Comenta 👇 " + LINK, "app", "Canva (6 slides)", PLANOS),
    (6, "seg", "Reels", "R", "Compromisso e coerência", "desafio-7-dias", "Desafio 7 dias de revisão",
     "Anunciar um desafio com começo e fim (urgência real).", "7 dias, 10 minutos por dia",
     ["Convite: 1 mapa no dia 1, revisar 10 min por dia até o dia 7.",
      "Regras simples na tela; datas reais de início e fim.",
      "Quem participar posta nos stories e marca o perfil."],
     "Desafio: 7 dias revisando 10 minutos por dia. ⏱️\n\nComeça segunda e termina domingo. Monta um mapa no dia 1 e deixa o modo Revisar te guiar.",
     "Comenta EU TOPO 👇 e marca quem vai com você", "estudo", "Gravação de tela + cartelas no Canva",
     "Definir as datas reais antes de postar. Stories diários do desafio na semana."),
    (6, "qua", "Reels", "D", "Satisfação visual", "do-caos-a-arvore", "Do caos à árvore",
     "Vídeo curto e hipnótico, feito para compartilhar.", "Olha isso se organizando",
     ["Só a cena Organizar: mapa bagunçado → um clique → árvore alinhada. 6–8 s, em loop."],
     "Um clique e o mapa se organiza sozinho. 😌", LINK, "app",
     "brutos/9x16/c4_organizar.mp4 (editar como loop curto)", ""),
    (6, "sex", "Stories + post", "P", "Prova (progresso real)", "desafio-meio", "Desafio: dia 5",
     "Mostrar progresso real dos participantes (com permissão).", "Como está o seu desafio?",
     ["Repost dos stories de quem marcou o perfil (com permissão).",
      "Seu próprio progresso: domínio do mapa em % no modo Revisar."],
     "Dia 5 do desafio e o domínio do mapa já subiu. 📈\n\nMostra o seu nos stories e me marca.",
     "Marca o perfil nos stories 👇", "estudo", "Prints reais do modo Revisar + reposts autorizados",
     "Só números e falas reais. Pedir permissão antes de repostar."),
    (7, "seg", "Carrossel", "C", "Ancoragem de preço", "free-estudante-pro", "Free, Estudante ou Pro?",
     "Apresentar os planos de forma clara.", "Qual plano é o seu?",
     ["1. Capa: 'Qual plano do Mindora é o seu?'",
      "2. Free: para conhecer (limites reais).",
      "3. Estudante: para quem estuda todo dia (preço mensal e semestral).",
      "4. Pro: para quem tem muito conteúdo.",
      "5. 'Menos que um lanche por mês' (ancoragem).",
      "6. Pagamento por Pix, sem cartão.",
      "7. CTA."],
     "Comece grátis e só mude de plano quando precisar de mais. 💡",
     "Veja os planos: " + LINK, "app", "Canva (7 slides) + print da página Planos", PLANOS),
    (7, "qua", "Reels", "C", "Benefício concreto", "o-que-muda-no-estudante", "O que muda no plano Estudante",
     "Mostrar o ganho real de assinar.", "Quando o Free fica pequeno",
     ["Tela: aviso de limite do Free → página Planos → mais mapas e revisão em todos os mapas.",
      "Encerrar com o preço real do dia."],
     "Quando os seus mapas não cabem mais no Free, o plano Estudante libera mais mapas e revisão em todos eles. 📚",
     LINK, "enem", "Gravação de tela da página Planos (conta demo)", PLANOS),
    (7, "sex", "Carrossel", "P", "Prova social", "resultado-do-desafio", "Resultado do desafio",
     "Fechar o desafio com resultados reais.", "O que mudou em 7 dias",
     ["Números reais do desafio (participantes, mapas criados, se houver).",
      "2 ou 3 depoimentos reais com permissão por escrito.",
      "Convite para o próximo desafio."],
     "O desafio acabou e os resultados foram de vocês. 🙌",
     "Quer o próximo? Comenta EU 👇", "estudo", "Depoimentos autorizados + prints reais",
     "Se não houver depoimentos suficientes, trocar por 'bastidores do desafio'. Nunca inventar."),
    (8, "seg", "Carrossel", "E", "Conteúdo sazonal", "plano-de-estudos-2027", "Plano de estudos para 2027",
     "Aproveitar o fim de ano (planejamento) e reforçar o app.", "2027 começa agora",
     ["1. Capa: 'Seu plano de estudos para 2027 em 1 mapa'",
      "2. Meta (Enem, concurso, faculdade).",
      "3. Matérias por prioridade.",
      "4. Rotina semanal realista.",
      "5. Revisão espaçada como hábito.",
      "6. Modelo pronto no Mindora (print).",
      "7. CTA."],
     "Quem planeja agora começa o ano na frente. 🎯",
     "Salva e monta o seu 📌", "enem", "Canva (7 slides) + mapa 'Plano 2027' na conta demo", ""),
    (8, "qua", "Reels", "C", "Redução de atrito", "pix-em-1-minuto", "Assinar com Pix em 1 minuto",
     "Mostrar que pagar é simples e seguro.", "Sem cartão, só Pix",
     ["Tela: Planos → escolher → QR Code/Pix copia e cola → 'Já paguei' → confirmação.",
      "Avisar que a confirmação é manual (pode levar algumas horas)."],
     "Sem cartão de crédito: o Mindora aceita Pix. 💸\n\nEscolhe o plano, paga pelo QR Code e pronto.",
     LINK, "app", "Gravação de tela (conta demo, sem concluir pagamento)",
     PLANOS + " Não mostrar a chave Pix real nem dados do recebedor."),
    (8, "sex", "Reels", "C", "Recapitulação + CTA forte", "tudo-que-o-mindora-faz", "Tudo que o Mindora faz",
     "Fechar o ciclo com uma oferta clara.", "Em 30 segundos, tudo que ele faz",
     ["Montagem rápida dos melhores trechos: criar, organizar, conectar, temas, revisar, celular.",
      "Tela final: 'Comece grátis hoje'."],
     "Mapa mental, revisão espaçada, celular e PC, e grátis para começar. Tudo num lugar só. 🧠",
     "Comece hoje: " + LINK, "app", "../../video/mindora_9x16.mp4 reeditado (versão rápida)",
     "Depois desta semana: revisar as métricas e montar o calendário das semanas 9–16."),
]

PILAR = {"E": "Educativo", "D": "Demonstração", "P": "Prova / autoridade",
         "C": "Conversão", "R": "Relacionamento"}


# Weeks 7-8 (the sales weeks) skip the Christmas / New Year fortnight, when reach drops; January
# (goals, planning, new semester) is a better time to sell. Only stories during the break.
PAUSA_SEMANAS = 2


def data_do(semana: int, dia: str) -> dt.date:
    extra = PAUSA_SEMANAS if semana >= 7 else 0
    return INICIO + dt.timedelta(weeks=semana - 1 + extra, days=DIAS[dia])


def status_atual(pasta: Path) -> str:
    briefing = pasta / "BRIEFING.md"
    if briefing.exists():
        achado = re.search(r"^\*\*Status:\*\* (.+)$", briefing.read_text(encoding="utf-8"), re.M)
        if achado:
            return achado.group(1).strip()
    return "a produzir"


linhas_cal = []
for n, (sem, dia, formato, pilar, tecnica, slug, titulo, objetivo, gancho, estrutura, legenda,
        cta, tags, material, obs) in enumerate(P, start=1):
    pasta = POSTS / f"S{sem:02d}_P{n:02d}_{slug}"
    (pasta / "midia").mkdir(parents=True, exist_ok=True)
    data = data_do(sem, dia)
    legenda_completa = f"{legenda}\n\n{cta}\n\n{HASHTAGS[tags]}"

    briefing = pasta / "BRIEFING.md"
    if not briefing.exists():
        corpo = "\n".join(f"- {item}" if not item[:2].rstrip(".").isdigit() and not item.startswith("-") else item
                          for item in estrutura)
        briefing.write_text(f"""# Post {n:02d}: {titulo}

**Status:** a produzir
**Data sugerida:** {data.strftime('%d/%m/%Y')} ({dia}), 19h–21h
**Semana {sem}** · fase **{FASES[sem]}** · pilar **{PILAR[pilar]}** · formato **{formato}**
**Técnica principal:** {tecnica}

## Objetivo
{objetivo}

## Gancho (primeira frase / primeiro segundo)
{gancho}

## Estrutura
{corpo}

## Material
{material}
Arquivos do post: pasta `midia/` (fora do Git, mas vai para o Drive).

## Legenda
Pronta para colar em `legenda.txt`.

## Checklist
- [ ] Material produzido e salvo em `midia/`
- [ ] Legenda revisada (sem promessas que o app não cumpre)
- [ ] Capa / primeira imagem chama atenção no feed
- [ ] Publicado (mudar o Status para "publicado em DD/MM")
- [ ] Stories do dia repostando o post
- [ ] Métricas após 7 dias: alcance __ · salvamentos __ · compartilhamentos __ · cliques no link __
""" + (f"\n## Observações\n{obs}\n" if obs else ""), encoding="utf-8")
        (pasta / "legenda.txt").write_text(legenda_completa + "\n", encoding="utf-8")

    rel = pasta.relative_to(BASE)
    linhas_cal.append(
        f"| {n:02d} | {data.strftime('%d/%m')} {dia} | {sem} · {FASES[sem]} | {formato} | "
        f"{PILAR[pilar]} | {tecnica} | [{titulo}]({rel.as_posix()}/BRIEFING.md) | {status_atual(pasta)} |"
    )

contagem = {k: sum(1 for p in P if p[3] == k) for k in PILAR}
(BASE / "CALENDARIO.md").write_text(f"""# Calendário de posts (8 semanas)

Gerado por `ferramentas/gerar_posts_instagram.py` (refazer depois de mudar status ou datas:
`python3 divulgacao/ferramentas/gerar_posts_instagram.py {INICIO.isoformat()}`).
Estratégia, pilares e técnicas: `ESTRATEGIA.md`. Cada post tem a sua pasta em `posts/`.

Início: **{INICIO.strftime('%d/%m/%Y')}** · 3 posts por semana (seg, qua, sex) · 19h–21h ·
stories quase todo dia. **Pausa de festas** entre a semana 6 e a 7
({(INICIO + dt.timedelta(weeks=6)).strftime('%d/%m')} a {(INICIO + dt.timedelta(weeks=8) - dt.timedelta(days=1)).strftime('%d/%m')}): só stories
(retrospectiva, "meta de estudo para o ano"); a venda volta em janeiro.

| # | Data | Semana · fase | Formato | Pilar | Técnica | Post | Status |
|---|---|---|---|---|---|---|---|
""" + "\n".join(linhas_cal) + f"""

## Equilíbrio

{" · ".join(f"{PILAR[k]}: {v}" for k, v in contagem.items())} (de {len(P)} posts).
Nenhuma técnica se repete em posts seguidos; a venda direta só aparece a partir da semana 5.

## Toda sexta (5 min)

1. Atualizar o **Status** e as métricas nos briefings da semana.
2. Rodar o gerador para refazer este calendário.
3. Rodar `divulgacao/ferramentas/subir-drive.sh` para atualizar o Drive.
4. Na semana 4 e na semana 8: ver os 2 posts com mais salvamentos e repetir o formato.
""", encoding="utf-8")

print(f"{len(P)} posts em {POSTS} e CALENDARIO.md (início {INICIO.isoformat()})")
