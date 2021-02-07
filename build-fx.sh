for f in *.mov; do
  d="${f%.mov}"
  # mkdir -p "$d"
  # echo ffmpeg -i "$f" -f image2 "$d/frame-%07d.png"
  # ffmpeg -i "$f" -f image2 "$d/frame-%07d.png"
  ffmpeg -i "$f" -b:v 2M "$d.webm"
done