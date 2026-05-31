import { load } from "@tauri-apps/plugin-store";

const STORE_FILE = "app-state.json";

let store: Awaited<ReturnType<typeof load>> | null = null;

const getStore = async () => {
    if (!store) store = await load(STORE_FILE, { defaults: { lastNodeId: null }, autoSave: true });
    return store;
}

export const persistLastNodeId = async (id: string | null) => {
    const s = await getStore();
    await s.set("lastNodeId", id);
}

export const getLastNodeId = async (): Promise<string | null> => {
    const s = await getStore();
    const value = await s.get<string>("lastNodeId");

    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "object" && "value" in (value as any)) {
        return (value as any).value as string;
    }
    return null;
}