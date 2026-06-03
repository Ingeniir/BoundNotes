import { convertFileSrc } from "@tauri-apps/api/core";
import { visit } from "unist-util-visit";
import type { Root, Element, ElementContent } from "hast";

export function rehypeEnableCheckboxes() {
    return (tree: Root) => {
        visit(tree, "element", (node: Element) => {
            if (
                node.tagName === "input" &&
                node.properties?.type === "checkbox"
            ) {
                // Retire disabled
                delete node.properties.disabled;
                // Ajoute un style cursor pointer
                node.properties.class = "cursor-pointer";
            }
        });
    };
}

export function rehypeLocalImages() {
    return (tree: Root) => {
        visit(tree, "element", (node: Element) => {
            if (node.tagName !== "img") return;

            const src = node.properties?.src as string;
            if (!src) return;

            if (
                src.startsWith("http://") ||
                src.startsWith("https://") ||
                src.startsWith("data:") ||
                src.startsWith("blob:") ||
                src.startsWith("asset:")
            ) return;

            // Décode toutes les couches d'encodage
            let decoded = src;
            try {
                let prev = "";
                while (prev !== decoded) {
                    prev = decoded;
                    decoded = decodeURIComponent(decoded);
                }
            } catch {
                decoded = src;
            }

            // ← Supprime les guillemets parasites
            decoded = decoded.replace(/^["']|["']$/g, "").trim();

            // Normalise les slashes Windows
            const normalized = decoded.replace(/\\/g, "/");

            try {
                node.properties.src = convertFileSrc(normalized);
            } catch (e) {
                console.error("convertFileSrc error:", e);
            }
        });
    };
}

function getClassValue(properties: Element['properties'] | undefined): string {
    const cls = properties?.class;
    if (typeof cls === "string") return cls;
    if (Array.isArray(cls)) return cls.join(" ");
    return "";
}

export function rehypeCopyButton() {
    return (tree: Root) => {
        visit(tree, 'element', (node: Element) => {
            if (node.tagName === 'pre' && node.children?.[0]) {
                const firstChild = node.children[0]

                // Guard de type : vérifie que c'est un Element (pas Text ou Comment)
                if ('tagName' in firstChild && firstChild.tagName === 'code') {
                    const currentClass = getClassValue(node.properties)

                    node.properties = {
                        ...node.properties,
                        class: `${currentClass ?? ''} relative group`.trim()
                    }

                    node.children.push({
                        type: 'element',
                        tagName: 'button',
                        properties: {
                            class: 'copy-btn absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs bg-gray-200 border border-gray-300 text-gray-700 rounded px-2 py-0.5 font-jetbrains-mono transition-opacity cursor-pointer',
                            onclick: 'navigator.clipboard.writeText(this.previousSibling?.textContent ?? "")'
                        },
                        children: [{ type: 'text', value: 'Copy' }]
                    })
                }
            }
        })
    }
}
