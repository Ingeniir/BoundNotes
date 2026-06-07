import { createSignal, onMount, onCleanup, type JSX } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { clsx } from "clsx";
import { Minus, Square, X, Maximize2 } from "lucide-solid";

import "@styles/titlebar.css";

export function TitleBar() {
    const appWindows = getCurrentWindow();
    const [isMaximized, setIsMaximized] = createSignal<boolean>(false);

    onMount(async () => {
        setIsMaximized(await appWindows.isMaximized());

        const unlisten = await appWindows.onResized(async () => {
            setIsMaximized(await appWindows.isMaximized());
        });

        onCleanup(() => unlisten());
    })

    const minimize = () => appWindows.minimize();
    const toggleMaximize = () => appWindows.toggleMaximize();
    const close = () => appWindows.close();

    return (
        <div
            data-tauri-drag-region
            class="h-9 shrink-0 flex items-center justify-between bg-gray-50 border-b border-gray-200 select-none"
        >
            <div
                data-tauri-drag-region
                class="flex-1 flex items-center px-4"
            >
                <span
                    data-tauri-drag-region
                    class="text-gray-400 font-medium font-roboto-slab"
                >
                    BoundNotes
                </span>
            </div>

            <div class="flex items-center h-full">
                <WindowButton
                    onClick={() => void minimize()}
                    label="Minimize"
                    class="hover:bg-gray-200"
                >
                    <Minus size={16} />
                </WindowButton>

                <WindowButton
                    onClick={() => void toggleMaximize()}
                    label={isMaximized() ? "Restaurer" : "Maximiser"}
                    class="hover:bg-gray-200"
                >
                    {isMaximized()
                        ? <Square size={12} strokeWidth={1.5} />
                        : <Maximize2 size={12} strokeWidth={1.5} />
                    }
                </WindowButton>

                <WindowButton
                    onClick={() => void close()}
                    label="Fermer"
                    class="hover:bg-red-500 hover:text-white"
                >
                    <X size={14} />
                </WindowButton>
            </div>
        </div>
    )
}

function WindowButton(props: {
    onClick: () => void;
    label: string;
    class?: string;
    children: JSX.Element;
}) {
    return (
        <button
            onClick={props.onClick}
            title={props.label}
            aria-label={props.label}
            class={clsx(
                "h-full w-10 flex items-center justify-center",
                "text-gray-500 transition-colors duration-150",
                props.class
            )}
        >
            {props.children}
        </button>
    );
}