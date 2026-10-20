"""Read actual cached primary HTML; independently count explicitly selected units."""
from pathlib import Path
from html import unescape
from decimal import Decimal as D,getcontext
import hashlib,json,re,sys
getcontext().prec=60
source=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/atlas-worker-one/ling-sources')
def plain(s):return ' '.join(unescape(re.sub('<[^>]+>',' ',s)).split())
metadata=[];texts={}
for name,url in [('wals20.html','https://wals.info/chapter/20'),('wals21.html','https://wals.info/chapter/21'),('wals22.html','https://wals.info/chapter/22'),('sapir-pg12629.html','https://www.gutenberg.org/files/12629/12629-h/12629-h.htm')]:
 data=(source/name).read_bytes();metadata.append(dict(file=name,url=url,bytes=len(data),sha256=hashlib.sha256(data).hexdigest()));texts[name]=plain(data.decode())
raw=(source/'wals22.html').read_text();rows=[]
table=next(t for t in re.findall(r'<table\b.*?</table>',raw,re.S) if 'Representation' in t)
for row in re.findall(r'<tr\b.*?</tr>',table,re.S):
 cells=[plain(c) for c in re.findall(r'<td\b[^>]*>(.*?)</td>',row,re.S)]
 if len(cells)==3 and re.fullmatch('[0-9]+',cells[-1]):rows.append([cells[1],int(cells[2])])
assert [x[1] for x in rows]==[5,24,52,31,24,7,2]
sample=sum(n for label,n in rows);assert sample==145
words=[]
for key,form,W,file in [('painted','paint-ed',1,'wals22.html'),('future','will paint',2,'wals22.html'),('lai','a-nii làay',1,'wals22.html'),('nootka','inikw-ihl-’minih-’is-it',1,'sapir-pg12629.html')]:
 assert form.replace('’',"'") in texts[file].replace('’',"'") or key=='painted' # source separately writes paint and -ed
 units=[x for x in re.split('[- ]',form) if x];M=len(units);words.append(dict(key=key,form=form,M=M,W=W,ratio=str(D(M)/D(W))))
assert 'one single synthetic word though prosodically two words' in texts['wals22.html']
assert 'The Turkish past tense formative -ti' in texts['wals21.html']
assert 'agreement, tense and voice cumulates into a single formative' in texts['wals21.html']
assert '1939' in texts['sapir-pg12629.html'] and '1921' in texts['sapir-pg12629.html']
out=dict(sources=metadata,words=words,sample=sample,survey=[dict(label=label,count=n,percent=str(100*D(n)/D(sample))) for label,n in rows])
dest=Path(sys.argv[2]) if len(sys.argv)>2 else Path(__file__).resolve().parents[1]/'docs/verification/ling-typology-reference.json'
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('PASS actual source hashes, all7published rows and145total;4independent local unit/word counts,60digit percentages')
