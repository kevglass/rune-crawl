import { ModelRef, loadModel } from "./modelLoader";
import { townModelMapping } from "./town";

const townModels: Record<string, ModelRef> = {};

export function loadAllTownModels(): void {
    for (const ref of Object.values(townModelMapping)) {
        townModels[ref] = loadModel(ref);
    }
}

export function getTownModel(ref: string): ModelRef {
    return townModels[ref];
}