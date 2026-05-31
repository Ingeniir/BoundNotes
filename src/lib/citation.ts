const citations: string[] = [
    "Chaque grande idée commence par une note vide.",
    "La première note est le début de tout.",
    "Un carnet vide est une possibilité infinie.",
    "Écrire une note, c'est donner vie à une pensée."
]

export function getRandomCitation() {
    const index = Math.floor(Math.random() * citations.length);
    return citations[index];
}