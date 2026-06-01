import { EditorSelection } from "@codemirror/state";
import { EditorView } from "codemirror";


const toggleInlineMarkdown = (syntax: string, double?: boolean) => (view: EditorView) => {
    view.dispatch(
        view.state.changeByRange((range) => {
            // Curseur sans sélection
            if (range.empty) {
                const beforeCursor = view.state.sliceDoc(range.from - syntax.length, range.from);
                const afterCursor = view.state.sliceDoc(range.from, range.from + syntax.length);

                // le bloc est vide, on enlève le bloc
                if (beforeCursor === syntax && afterCursor === syntax) {
                    return {
                        changes: { from: range.from - syntax.length, to: range.from + syntax.length, insert: "" },
                        range: EditorSelection.cursor(range.from - syntax.length),
                    };
                }

                // On sorte du bloc avec du texte
                if (afterCursor === syntax) {
                    return {
                        range: EditorSelection.cursor(range.from + syntax.length),
                    };
                }

                // Aucunne selection
                return {
                    changes: { from: range.from, insert: double ? syntax + "\n\n" + syntax : syntax + syntax },
                    range: EditorSelection.cursor(double ? range.from + syntax.length + 1 : range.from + syntax.length),
                };
            }

            // Gestion du texte sélectionné
            const text = view.state.sliceDoc(range.from, range.to);
            if (text.startsWith(syntax) && text.endsWith(syntax)) {
                return {
                    changes: { from: range.from, to: range.to, insert: text.slice(syntax.length, -syntax.length) },
                    range: EditorSelection.range(range.from, range.to - syntax.length * 2),
                };
            }

            return {
                changes: { from: range.from, to: range.to, insert: syntax + text + syntax },
                range: EditorSelection.range(range.from + syntax.length, range.to + syntax.length),
            };
        })
    );
    return true;
};

const toggleHeading = (level: number) => (view: EditorView) => {
    const prefix = "#".repeat(level) + " ";
    view.dispatch(
        view.state.changeByRange((range) => {
            const line = view.state.doc.lineAt(range.from);
            const lineText = line.text;
            const match = /^(#+ )\s*/.exec(lineText);

            if (match) {
                const currentPrefix = match[1];
                // Si c'est déjà le même niveau de titre, on l'enlève
                if (currentPrefix.trim() === "#".repeat(level)) {
                    return {
                        changes: { from: line.from, to: line.from + currentPrefix.length, insert: "" },
                        range: EditorSelection.range(range.from - currentPrefix.length, range.to - currentPrefix.length),
                    };
                } else {
                    // Si c'est un niveau différent, on remplace le préfixe
                    return {
                        changes: { from: line.from, to: line.from + currentPrefix.length, insert: prefix },
                        range: EditorSelection.range(
                            range.from + (prefix.length - currentPrefix.length),
                            range.to + (prefix.length - currentPrefix.length)
                        ),
                    };
                }
            } else {
                // S'il n'y a pas de titre, on l'ajoute au début de la ligne
                return {
                    changes: { from: line.from, insert: prefix },
                    range: EditorSelection.range(range.from + prefix.length, range.to + prefix.length),
                };
            }
        })
    );
    return true;
};

const toggleCodeBlock = () => (view: EditorView) => {
    view.dispatch(
        view.state.changeByRange((range) => {
            // Pas de sélection.
            if (range.empty) {
                return {
                    changes: {
                        from: range.from,
                        insert: "```\n```",
                    },
                    range: EditorSelection.cursor(range.from + 3),
                }
            }

            // Il y a une sélection,
            const selectedText = view.state.sliceDoc(range.from, range.to);
            return {
                changes: {
                    from: range.from,
                    to: range.to,
                    insert: "```\n" + selectedText + "\n```",
                },
                range: EditorSelection.cursor(range.from + 3)
            };
        })
    );
    return true;
}

const toggleURL = () => (view: EditorView) => {
    view.dispatch(
        view.state.changeByRange((range) => {
            // Si aucun texte n'est sélectionné, on insère un lien vide
            if (range.empty) {
                return {
                    changes: {
                        from: range.from,
                        insert: "[]()",
                    },
                    range: EditorSelection.cursor(range.from + 1, range.from + 16),
                }
            }

            const selectedText = view.state.sliceDoc(range.from, range.to);
            console.log("Selected text for URL:", selectedText);
            const url = selectedText.includes("http") ? selectedText : "";
            console.log("URL to insert:", url);
            const displayText = selectedText.includes("http") ? "" : selectedText;
            console.log("Display text for URL:", displayText);
            return {
                changes: {
                    from: range.from,
                    to: range.to,
                    insert: `[${displayText}](${url})`,
                },
                range: EditorSelection.cursor(
                    url ? range.from + displayText.length + 1 : range.from + displayText.length + 3,
                    url ? range.from + displayText.length + 3 + url.length : range.from + 1
                ),
            }
        })
    );
    return true;
}

const toggleBulletAndCheckedList = (bullet: string) => (view: EditorView) => {
    view.dispatch(
        view.state.changeByRange((range) => {
            const line = view.state.doc.lineAt(range.from);
            const lineText = line.text;
            const regex = /^([-*+]|\d+\.)\s/.exec(lineText);
            if (regex) {
                const currentBullet = regex[1];
                if (currentBullet === bullet) {
                    return {
                        changes: { from: line.from, to: line.from + currentBullet.length + 1, insert: "" },
                        range: EditorSelection.range(range.from - currentBullet.length - 1, range.to - currentBullet.length - 1),
                    };
                }


                return {
                    changes: { from: line.from, to: line.from + currentBullet.length, insert: bullet },
                    range: EditorSelection.range(range.from + (bullet.length - currentBullet.length), range.to + (bullet.length - currentBullet.length)),
                };
            } else {
                return {
                    changes: { from: line.from, insert: bullet + " " },
                    range: EditorSelection.range(range.from + bullet.length + 1, range.to + bullet.length + 1),
                };
            }
        })
    );
    return true;
}

export { toggleInlineMarkdown, toggleHeading, toggleCodeBlock, toggleURL, toggleBulletAndCheckedList };