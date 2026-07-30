import json
import re
import time
import requests
from bs4 import BeautifulSoup

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
TIMEOUT = 20
DELAY_ENTRE_REQUISICOES = 1.0  # segundos entre requests para não sobrecarregar o servidor

def extrair_capitulo(url, tentativas=3):
    for tentativa in range(1, tentativas + 1):
        try:
            response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            if response.status_code != 200:
                return {"secoes": [], "versiculos": [], "notas": []}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            secoes = [h.get_text(strip=True) for h in soup.find_all(['h2', 'h3']) if h.get_text(strip=True)]
            
            versiculos = []
            for p in soup.find_all(['p', 'div'], class_=re.compile(r'versiculo|verse|texto')):
                texto = p.get_text(strip=True)
                match = re.match(r'^(\d+)\s*(.*)', texto)
                if match:
                    versiculos.append({
                        "numero": int(match.group(1)),
                        "texto": match.group(2)
                    })
                    
            notas = []
            for fn in soup.find_all(class_=re.compile(r'footnote|nota')):
                notas.append(fn.get_text(strip=True))
                
            return {"secoes": secoes, "versiculos": versiculos, "notas": notas}

        except requests.exceptions.Timeout:
            print(f"  [timeout] tentativa {tentativa}/{tentativas}: {url}")
        except requests.exceptions.ConnectionError as e:
            print(f"  [erro de conexão] tentativa {tentativa}/{tentativas}: {e}")
        except Exception as e:
            print(f"  [erro] tentativa {tentativa}/{tentativas}: {e}")
        
        if tentativa < tentativas:
            time.sleep(DELAY_ENTRE_REQUISICOES * tentativa)

    print(f"  [falhou] pulando: {url}")
    return {"secoes": [], "versiculos": [], "notas": []}


def baixar_biblia_completa(schema_file, output_file="biblia_pastoral_paulus_completa.json"):
    with open(schema_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_livros = len(data['livros'])
    for i, livro in enumerate(data['livros'], 1):
        print(f"[{i}/{total_livros}] Processando: {livro['nome']}...")
        for cap in livro['capitulos']:
            conteudo = extrair_capitulo(cap['url'])
            cap['secoes'] = conteudo['secoes']
            cap['versiculos'] = conteudo['versiculos']
            cap['notas'] = conteudo['notas']
            time.sleep(DELAY_ENTRE_REQUISICOES)
            
    with open(output_file, "w", encoding="utf-8") as f_out:
        json.dump(data, f_out, ensure_ascii=False, indent=2)
    print(f"\nConcluído! Arquivo salvo em: {output_file}")


baixar_biblia_completa("biblia_pastoral_paulus_integral_schema.json")
