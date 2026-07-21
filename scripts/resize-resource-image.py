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
    args = parser.parse_args()

    args.destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as opened:
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
