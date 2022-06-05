# run processes and store pids in array
for f in "Base_Color.png" "Emissive.png"; do
  ~/app/bin/basisu "$f" -ktx2 -mipmap -q 255 -comp_level 3 &
done
for f in "Normal.png"; do
  ~/app/bin/basisu "$f" -ktx2 -mipmap -normal_map -q 255 -comp_level 3 &
done
for f in "Height.png" "Roughness.png" "Ambient_Occlusion.png"; do
  ~/app/bin/basisu "$f" -ktx2 -mipmap -linear -q 255 -comp_level 3 &
done

# wait for all pids
wait
