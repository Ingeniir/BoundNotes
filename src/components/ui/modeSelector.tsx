import { For, Show, createSignal } from "solid-js";
import { Motion, Presence } from "solid-motionone"; // Ajuste l'import selon ta lib d'animation
import { Eye, PencilLine, Columns2 } from "lucide-solid"; // Exemple d'icônes
import { IconButton } from "./IconButton";
import { editorMode, setEditorMode } from "@stores/uiStore";

export function ModeSelector(props: { handleClick: (message: string) => void }) {
    const [hoveredMode, setHoveredMode] = createSignal<string | null>(null);

    const modes = [
        { id: "editor", label: "Éditeur", icon: PencilLine, toast: "Mode édition activé" },
        { id: "preview", label: "Rendu", icon: Eye, toast: "Mode rendu activé" },
        { id: "split", label: "Split", icon: Columns2, toast: "Mode partagé activé" },
    ];

    const handleToggleEditorPreview = () => {
        if (editorMode() === "editor") {
            setEditorMode("preview");
            props.handleClick("Mode rendu activé");
        } else {
            // Si on était en preview (ou même en split), on repasse en éditeur
            if (editorMode() === "split") props.handleClick("Mode édition activé");
            setEditorMode("editor");
            props.handleClick("Mode édition activé");
        }
    };

    const toggleButtonConfig = () => {
        if (editorMode() === "editor") {
            return { label: "Voir le rendu", icon: Eye, active: false };
        }
        return { label: "Éditer la note", icon: PencilLine, active: editorMode() === "preview" };
    };
    return (
        <div class="flex items-center gap-1">
            <button
                title={toggleButtonConfig().label}
                onClick={handleToggleEditorPreview}
                onMouseEnter={() => setHoveredMode("editor")}
                onMouseLeave={() => setHoveredMode(null)}
                class="p-1 rounded focus:outline-none hover:bg-neutral-100 transition-colors duration-200"
            >
                <div
                    class="flex items-center justify-center transition-all duration-200"
                    style={{
                        transform: hoveredMode() ? "scale(1.05)" : "scale(1)",
                    }}
                >
                    {(() => {
                        const Icon = toggleButtonConfig().icon;
                        return <Icon size={16} />;
                    })()}
                </div>
            </button>

            <IconButton
                label="Écran partagé"
                active={editorMode() === "split"}
                onClick={() => setEditorMode("split")}
            >
                <div
                    class="flex items-center justify-center"
                    style={{ color: editorMode() === "split" ? "#2563eb" : "currentColor" }}
                >
                    <Columns2 size={16} />
                </div>
            </IconButton>
        </div>
    );
}