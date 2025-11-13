export type ShareRecord = {
    id: string;
    title: string;
    html?: string;
    markdown?: string;
};

const store = new Map<string, ShareRecord>();

export function putShare(rec: ShareRecord) {
    store.set(rec.id, rec);
}

export function getShare(id: string) {
    return store.get(id) ?? null;
}
