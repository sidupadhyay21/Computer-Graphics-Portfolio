/*jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

// Load the environment map
const loader = new T.CubeTextureLoader();
const envMap = loader.load([
    "./P2-sidupadhyay21/for_students/px.png", // Positive X
    "./P2-sidupadhyay21/for_students/nx.png", // Negative X
    "./P2-sidupadhyay21/for_students/py.png", // Positive Y
    "./P2-sidupadhyay21/for_students/ny.png", // Negative Y
    "./P2-sidupadhyay21/for_students/pz.png", // Positive Z
    "./P2-sidupadhyay21/for_students/nz.png"  // Negative Z
]);

/** @type {number} */ let skyscraperCount = 0;
/** @type {T.BoxGeometry} */ const boxGeometry = new T.BoxGeometry();
/** @type {String[]} */ const skyscraperColors = ["rgb(240, 240, 240)"];
/** @type {T.MeshPhongMaterial[]} */ const skyscraperMaterials = skyscraperColors.map(c => new T.MeshPhongMaterial({ color: c }));

/** @type {T.BoxGeometry} */ const windowGeometry = new T.BoxGeometry(1/3, 1/20, 0.05); // Adjusted to cover the whole side
const windowMaterial = new T.MeshStandardMaterial({ envMap: envMap, metalness: 1, roughness: 0 });

export class Skyscraper extends GrObject {
  /**
   * The constructor
   * @param {Object} params Parameters
   */
  constructor(params = {}) {
    // Set up an empty group and call the GrObject constructor
    /** @type {T.Group} */ const skyscraperGroup = new T.Group();
    super(`Skyscraper-${++skyscraperCount}`, skyscraperGroup);
    // Copy all the parameters with defaults
    /** @type {number} */ const length = params.length || 1; // The length
    /** @type {number} */ const width = params.width || 1; // The width
    /** @type {number} */ const height = params.height || 5; // The height
    /** @type {number} */ const x = params.x || 0; // Position x
    /** @type {number} */ const y = params.y || 0; // Position y
    /** @type {number} */ const z = params.z || 0; // Position z
    /** @type {number} */ const scale = params.scale || 2.5; // Scale
    /** @type {number} */ const color = params.index || 0; // Color
    /** @type {T.MeshPhongMaterial} */ const door = skyscraperMaterials[color]; // Use wall material for the door
    /** @type {T.MeshPhongMaterial} */ const wall = skyscraperMaterials[color];
    /** @type {T.Mesh} */ const base = new T.Mesh(boxGeometry, [wall, wall, wall, wall, door, door]);
    // Set the transformations for the base
    base.scale.set(length, height, width);
    base.translateY(height * 0.5); // CS559 Sample Code
    // Put everything into the group and transform the group
    skyscraperGroup.add(base); // Only add the base
    skyscraperGroup.position.set(x, y, z); // CS559 Sample Code
    skyscraperGroup.scale.set(scale, scale, scale);

    // Add tiled windows to cover the entire sides of the house
    const windowRows = 33; // Number of rows of windows
    const windowCols = 3; // Number of columns of windows
    const windowSpacingX = length / windowCols; // Horizontal spacing
    const windowSpacingY = height / windowRows; // Vertical spacing

    // Front side windows
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const frontWindow = new T.Mesh(windowGeometry, windowMaterial);
        frontWindow.position.set(
          -length / 2 + windowSpacingX * (col + 0.5),
          windowSpacingY * (row + 0.5),
          width * 0.51
        );
          skyscraperGroup.add(frontWindow);
      }
    }

    // Back side windows
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const backWindow = new T.Mesh(windowGeometry, windowMaterial);
        backWindow.position.set(
          -length / 2 + windowSpacingX * (col + 0.5),
          windowSpacingY * (row + 0.5),
          -width * 0.51
        );
        skyscraperGroup.add(backWindow);
      }
    }

    // Right side windows
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const rightWindow = new T.Mesh(windowGeometry, windowMaterial);
        rightWindow.position.set(
          width * 0.51,
          windowSpacingY * (row + 0.5),
          -length / 2 + windowSpacingX * (col + 0.5)
        );
        rightWindow.rotation.y = Math.PI / 2;
        skyscraperGroup.add(rightWindow);
      }
    }

    // Left side windows
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const leftWindow = new T.Mesh(windowGeometry, windowMaterial);
        leftWindow.position.set(
          -width * 0.51,
          windowSpacingY * (row + 0.5),
          -length / 2 + windowSpacingX * (col + 0.5)
        );
        leftWindow.rotation.y = Math.PI / 2;
        skyscraperGroup.add(leftWindow);
      }
    }
  }
}