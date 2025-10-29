#!/bin/bash
# Batch convert all PNG/JPG images in images/ to WebP and AVIF
for img in images/*.{png,jpg,jpeg}; do
  [ -e "$img" ] || continue
  cwebp -q 80 "$img" -o "${img%.*}.webp"
  avifenc "$img" "${img%.*}.avif"
done

echo "Conversion complete. You can now use .webp and .avif images for faster loading!"