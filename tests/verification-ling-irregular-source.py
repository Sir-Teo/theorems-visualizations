"""Check the committed factual CSV against original PDF character order (pdfplumber)."""
import collections,csv,hashlib,pathlib,re,sys
import pdfplumber
src=pathlib.Path(sys.argv[1]);assert hashlib.sha256(src.read_bytes()).hexdigest()=='c15e7ed62b10736690a132ff7bfc98e7ad950aedf2e510117e82961bed485f60'
rows=[]
with pdfplumber.open(src) as pdf:
 for n in [25,26,27,28]:
  lines=collections.defaultdict(list)
  for ch in pdf.pages[n-1].chars:lines[round(ch['top'],2)].append(ch['text'])
  for chars in lines.values():
   fields=''.join(chars).split('(cid:127)')
   if len(fields)>=7 and re.fullmatch('[a-z]+',fields[0]) and fields[1].isdigit():rows.append([fields[0],str(int(fields[1])),*fields[2:7]])
# Zero-width tab glyphs cause coordinate-sorted extract_text() to move the next column's first digit.
# Original character order retains every complete count and each separate historical flag.
assert len(rows)==249
expected=pathlib.Path(__file__).resolve().parents[1]/'docs/verification/ling-irregular-source.csv'
with expected.open() as f:committed=list(csv.reader(f))[1:]
assert rows==committed
selected=[r for r in rows if r[4]=='1'];assert len(selected)==177
assert sum(r[2]=='1' for r in selected)==98 and sum(r[3]=='1' for r in selected)==145
print('PASS exact hashed original PDF249 rows, full CSV fields/order;177 retained,145 Middle,98 Modern irregulars')
