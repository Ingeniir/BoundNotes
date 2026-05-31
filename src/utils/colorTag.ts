export function tagColor(name: string): string {
    let hash = 0;
    for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 65%, 65%)`;
}