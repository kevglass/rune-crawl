import { BoxGeometry, Mesh, MeshBasicMaterial, Scene } from "three";
import { instanceModel } from "./modelLoader";
import { Town, townModelMapping } from "./town";
import { getTownModel } from "./townModels";
import { collisionCellsPerTownCell, collisionCellSize, renderSize } from "./contants";

export function renderTown(scene: Scene, town: Town): void {
    for (let x = 0; x < town.size; x++) {
        for (let y = 0; y < town.size; y++) {
            const segment = town.map[x + (y * town.size)];
            if (segment) {
                const ref = townModelMapping[segment.model];
                if (ref) {
                    const template = getTownModel(ref);
                    const model = instanceModel(template);
                    scene.add(model);
                    model.scale.set(renderSize / 2, renderSize / 2, renderSize / 2);
                    model.rotateY(segment.rotation);
                    model.position.x = ((x + 0.5) * (renderSize))
                    model.position.z = ((y + 0.5) * (renderSize));
                }
            }
        }
    }
    for (const item of town.items) {
        const ref = townModelMapping[item.model];
        if (ref) {
            const template = getTownModel(ref);
            const model = instanceModel(template);
            scene.add(model);
            model.scale.set(renderSize / 2, renderSize / 2, renderSize / 2);
            model.rotateY(item.rotation);
            model.position.x = ((item.x + 0.5) * renderSize)
            model.position.z = ((item.y + 0.5) * renderSize)
        }
    }

    // collision mesh drawing
    // for (let bx = 8; bx < 10; bx++) {
    //     for (let by = 9; by < 10; by++) {
    //         for (let x = 0; x < collisionIntervals; x++) {
    //             for (let y = 0; y < collisionIntervals; y++) {
    //                 const xp = ((bx * collisionIntervals) + x);
    //                 const yp = ((by * collisionIntervals) + y);
    //                 const index = xp + (yp * town.collisionGridSize);
    //                 const collisionInfo = town.collision[index];
    //                 if (collisionInfo) {
    //                     const h = collisionInfo.max - collisionInfo.min;

    //                     const geometry = new BoxGeometry(collisionResolution, h, collisionResolution);
    //                     const material = new MeshBasicMaterial({ color: 0xFF0000 });
    //                     material.wireframe = true;
    //                     const cube = new Mesh(geometry, material);
    //                     cube.scale.set(1, renderSegmentSize / 2, 1);
    //                     cube.translateX((xp + 0.5) * collisionResolution);
    //                     cube.translateZ((yp + 0.5) * collisionResolution);
    //                     cube.translateY(collisionInfo.min + ((h * renderSegmentSize / 2) / 2));
    //                     scene.add(cube);
    //                 }
    //             }
    //         }
    //     }
    // }
}