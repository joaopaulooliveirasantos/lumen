import requests
from bs4 import BeautifulSoup

url = "https://biblia.paulus.com.br/biblia-pastoral/antigo-testamento/pentateuco/genesis/1"
r = requests.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}, timeout=20)

print(f"Status: {r.status_code}")
print(f"Content-Type: {r.headers.get('content-type')}")
print(f"Tamanho: {len(r.text)} chars\n")

soup = BeautifulSoup(r.text, "html.parser")

# Título da página
print("=== TÍTULO ===")
print(soup.title.string if soup.title else "N/A")

# Primeiros 3000 chars do body
print("\n=== INÍCIO DO BODY ===")
body = soup.body
if body:
    print(body.get_text()[:3000])
else:
    print(r.text[:3000])
