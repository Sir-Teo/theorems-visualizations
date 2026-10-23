"""Check selected text against explicitly supplied, hash-pinned HTML witnesses.

Offline only. Does not retrieve sources, update selections, or grant review.
"""

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re


def digest(data):
    return hashlib.sha256(data).hexdigest()


class Paragraphs(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paragraphs = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        if tag == "p":
            if self.current is not None:
                raise ValueError("Nested paragraph: extraction requires review")
            self.current = []

    def handle_endtag(self, tag):
        if tag == "p" and self.current is not None:
            self.paragraphs.append(re.sub(r"\s+", " ", "".join(self.current)).strip())
            self.current = None

    def handle_data(self, text):
        if self.current is not None:
            self.current.append(text)


def paragraphs(data):
    # The three pinned witnesses use these spans only for page-number markers.
    # Inline study links retain their visible text, including split-word links.
    html = data.decode("utf-8-sig")
    html = re.sub(r'<span class="pagenum">.*?</span>', "", html, flags=re.DOTALL)
    parser = Paragraphs()
    parser.feed(html)
    parser.close()
    if parser.current is not None:
        raise ValueError("Unclosed paragraph: extraction requires review")
    return parser.paragraphs


def verify(packet, source_dir):
    sources = {source["id"]: source for source in packet["sources"]}
    if len(sources) != len(packet["sources"]):
        raise ValueError("Duplicate source ID")
    extracted = {}
    for key, source in sources.items():
        filename = source["snapshotFilename"]
        if Path(filename).name != filename:
            raise ValueError("Snapshot must be a plain filename")
        data = (source_dir / filename).read_bytes()
        if digest(data) != source["htmlSha256"]:
            raise ValueError(f"{key}: HTML differs from the inspected snapshot")
        extracted[key] = paragraphs(data)
    seen = set()
    for selection in packet["selections"]:
        key = selection["id"]
        if key in seen:
            raise ValueError(f"Duplicate selection ID: {key}")
        seen.add(key)
        ordinal = selection["htmlParagraphOneBased"]
        rows = extracted[selection["sourceId"]]
        if type(ordinal) is not int or not 1 <= ordinal <= len(rows):
            raise ValueError(f"{key}: invalid paragraph locator")
        actual = rows[ordinal - 1]
        if actual != selection["text"] or digest(actual.encode("utf-8")) != selection["textSha256"]:
            raise ValueError(f"{key}: selected text differs from the inspected paragraph")
    return {"result": "PASS", "sources": len(sources), "selectedParagraphs": len(seen),
            "scope": "Exact normalized text from supplied snapshots only; no source, literary, rights or lesson approval."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--packet", type=Path, default=Path(__file__).with_name("literature-selections-20261022.json"))
    args = parser.parse_args()
    try:
        result = verify(json.loads(args.packet.read_text()), args.source_dir)
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        parser.exit(1, f"FAIL: {error}\n")
    print(json.dumps(result, indent=2))
