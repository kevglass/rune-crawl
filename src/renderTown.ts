import { Object3D, Scene } from "three";
import { cloneModel } from "./modelLoader";
import { Town, townModelMapping } from "./town";
import { getTownModel } from "./townModels";
import { renderSize } from "./contants";

export function renderTown(scene: Scene, town: Town): Object3D[] {
    const objects: Object3D[] = [];

    for (let x = 0; x < town.size; x++) {
        for (let y = 0; y < town.size; y++) {
            const segment = town.map[x + (y * town.size)];
            if (segment) {
                const ref = townModelMapping[segment.model];
                if (ref) {
                    const template = getTownModel(ref);

                    const model = cloneModel(template);
                    model.scale.set(renderSize, renderSize, renderSize);
                    // model.scale.set(0.1, 0.1, 0.1);
                    model.rotateY(segment.rotation);
                    model.position.x = ((x + 0.5) * renderSize)
                    model.position.z = ((y + 0.5) * renderSize)
                    model.userData.cull = true;
                    scene.add(model);

                    model.frustumCulled = false;
                    model.matrixAutoUpdate = false;
                    model.updateMatrix();
                    objects.push(model);
                }
            }
        }
    }

    return objects;
}