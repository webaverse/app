rm -f *-spritesheet.ktx2
for f2 in *.webm; do
  rm -f lol0*;
  echo extract frames "$f2"
  ffmpeg -i "$f2" -f image2 -vf fps=fps=24 lol%03d.png
  echo montage "$f2"
  a=$(convert "lol001.png" -format '#%[hex:u.p{0,0}]' info:-)
  echo alpha "$a"
  montage lol0*.png -background "$a" -tile 8x8 -geometry 1024x1024+0+0 spritesheet.png
  echo basisu "$f2"
  basisu -ktx2 -mipmap spritesheet.png
  echo binplace "$f2"-spritesheet.ktx2
  cp spritesheet.png "$f2"-spritesheet.png
  cp spritesheet.ktx2 "$f2"-spritesheet.ktx2
done;