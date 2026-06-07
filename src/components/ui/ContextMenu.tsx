// components/ContextMenu.tsx
import { clsx } from "clsx";
import { onCleanup, onMount, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

interface ContextMenuProps {
    x: number;
    y: number;
    children: JSX.Element;
    onClose: () => void;
    source?: "note" | "notebook";
}

export function ContextMenu(props: ContextMenuProps) {

    onMount(() => {
        const handleClick = () => props.onClose();
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") props.onClose(); };

        window.addEventListener("click", handleClick);
        window.addEventListener("keydown", handleKey);

        onCleanup(() => {
            window.removeEventListener("click", handleClick);
            window.removeEventListener("keydown", handleKey);
        });
    });
    return (
        <Portal>
            <div
                class="fixed flex flex-col gap-0.5 z-50 w-48 bg-gray-800 text-white border border-gray-200 rounded-md shadow-xl py-1 px-1 text-sm"
                style={{
                    top: `${props.y}px`,
                    left: `${props.source === "note" ? props.x + 240 : props.x + 20}px`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {props.children}
            </div>
        </Portal>
    );
}

// Bouton réutilisable dans le menu
interface ContextMenuItemProps {
    onClick: () => void;
    danger?: boolean;
    children: JSX.Element;
}

export function ContextMenuItem(props: ContextMenuItemProps) {
    return (
        <button
            class={clsx(
                "w-full text-left px-4 py-2 hover:bg-gray-500 transition-colors rounded-md flex items-center gap-2",
                props.danger && "hover:text-red-400"
            )}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    );
}

export function ContextMenuSeparator() {
    return <div class="border-t border-gray-600 my-1" />;
}