export interface Prayer {
  id: string;
  titulo: string;
  texto: string;
}

export interface PrayerCategory {
  id: string;
  nome: string;
  oracoes: Prayer[];
}
