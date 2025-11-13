// In-memory dev store for Week 2–3. Resets on server restart.
type Item =
    | { id: string; title: string; html: string; markdown?: never }
    | { id: string; title: string; html?: never; markdown: string };

const mem = new Map<string, Item>();

export function saveItem(item: Item) {
    mem.set(item.id, item);
}

export function getItem(id: string) {
    return mem.get(id) ?? null;
}
