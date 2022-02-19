# this script is used to compile sounds into an indexed mp3 file
# input: directory of wav files
# output: mp3 data file and json metadata file

ls {walk,run,jump,land,narutoRun,food,combat}/*.wav | sort -n >sound-files.txt
# cat sounds.txt | awk '{print "file " $0}' >sounds-list.txt
sox $(< sound-files.txt) sounds.mp3

rm -f sounds.txt
cat sound-files.txt | while read f; do
  a=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
  echo "$a $f" | tee -a sounds.txt
done;
node -e 'offset = 0; a = require("fs").readFileSync("./sounds.txt", "utf8").split("\n").filter(l => !!l).map(s => {m = s.match(/^([0-9\.]+) (.+)$/); duration = parseFloat(m[1]); name = m[2]; r = {name,offset,duration}; offset += duration; return r;}); console.log(JSON.stringify(a, null, 2))' >sound-files.json