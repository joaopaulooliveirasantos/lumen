import requests
import re
import json

url = "https://biblia.paulus.com.br/biblia-pastoral/antigo-testamento/pentateuco/genesis/1"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, timeout=20)

html = r.text

# Salva o HTML completo para análise
with open("genesis1_raw.html", "w", encoding="utf-8") as f:
    f.write(html)
print("HTML salvo em genesis1_raw.html")
print(f"Tamanho: {len(html)} chars")

# Procura por URLs de API, endpoints JSON, __NEXT_DATA__, etc.
print("\n=== Possíveis APIs / dados embutidos ===")

patterns = [
    r'__NEXT_DATA__',
    r'window\.__',
    r'/api/',
    r'\.json',
    r'fetch\(',
    r'axios',
    r'graphql',
    r'"versicul',
    r'"capitulo',
    r'"genesis"',
]

for pattern in patterns:
    matches = re.findall(f'.{{0,80}}{pattern}.{{0,80}}', html, re.IGNORECASE)
    if matches:
        print(f"\n--- {pattern} ---")
        for m in matches[:3]:
            print(" ", m.strip())

# Procura por __NEXT_DATA__ (Next.js)
next_data = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
if next_data:
    print("\n=== __NEXT_DATA__ encontrado! ===")
    try:
        data = json.loads(next_data.group(1))
        print(json.dumps(data, ensure_ascii=False, indent=2)[:2000])
    except Exception as e:
        print(f"Erro ao parsear: {e}")
        print(next_data.group(1)[:500])
