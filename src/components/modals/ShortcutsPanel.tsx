// ShortcutsPanel.tsx
import { For, Show } from "solid-js";
import { shortcuts } from "@hooks/useKeyboardShortcuts";

import { X } from "lucide-solid";

export function ShortcutsPanel(props: { open: boolean; onClose: () => void }) {
    return (
        <Show when={props.open}>
            <div class="fixed inset-0 top-9 z-50 flex items-center justify-center bg-black/20">
                <div class="bg-white rounded-xl shadow-xl w-96 max-h-[70vh] overflow-y-auto p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="font-semibold text-gray-900">Raccourcis clavier</h2>
                        <button onClick={props.onClose} class="text-gray-400 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div class="space-y-1">
                        <For each={shortcuts}>
                            {(s) => (
                                <div class="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                                    <span class="text-sm text-gray-600">{s.description}</span>
                                    <kbd class="kbd text-gray-600">
                                        {[
                                            s.ctrl && "Ctrl",
                                            s.shift && "Shift",
                                            s.alt && "Alt",
                                            s.key
                                        ].filter(Boolean).join(" + ")}
                                    </kbd>
                                </div>
                            )}
                        </For>
                    </div>
                </div>
            </div>
        </Show>
    );
}