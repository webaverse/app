# this script is used to compile effects pack video files
# input: directory of webm files
# output: KTX2 format (compressed texture) spritesheet for each video
# note: texture is 8192x8192, sprite is 1024x1024, max number of frames is 8192*8192/(1024*1024) = 64; we filter files that are too large

rm -f *-spritesheet.ktx2
for f2 in *.mov; do
  rm -f lol0*;
  echo extract frames "$f2"
  ffmpeg -i "$f2" -f image2 -vf fps=fps=24 lol%03d.png
  echo montage "$f2"
  a=$(convert "lol001.png" -format '#%[hex:u.p{0,0}]' info:-)
  montage lol0*.png -background none -tile 8x8 -geometry 1024x1024+0+0 spritesheet.png
  echo basisu "$f2"
  basisu -ktx2 -mipmap spritesheet.png
  echo binplace "$f2"-spritesheet.ktx2
  cp spritesheet.png "$f2"-spritesheet.png
  cp spritesheet.ktx2 "$f2"-spritesheet.ktx2
done;

rm -f animation-frames.txt
for f2 in *.mov; do
  frameCount=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$f2")
  if [ "$frameCount" -le 64 ]; then
    echo "$frameCount" "$f2" | tee -a fx-files.txt
  fi;
done;
node -e 'a = require("fs").readFileSync("./fx-files.txt", "utf8").split("\n").filter(l => !!l).map(s => {m = s.match(/^([0-9\.]+) (.+)$/); numFrames = parseFloat(m[1]); name = m[2]; return {name,numFrames};}); console.log(JSON.stringify(a, null, 2))' >fx-files.json
