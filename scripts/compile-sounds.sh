# this script is used to compile sounds into an indexed mp3 file
# input: directory of wav files
# output: mp3 data file and json metadata file

ls {walk,run,jump,land,narutoRun}/*.wav | sort -n >sounds.txt
cat sounds.txt | awk '{print "file " $0}' >sounds-list.txt
ffmpeg -f concat -i sounds-list.txt -b:a 320k -y sounds.mp3

rm -f sound-files.txt
cat sounds.txt | while read f; do
  a=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
  echo "$a $f" | tee -a sound-files.txt
done;
node -e 'offset = 0; a = require("fs").readFileSync("./sound-files.txt", "utf8").split("\n").filter(l => !!l).map(s => {m = s.match(/^([0-9\.]+) (.+)$/); duration = parseFloat(m[1]); name = m[2]; r = {name,offset,duration}; offset += duration; return r;}); console.log(JSON.stringify(a, null, 2))' >sound-files.json
