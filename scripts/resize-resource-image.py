from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a web-sized JPEG resource image.")
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--max-width", type=int, default=1400)
    parser.add_argument("--quality", type=int, default=84)
    parser.add_argument("--max-input-pixels", type=int, default=400_000_000)
    args = parser.parse_args()

    if args.max_width < 1 or not 1 <= args.quality <= 100:
        parser.error("max-width must be positive and quality must be between 1 and 100")
    if args.max_input_pixels < 1:
        parser.error("max-input-pixels must be positive")

    # The archive intentionally accepts high-resolution museum scans. Pillow's
    # default bomb threshold rejects today's verified 268 MP scan before it can
    # be reduced. Keep a finite, explicit ceiling and validate dimensions before
    # decoding pixels; JPEG draft mode avoids allocating the full source raster.
    Image.MAX_IMAGE_PIXELS = args.max_input_pixels
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as opened:
        input_pixels = opened.width * opened.height
        if input_pixels > args.max_input_pixels:
            raise ValueError(
                f"input image has {input_pixels} pixels; limit is {args.max_input_pixels}"
            )
        if opened.format == "JPEG" and opened.width > args.max_width:
            opened.draft("RGB", (args.max_width, args.max_width))
        image = ImageOps.exif_transpose(opened)
        if image.width > args.max_width:
            height = max(1, round(image.height * args.max_width / image.width))
            image = image.resize((args.max_width, height), Image.Resampling.LANCZOS)

        if image.mode != "RGB":
            canvas = Image.new("RGB", image.size, (248, 247, 242))
            if "A" in image.getbands():
                canvas.paste(image, mask=image.getchannel("A"))
            else:
                canvas.paste(image.convert("RGB"))
            image = canvas

        image.save(
            args.destination,
            format="JPEG",
            quality=args.quality,
            optimize=True,
            progressive=True,
        )


if __name__ == "__main__":
    main()
