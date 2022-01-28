# this script is used to compile sounds into an indexed mp3 file
# input: directory of wav files
# output: mp3 data file and json metadata file

ls *.wav | sort -n | awk '{print "file " $0}' >syllables.txt
ffmpeg -f concat -i syllables.txt -b:a 320k -y syllables.mp3

rm -f syllable-files.txt
for f in `ls *.wav | sort -n`; do
  a=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
  echo "$a $f" | tee -a syllable-files.txt
done;
node -e 'offset = 0; a = require("fs").readFileSync("./syllable-files.txt", "utf8").split("\n").filter(l => !!l).map(s => {m = s.match(/^([0-9\.]+) (.+)$/); duration = parseFloat(m[1]); name = m[2]; r = {name,offset,duration}; offset += duration; return r;}); console.log(JSON.stringify(a, null, 2))' >syllable-files.json
