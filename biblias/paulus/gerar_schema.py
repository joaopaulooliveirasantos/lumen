"""
Gera o schema JSON completo com todos os 73 livros da Bíblia Católica
e seus respectivos URLs no site biblia.paulus.com.br
"""
import json

BASE_URL = "https://biblia.paulus.com.br/biblia-pastoral"

# Estrutura: (id, nome, slug_livro, testamento_slug, categoria_slug, total_capitulos)
LIVROS = [
    # ANTIGO TESTAMENTO - PENTATEUCO
    ("GN",  "Gênesis",        "genesis",        "antigo-testamento", "pentateuco", 50),
    ("EX",  "Êxodo",          "exodo",          "antigo-testamento", "pentateuco", 40),
    ("LV",  "Levítico",       "levitico",       "antigo-testamento", "pentateuco", 27),
    ("NM",  "Números",        "numeros",        "antigo-testamento", "pentateuco", 36),
    ("DT",  "Deuteronômio",   "deuteronomio",   "antigo-testamento", "pentateuco", 34),
    # ANTIGO TESTAMENTO - HISTÓRICOS
    ("JS",  "Josué",          "josue",          "antigo-testamento", "historicos", 24),
    ("JZ",  "Juízes",         "juizes",         "antigo-testamento", "historicos", 21),
    ("RT",  "Rute",           "rute",           "antigo-testamento", "historicos",  4),
    ("1SM", "1 Samuel",       "1-samuel",       "antigo-testamento", "historicos", 31),
    ("2SM", "2 Samuel",       "2-samuel",       "antigo-testamento", "historicos", 24),
    ("1RS", "1 Reis",         "1-reis",         "antigo-testamento", "historicos", 22),
    ("2RS", "2 Reis",         "2-reis",         "antigo-testamento", "historicos", 25),
    ("1CR", "1 Crônicas",     "1-cronicas",     "antigo-testamento", "historicos", 29),
    ("2CR", "2 Crônicas",     "2-cronicas",     "antigo-testamento", "historicos", 36),
    ("ED",  "Esdras",         "esdras",         "antigo-testamento", "historicos", 10),
    ("NE",  "Neemias",        "neemias",        "antigo-testamento", "historicos", 13),
    ("TB",  "Tobias",         "tobias",         "antigo-testamento", "historicos", 14),
    ("JT",  "Judite",         "judite",         "antigo-testamento", "historicos", 16),
    ("ET",  "Ester",          "ester",          "antigo-testamento", "historicos", 10),
    ("1MC", "1 Macabeus",     "1-macabeus",     "antigo-testamento", "historicos", 16),
    ("2MC", "2 Macabeus",     "2-macabeus",     "antigo-testamento", "historicos", 15),
    # ANTIGO TESTAMENTO - POÉTICOS/SAPIENCIAIS
    ("JO",  "Jó",             "jo",             "antigo-testamento", "poeticos-sapienciais", 42),
    ("SL",  "Salmos",         "salmos",         "antigo-testamento", "poeticos-sapienciais", 150),
    ("PR",  "Provérbios",     "proverbios",     "antigo-testamento", "poeticos-sapienciais", 31),
    ("EC",  "Eclesiastes",    "eclesiastes",    "antigo-testamento", "poeticos-sapienciais", 12),
    ("CT",  "Cântico dos Cânticos", "cantico-dos-canticos", "antigo-testamento", "poeticos-sapienciais", 8),
    ("SB",  "Sabedoria",      "sabedoria",      "antigo-testamento", "poeticos-sapienciais", 19),
    ("SI",  "Eclesiástico",   "eclesiastico",   "antigo-testamento", "poeticos-sapienciais", 51),
    # ANTIGO TESTAMENTO - PROFÉTICOS MAIORES
    ("IS",  "Isaías",         "isaias",         "antigo-testamento", "profeticos-maiores", 66),
    ("JR",  "Jeremias",       "jeremias",       "antigo-testamento", "profeticos-maiores", 52),
    ("LM",  "Lamentações",    "lamentacoes",    "antigo-testamento", "profeticos-maiores",  5),
    ("BR",  "Baruc",          "baruc",          "antigo-testamento", "profeticos-maiores",  6),
    ("EZ",  "Ezequiel",       "ezequiel",       "antigo-testamento", "profeticos-maiores", 48),
    ("DN",  "Daniel",         "daniel",         "antigo-testamento", "profeticos-maiores", 14),
    # ANTIGO TESTAMENTO - PROFÉTICOS MENORES
    ("OS",  "Oseias",         "oseias",         "antigo-testamento", "profeticos-menores", 14),
    ("JL",  "Joel",           "joel",           "antigo-testamento", "profeticos-menores",  4),
    ("AM",  "Amós",           "amos",           "antigo-testamento", "profeticos-menores",  9),
    ("AB",  "Abdias",         "abdias",         "antigo-testamento", "profeticos-menores",  1),
    ("JN",  "Jonas",          "jonas",          "antigo-testamento", "profeticos-menores",  4),
    ("MQ",  "Miquéias",       "miqueias",       "antigo-testamento", "profeticos-menores",  7),
    ("NA",  "Naum",           "naum",           "antigo-testamento", "profeticos-menores",  3),
    ("HB",  "Habacuc",        "habacuc",        "antigo-testamento", "profeticos-menores",  3),
    ("SF",  "Sofonias",       "sofonias",       "antigo-testamento", "profeticos-menores",  3),
    ("AG",  "Ageu",           "ageu",           "antigo-testamento", "profeticos-menores",  2),
    ("ZC",  "Zacarias",       "zacarias",       "antigo-testamento", "profeticos-menores", 14),
    ("ML",  "Malaquias",      "malaquias",      "antigo-testamento", "profeticos-menores",  3),
    # NOVO TESTAMENTO - EVANGELHOS
    ("MT",  "Mateus",         "mateus",         "novo-testamento", "evangelhos", 28),
    ("MC",  "Marcos",         "marcos",         "novo-testamento", "evangelhos", 16),
    ("LC",  "Lucas",          "lucas",          "novo-testamento", "evangelhos", 24),
    ("JO2", "João",           "joao",           "novo-testamento", "evangelhos", 21),
    # NOVO TESTAMENTO - ATOS
    ("AT",  "Atos dos Apóstolos", "atos-dos-apostolos", "novo-testamento", "atos", 28),
    # NOVO TESTAMENTO - CARTAS PAULINAS
    ("RM",  "Romanos",        "romanos",        "novo-testamento", "cartas-paulinas", 16),
    ("1CO", "1 Coríntios",    "1-corintios",    "novo-testamento", "cartas-paulinas", 16),
    ("2CO", "2 Coríntios",    "2-corintios",    "novo-testamento", "cartas-paulinas", 13),
    ("GL",  "Gálatas",        "galatas",        "novo-testamento", "cartas-paulinas",  6),
    ("EF",  "Efésios",        "efesios",        "novo-testamento", "cartas-paulinas",  6),
    ("FL",  "Filipenses",     "filipenses",     "novo-testamento", "cartas-paulinas",  4),
    ("CL",  "Colossenses",    "colossenses",    "novo-testamento", "cartas-paulinas",  4),
    ("1TS", "1 Tessalonicenses", "1-tessalonicenses", "novo-testamento", "cartas-paulinas", 5),
    ("2TS", "2 Tessalonicenses", "2-tessalonicenses", "novo-testamento", "cartas-paulinas", 3),
    ("1TM", "1 Timóteo",      "1-timoteo",      "novo-testamento", "cartas-paulinas",  6),
    ("2TM", "2 Timóteo",      "2-timoteo",      "novo-testamento", "cartas-paulinas",  4),
    ("TT",  "Tito",           "tito",           "novo-testamento", "cartas-paulinas",  3),
    ("FM",  "Filêmon",        "filemon",        "novo-testamento", "cartas-paulinas",  1),
    ("HB2", "Hebreus",        "hebreus",        "novo-testamento", "cartas-paulinas", 13),
    # NOVO TESTAMENTO - CARTAS CATÓLICAS
    ("TG",  "Tiago",          "tiago",          "novo-testamento", "cartas-catolicasuniversais",  5),
    ("1PD", "1 Pedro",        "1-pedro",        "novo-testamento", "cartas-catolicasuniversais",  5),
    ("2PD", "2 Pedro",        "2-pedro",        "novo-testamento", "cartas-catolicasuniversais",  3),
    ("1JO", "1 João",         "1-joao",         "novo-testamento", "cartas-catolicasuniversais",  5),
    ("2JO", "2 João",         "2-joao",         "novo-testamento", "cartas-catolicasuniversais",  1),
    ("3JO", "3 João",         "3-joao",         "novo-testamento", "cartas-catolicasuniversais",  1),
    ("JD",  "Judas",          "judas",          "novo-testamento", "cartas-catolicasuniversais",  1),
    # NOVO TESTAMENTO - APOCALIPSE
    ("AP",  "Apocalipse de São João", "apocalipse-de-sao-joao", "novo-testamento", "apocalipse", 22),
]

def gerar_schema():
    livros_json = []
    total_caps = 0

    for lid, nome, slug_livro, testamento_slug, categoria_slug, n_caps in LIVROS:
        capitulos = []
        for n in range(1, n_caps + 1):
            url = f"{BASE_URL}/{testamento_slug}/{categoria_slug}/{slug_livro}/{n}"
            capitulos.append({
                "capitulo": n,
                "url": url,
                "secoes": [],
                "versiculos": [],
                "notas": []
            })
        total_caps += n_caps
        livros_json.append({
            "id": lid,
            "nome": nome,
            "slug": slug_livro,
            "testamento": "Antigo Testamento" if testamento_slug == "antigo-testamento" else "Novo Testamento",
            "categoria": categoria_slug.replace("-", " ").title(),
            "total_capitulos": n_caps,
            "capitulos": capitulos
        })

    schema = {
        "metadata": {
            "titulo": "Bíblia Sagrada - Edição Pastoral",
            "editora": "Paulus Editora",
            "url_origem": "https://biblia.paulus.com.br/biblia-pastoral/",
            "idioma": "pt-BR",
            "tradicao": "Católica Apostólica Romana",
            "total_livros": len(livros_json),
            "total_capitulos": total_caps
        },
        "livros": livros_json
    }

    output = "biblia_pastoral_paulus_integral_schema.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)

    print(f"Schema gerado: {len(livros_json)} livros, {total_caps} capítulos")
    print(f"Arquivo: {output}")

gerar_schema()
