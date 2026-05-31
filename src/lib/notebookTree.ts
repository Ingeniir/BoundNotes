import type { Notebook, NotebookNode } from "@types/index";

export function buildNotebookTree(notebooks: Notebook[]): NotebookNode[] {
    const map = new Map<string, NotebookNode>();

    // Création de noeud pour chaque notebook
    for (const nb of notebooks) {
        map.set(nb.id, { ...nb, children: [] });
    }

    const roots: NotebookNode[] = [];

    // On attache le noeud à son parent ou à la racine
    for (const node of map.values()) {
        if (node.parent_id && map.has(node.parent_id)) {
            map.get(node.parent_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}