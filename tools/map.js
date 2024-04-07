import { GLTFLoader } from 'node-three-gltf';
import * as THREE from 'three';
import fs from "fs";

// run npx serve@latest to make content available

const loader = new GLTFLoader();
const size = 20;
const resolution = 2 / size;

console.log(resolution, size);

function getPoint(position, index) {
    return {
        x: position.array[(index * 3) + 0],
        y: position.array[(index * 3) + 1],
        z: position.array[(index * 3) + 2],
    }
}

function recordScanLine(heights, pt1, pt2) {
    const dx = pt2.x - pt1.x;
    const dy = pt2.y - pt1.y;
    const dz = pt2.z - pt1.z;

    const step = 0.01;
    for (let i=0;i<1;i+=step) {
        const x = pt1.x + (dx * i);
        const y = pt1.y + (dy * i);
        const z = pt1.z + (dz * i);

        let tx = Math.floor((x + 1) / resolution);
        let ty = Math.floor((z + 1) / resolution);
        if (tx < 0) {
            tx = 0;
        }
        if (ty < 0) {
            ty = 0;
        }
        if (tx >= size) {
            tx = size - 1;
        }
        if (ty >= size) {
            ty = size - 1;
        }
        const current = heights[tx + (ty * size)];
        heights[tx + (ty * size)].max = Math.max(current.max, y);
        heights[tx + (ty * size)].min = Math.min(current.min, y);
    }
}

function recordScanLines(heights, pt1, pt2, pt3) {
    // fan out across the triangle recording scan lines
    const step = 0.01;
    for (let i=0;i<=1;i+=step) {
        let o = 1 - i;
        recordScanLine(heights, pt1, {
            x: (pt2.x * i) + (pt3.x * o),
            y: (pt2.y * i) + (pt3.y * o),
            z: (pt2.z * i) + (pt3.z * o),
        });
    }
}

const models = fs.readdirSync("../src/assets/world");
for (const modelSrc of models) {
    if (!modelSrc.endsWith(".glb") && !modelSrc.endsWith(".gltf")) {
        continue;
    }
    loader.load("../src/assets/world/" + modelSrc, (model) => {
        const heights = [];

        console.log("Processing: " + modelSrc);
        for (let x=0;x<size;x++) {
            for (let y=0;y<size;y++) {
                heights[x + (y * size)] = { min: 100, max: 0 };
            }
        }
        model.scene.traverse(child => {
            if (child.isMesh) {
                const index = child.geometry.index.array;
                const pos = child.geometry.attributes.position;

                for (let i=0;i<child.geometry.index.array.length;i+=3) {

                    const pt1 = getPoint(pos, index[i]);
                    const pt2 = getPoint(pos, index[i+1]);
                    const pt3 = getPoint(pos, index[i+2]);

                    recordScanLines(heights, pt1, pt2, pt3);
                }
            }
        })

        const result = [];

        for (let y=0;y<size;y++) {
            for (let x=0;x<size;x++) {
                const height = heights[x + (y * size)];
                if (height.min <= height.max && height.min < 0.5) {
                    result.push(Math.floor(height.max * 100) / 100);
                } else {
                    result.push(0);
                }
            }
        }

        const data = {
            name: modelSrc,
            resolution,
            size,
            heights: result
        };

        fs.writeFileSync("../src/assets/collision/"+modelSrc+".json", JSON.stringify(data));
    })
}
