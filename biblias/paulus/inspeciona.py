import json

with open("biblia_pastoral_paulus_integral_schema.json", encoding="utf-8") as f:
    data = json.load(f)

livros = data["livros"]
print(f"Total de livros: {len(livros)}")

caps_total = 0
caps_com_versos = 0
caps_sem_versos = []

for livro in livros:
    caps = livro.get("capitulos", [])
    caps_total += len(caps)
    for cap in caps:
        if cap.get("versiculos"):
            caps_com_versos += 1
        else:
            caps_sem_versos.append(f"{livro['nome']} cap.{cap['capitulo']}")

print(f"Total capítulos: {caps_total}")
print(f"Com versículos: {caps_com_versos}")
print(f"Sem versículos: {len(caps_sem_versos)}")
if caps_sem_versos:
    print("Primeiros vazios:", caps_sem_versos[:10])
