const JSON = import.meta.glob("../assets/**/*.json", {
    query: '?raw',
    import: 'default',
    eager: true,
    
}) as Record<string, string>;

export const ASSETS: Record<string, string> = {};

for (const key in JSON) {
    ASSETS[key.substring("../assets/".length)] = JSON[key];
}