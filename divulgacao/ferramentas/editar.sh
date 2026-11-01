#!/bin/bash
# Edits the recorded scenes (brutos/<formato>/*.mp4, from gravar.mjs) into the final videos,
# following 02_ROTEIRO.md and 03_EFEITOS.md. Everything is ffmpeg, so any cut can be redone.
# Usage: divulgacao/ferramentas/editar.sh <9x16|4x5|16x9> [A|B|C]   (A, B, C = hook variant)
set -euo pipefail

FMT=${1:-9x16}
HOOK=${2:-A}
DIR="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$DIR/brutos/$FMT"
CEL="$DIR/brutos/celular/c8_celular.mp4"
OUT="$DIR/video"
TMP="$DIR/brutos/tmp-$FMT"
FONT=/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf
FPS=30
mkdir -p "$OUT" "$TMP"

case "$FMT" in
  9x16) W=1080; H=1920; FS=74; CAP_X='(w-text_w)/2'; CAP_Y=1250; BIG=104 ;;
  4x5)  W=1080; H=1350; FS=64; CAP_X='(w-text_w)/2'; CAP_Y=96;   BIG=92 ;;
  16x9) W=1920; H=1080; FS=62; CAP_X=110;            CAP_Y=860;  BIG=96 ;;
  *) echo "Formato desconhecido: $FMT" >&2; exit 1 ;;
esac

case "$HOOK" in
  A) HOOK_TEXT="Leu e esqueceu?" ;;
  B) HOOK_TEXT="Seu resumo tem 10 páginas?" ;;
  C) HOOK_TEXT="Estude menos, lembre mais." ;;
esac

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

# drawtext for one caption: text goes through a file, so quotes and colons need no escaping.
# caption <start> <end> <text> [size] [y]
caption() {
  local file="$TMP/txt_$RANDOM$RANDOM.txt"
  printf '%s' "$3" > "$file"
  local size=${4:-$FS} y=${5:-$CAP_Y}
  printf "drawtext=fontfile=%s:textfile=%s:fontsize=%s:fontcolor=white:box=1:boxcolor=0x06090F@0.74:boxborderw=26:x=%s:y=%s+18*max(0\\,1-(t-%s)/0.18):alpha='min(1\\,max(0\\,(t-%s)/0.18))':enable='between(t\\,%s\\,%s)'" \
    "$FONT" "$file" "$size" "$CAP_X" "$y" "$1" "$1" "$1" "$2"
}

# Fits a recorded clip to <seconds> (speeding it up or holding its last frame), scales it to the
# format and adds a slow push-in. segment <in> <out> <seconds> <zoom> [drawtext filters...]
segment() {
  local in=$1 out=$2 seconds=$3 zoom=$4; shift 4
  local actual factor frames texts=""
  actual=$(dur "$in")
  factor=$(python3 -c "print(min(1.0, $seconds / $actual))")
  frames=$(python3 -c "print(round($seconds * $FPS))")
  for text in "$@"; do texts+=",$text"; done
  ffmpeg -v error -y -i "$in" -f lavfi -i anullsrc=r=48000:cl=stereo -filter_complex \
    "[0:v]setpts=PTS*$factor,fps=$FPS,scale=$W:$H:force_original_aspect_ratio=increase,crop=$W:$H,tpad=stop_mode=clone:stop_duration=$seconds,trim=duration=$seconds,setpts=PTS-STARTPTS,zoompan=z='1+$zoom*on/$frames':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=$FPS${texts},format=yuv420p[v]" \
    -map "[v]" -map 1:a -t "$seconds" -c:v libx264 -crf 18 -preset veryfast -c:a aac -b:a 128k "$out"
}

echo "== $FMT: cenas"

# 1. Hook: the dense summary pushes in, blurs and darkens; big question in the middle.
segment "$RAW/c1_resumo.mp4" "$TMP/s1_base.mp4" 2.5 0.15
ffmpeg -v error -y -i "$TMP/s1_base.mp4" -filter_complex \
  "[0:v]split[a][b];[b]gblur=sigma=16[bb];[a][bb]blend=all_expr='A*(1-min(T/2.2\,1))+B*min(T/2.2\,1)',eq=brightness='-0.32*min(t/2.2\,1)':eval=frame,$(caption 0.2 2.5 "$HOOK_TEXT" "$BIG" '(h-text_h)/2'),format=yuv420p[v]" \
  -map "[v]" -map 0:a -c:v libx264 -crf 18 -preset veryfast -c:a copy "$TMP/s1.mp4"

# 2-3. From summary to map: typing the branches, sped up.
segment "$RAW/c2c3_criar.mp4" "$TMP/s2.mp4" 9.5 0.08 \
  "$(caption 0 2.5 'Transforme em mapa.')" "$(caption 2.5 9.5 'Tab cria. Enter continua.')"
# 4-6. Organize, connect, theme.
segment "$RAW/c4_organizar.mp4" "$TMP/s4.mp4" 3 0.06 "$(caption 0.1 3 'Organiza sozinho.')"
segment "$RAW/c5_conectar.mp4" "$TMP/s5.mp4" 3 0.06 "$(caption 0.1 3 'Ligue os assuntos.')"
segment "$RAW/c6_aparencia.mp4" "$TMP/s6.mp4" 3 0.04 "$(caption 0.1 3 'Do seu jeito.')"
# 7. Review mode.
segment "$RAW/c7_revisar.mp4" "$TMP/s7.mp4" 7 0.10 \
  "$(caption 0.1 3.5 'Vira cartão de revisão.')" "$(caption 3.5 7 'Revise na hora certa.')"

# 8. Phone: the mobile recording inside a phone frame that slides up over the brand gradient.
read -r PW PH PX PY < <(python3 - "$W" "$H" "$FMT" <<'EOF'
import sys
w, h, fmt = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
ph = round(h * (0.70 if fmt == "9x16" else 0.74 if fmt == "4x5" else 0.80) / 2) * 2
pw = round(ph * 1080 / 2338 / 2) * 2
px = (w - pw) // 2 if fmt != "16x9" else w - pw - 260
py = h - ph - (150 if fmt == "9x16" else 70 if fmt == "4x5" else 110)
print(pw, ph, px, py)
EOF
)
R=$((PW / 9)); B=14
convert -size "${PW}x${PH}" xc:black -fill white -draw "roundrectangle 0,0,$((PW-1)),$((PH-1)),$R,$R" "$TMP/mask.png"
convert -size "$((PW+2*B))x$((PH+2*B))" xc:none -fill '#0b0f19' -stroke '#3a4458' -strokewidth 3 \
  -draw "roundrectangle 1,1,$((PW+2*B-2)),$((PH+2*B-2)),$((R+B)),$((R+B))" "$TMP/moldura.png"
ffmpeg -v error -y -i "$CEL" -loop 1 -i "$TMP/mask.png" -loop 1 -i "$TMP/moldura.png" \
  -f lavfi -i "gradients=s=${W}x${H}:c0=0x17305e:c1=0x06090F:x0=0:y0=0:x1=$W:y1=$H:d=3:r=$FPS" \
  -f lavfi -i anullsrc=r=48000:cl=stereo -filter_complex \
  "[0:v]fps=$FPS,scale=$PW:$PH,tpad=stop_mode=clone:stop_duration=3,trim=duration=3,setpts=PTS-STARTPTS[tela];
   [1:v]format=gray,scale=$PW:$PH[m];[tela][m]alphamerge[tela_r];
   [3:v][2:v]overlay=x=$((PX-B)):y='if(lt(t,0.45),H+($((PY-B))-H)*(1-pow(1-t/0.45,3)),$((PY-B)))':shortest=1[f];
   [f][tela_r]overlay=x=$PX:y='if(lt(t,0.45),H+$B+($PY-H-$B)*(1-pow(1-t/0.45,3)),$PY)',$(caption 0.2 3 'No celular também.' "$FS" "$([ "$FMT" = 16x9 ] && echo 430 || echo 230)"),format=yuv420p[v]" \
  -map "[v]" -map 4:a -t 3 -c:v libx264 -crf 18 -preset veryfast -c:a aac -b:a 128k "$TMP/s8.mp4"

# 9. End card.
segment "$RAW/c9_final.mp4" "$TMP/s9.mp4" 5 0.03

echo "== $FMT: montagem"
# Hard cuts in the middle; slide-up from the hook into the app, fade into the end card.
printf "file '%s'\n" "$TMP/s2.mp4" "$TMP/s4.mp4" "$TMP/s5.mp4" "$TMP/s6.mp4" "$TMP/s7.mp4" "$TMP/s8.mp4" > "$TMP/meio.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$TMP/meio.txt" -c copy "$TMP/meio.mp4"
D1=$(dur "$TMP/s1.mp4"); DM=$(dur "$TMP/meio.mp4")
OFF1=$(python3 -c "print(round($D1 - 0.3, 3))")
OFF2=$(python3 -c "print(round($D1 - 0.3 + $DM - 0.4, 3))")
TOTAL=$(python3 -c "print(round($D1 - 0.3 + $DM - 0.4 + $(dur "$TMP/s9.mp4"), 3))")
FINAL="$OUT/mindora_${FMT}$([ "$HOOK" = A ] || echo "_gancho$HOOK").mp4"
ffmpeg -v error -y -i "$TMP/s1.mp4" -i "$TMP/meio.mp4" -i "$TMP/s9.mp4" -filter_complex \
  "[0:v][1:v]xfade=transition=slideup:duration=0.3:offset=$OFF1[a];
   [a][2:v]xfade=transition=fade:duration=0.4:offset=$OFF2,
   drawbox=x=0:y=0:w='iw*t/$TOTAL':h=$([ "$FMT" = 16x9 ] && echo 8 || echo 10):color=0x00B1C4:t=fill,format=yuv420p[v];
   [0:a][1:a]acrossfade=d=0.3[x];[x][2:a]acrossfade=d=0.4[au]" \
  -map "[v]" -map "[au]" -c:v libx264 -profile:v high -crf 20 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart "$FINAL"

# Cover: the organized map with the title and a "grátis" tag.
ffmpeg -v error -y -sseof -0.2 -i "$TMP/s4.mp4" -frames:v 1 -vf \
  "eq=brightness=-0.18,$(caption 0 99 'Mapa mental que' "$BIG" "$([ "$FMT" = 16x9 ] && echo 300 || echo 520)"),$(caption 0 99 'te faz lembrar.' "$BIG" "$([ "$FMT" = 16x9 ] && echo 460 || echo 690)"),drawtext=fontfile=$FONT:text='GRÁTIS':fontsize=$((FS-6)):fontcolor=white:box=1:boxcolor=0x00B1C4:boxborderw=22:x=$CAP_X:y=$([ "$FMT" = 16x9 ] && echo 640 || echo 900)" \
  "$OUT/capa_${FMT}.jpg"

echo "Pronto: $FINAL ($(python3 -c "print(round($(dur "$FINAL"),1))") s, $(du -h "$FINAL" | cut -f1)) e capa_${FMT}.jpg"
