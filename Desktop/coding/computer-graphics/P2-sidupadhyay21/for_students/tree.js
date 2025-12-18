/*jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";


class AppleTree extends GrObject {
    constructor(x = 0, y = 0, z = 0) { // Accept position arguments with default values
        let treeGroup = new T.Group();

        // Trunk of the tree
        let trunkGeom = new T.CylinderGeometry(0.2, 0.2, 1.5, 16);
        let trunkMat = new T.MeshStandardMaterial({ color: "brown" });
        let trunk = new T.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 0.75; // Raise the trunk to align with the ground
        treeGroup.add(trunk);

        // Foliage of the tree with texture
        let textureLoader = new T.TextureLoader();
        let foliageTexture = textureLoader.load("./P2-sidupadhyay21/for_students/apple.jpeg");
        foliageTexture.wrapS = T.RepeatWrapping;
        foliageTexture.wrapT = T.RepeatWrapping;
        foliageTexture.repeat.set(2, 2); // Adjust repeat to zoom out on the texture
        let foliageGeom = new T.SphereGeometry(0.8, 16, 16);
        let foliageMat = new T.MeshStandardMaterial({ map: foliageTexture });
        let foliage = new T.Mesh(foliageGeom, foliageMat);
        foliage.position.y = 1.6; // Position foliage on top of the trunk
        treeGroup.add(foliage);

        super("AppleTree", treeGroup);

        // Set the position of the tree
        treeGroup.position.set(x, y, z);
    }
}

export {AppleTree };

