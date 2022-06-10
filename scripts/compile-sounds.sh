# this script is used to compile sounds into an indexed mp3 file
# input: directories containing wav files (48000 Hz)
# output: mp3 data file and json metadata file
# run this in the sounds directory

find . -name '*-pad.wav' | xargs -d '\n' rm
clean () { 
rm -f lol.txt
rm -f sound-files.txt
rm -f sounds.txt
rm -f sounds.wav
find . -name '*-pad.wav' | xargs -d '\n' rm
}
rm -f sounds.mp3

clean
ls {walk,run,jump,land,narutoRun,sonicBoom,food,silkWorms,combat,spells,navi,ui}/*.wav | sort -n >sound-files.txt

set --
while IFS='' read -r item; do
  # pad files to avoid clipping at the edges
  sox -V "$item" "$item"-pad.wav pad 0 0.03
  set -- "$@" "$item"-pad.wav
done <sound-files.txt
sox -V "$@" sounds.wav 2>&1 | tee lol.txt
sox -V sounds.wav sounds.mp3 2>&1 | tee lol.txt

cat sound-files.txt | while read f; do
  samples=$(soxi -s "$f"-pad.wav)
  samplerate=$(soxi -r "$f"-pad.wav)
  a=$(echo "scale=20; $samples / $samplerate" | bc)
  echo "$a $f" | tee -a sounds.txt
done;
node -e 'offset = 0; a = require("fs").readFileSync("./sounds.txt", "utf8").split("\n").filter(l => !!l).map(s => {m = s.match(/^([0-9\.]+) (.+)$/); duration = parseFloat(m[1]); name = m[2]; r = {name,offset,duration}; offset += duration; return r;}); console.log(JSON.stringify(a, null, 2))' >sound-files.json

clean