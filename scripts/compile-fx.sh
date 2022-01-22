rm -f *-spritesheet.ktx2
for f2 in *.webm; do
  rm -f lol0*;
  echo extract frames "$f2"
  ffmpeg -i "$f2" -f image2 -vf fps=fps=24 lol%03d.png
  for f in lol0*.png; do
    echo alpha "$f"
    convert "$f" -transparent '#494949' -transparent "#225458" "$f"-transparent.png
  done;
  echo montage "$f2"
  montage lol0*-transparent.png -background none -tile 8x8 -geometry 512x512+0+0 spritesheet.png
  echo basisu "$f2"
  basisu -ktx2 spritesheet.png
  echo binplace "$f2"-spritesheet.ktx2
  cp spritesheet.png "$f2"-spritesheet.png
  cp spritesheet.ktx2 "$f2"-spritesheet.ktx2
done;