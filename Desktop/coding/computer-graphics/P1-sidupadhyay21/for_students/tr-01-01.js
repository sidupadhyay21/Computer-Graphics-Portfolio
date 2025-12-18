/*jshint esversion: 6 */
// @ts-check

// these two things are the main UI code for the train
// students learned about them in last week's workbook
import { draggablePoints } from "../libs/CS559/dragPoints.js";
import { RunCanvas } from "../libs/CS559/runCanvas.js";
// this is a utility that adds a checkbox to the page 
// useful for turning features on and off
import { makeCheckbox, makeSpan } from "../libs/CS559/inputHelpers.js";

/** @type {Array<{x: number, y: number}>} */ let trees = [];
// Generate random trees
function generateTrees(count = 20) {
    trees = [];
    for (let i = 0; i < count; i++) {
        trees.push({
            x: Math.random() * 600,
            y: Math.random() * 600,
        });
    }
}

// Draw trees
function drawTrees(context) {
    trees.forEach(tree => {
        // Draw trunk
        context.fillStyle = "brown";
        context.fillRect(tree.x - 5, tree.y, 10, 20);
        // Draw leaves
        context.fillStyle = "green";
        context.beginPath();
        context.moveTo(tree.x, tree.y - 20);
        context.lineTo(tree.x - 15, tree.y);
        context.lineTo(tree.x + 15, tree.y);
        context.closePath();
        context.fill();
    });
}

/**
 * Helper function to compute control points for a Cardinal spline
 * @param {number[]} p0 - Previous point
 * @param {number[]} p1 - Current point
 * @param {number[]} p2 - Next point
 * @param {number[]} p3 - Next-next point
 * @returns {Array<number[]>} - Control points for the Bézier curve
 */
function getBezierControlPoints(p0, p1, p2, p3) {
    let t = tensionSlider.value;
    let cp1 = [
        p1[0] + (p2[0] - p0[0]) * t / 6,
        p1[1] + (p2[1] - p0[1]) * t / 6
    ];
    let cp2 = [
        p2[0] - (p3[0] - p1[0]) * t / 6,
        p2[1] - (p3[1] - p1[1]) * t / 6
    ];
    return [cp1, cp2];
}

/**
 * Helper function to compute a point on a Bézier curve
 * @param {number[]} p0 - Start point
 * @param {number[]} cp1 - First control point
 * @param {number[]} cp2 - Second control point
 * @param {number[]} p1 - End point
 * @param {number} t - Parameter (0 <= t <= 1)
 * @returns {number[]} - Point on the curve
 */
function getBezierPoint(p0, cp1, cp2, p1, t) {
    let x = Math.pow(1 - t, 3) * p0[0] +
            3 * Math.pow(1 - t, 2) * t * cp1[0] +
            3 * (1 - t) * Math.pow(t, 2) * cp2[0] +
            Math.pow(t, 3) * p1[0];
    let y = Math.pow(1 - t, 3) * p0[1] +
            3 * Math.pow(1 - t, 2) * t * cp1[1] +
            3 * (1 - t) * Math.pow(t, 2) * cp2[1] +
            Math.pow(t, 3) * p1[1];
    return [x, y];
}

/**
 * Helper function to compute the tangent vector on a Bézier curve
 * @param {number[]} p0 - Start point
 * @param {number[]} cp1 - First control point
 * @param {number[]} cp2 - Second control point
 * @param {number[]} p1 - End point
 * @param {number} t - Parameter (0 <= t <= 1)
 * @returns {number[]} - Tangent vector at the point
 */
function getBezierTangent(p0, cp1, cp2, p1, t) {
    let x = 3 * Math.pow(1 - t, 2) * (cp1[0] - p0[0]) +
            6 * (1 - t) * t * (cp2[0] - cp1[0]) +
            3 * Math.pow(t, 2) * (p1[0] - cp2[0]);
    let y = 3 * Math.pow(1 - t, 2) * (cp1[1] - p0[1]) +
            6 * (1 - t) * t * (cp2[1] - cp1[1]) +
            3 * Math.pow(t, 2) * (p1[1] - cp2[1]);
    return [x, y];
}

/**
 * Compute arc-length parameterization for the curve
 * @param {Array<number[]>} points - Control points
 * @param {number} resolution - Number of samples per segment
 * @returns {Array<number>} - Cumulative arc lengths
 */
function computeArcLengths(points, resolution = 100) {
    let arcLengths = [0];
    for (let i = 0; i < points.length; i++) {
        let p0 = points[(i - 1 + points.length) % points.length];
        let p1 = points[i];
        let p2 = points[(i + 1) % points.length];
        let p3 = points[(i + 2) % points.length];
        let [cp1, cp2] = getBezierControlPoints(p0, p1, p2, p3);
        let prevPoint = p1;
        for (let j = 1; j <= resolution; j++) {
            let t = j / resolution;
            let currentPoint = getBezierPoint(p1, cp1, cp2, p2, t);
            let dx = currentPoint[0] - prevPoint[0];
            let dy = currentPoint[1] - prevPoint[1];
            arcLengths.push(arcLengths[arcLengths.length - 1] + Math.sqrt(dx * dx + dy * dy));
            prevPoint = currentPoint;
        }
    }
    return arcLengths;
}

/**
 * Map a parameter value to arc-length parameterization
 * @param {number} param - Parameter value (0 to N)
 * @param {Array<number>} arcLengths - Cumulative arc lengths
 * @returns {number} - Mapped parameter value
 */
function mapToArcLength(param, arcLengths) {
    arcLengths = computeArcLengths(thePoints);
    let totalLength = arcLengths[arcLengths.length - 1];
    let targetLength = (param % thePoints.length) * (totalLength / thePoints.length);
    for (let i = 1; i < arcLengths.length; i++) {
        if (arcLengths[i] >= targetLength) {
            let t = (targetLength - arcLengths[i - 1]) / (arcLengths[i] - arcLengths[i - 1]);
            return (i - 1 + t) / (arcLengths.length - 1) * thePoints.length;
        }
    }
    return param; // Fallback
}

/**
 * Draw rail ties along the track
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {Array<number[]>} points - Control points
 * @param {Array<number>} arcLengths - Cumulative arc lengths
 * @param {number} spacing - Desired spacing between rail ties
 */
function drawRailTies(context, points, arcLengths, spacing = 20) {
    arcLengths = computeArcLengths(thePoints);
    let totalLength = arcLengths[arcLengths.length - 1]; // Total track length
    for (let s = 0; s <= totalLength; s += spacing) {
        // Map arc-length to parameter
        let param = mapToArcLength(s / totalLength * points.length, arcLengths);
        let segmentIndex = Math.floor(param);
        let t = param - segmentIndex;
        let p0 = points[(segmentIndex - 1 + points.length) % points.length];
        let p1 = points[segmentIndex];
        let p2 = points[(segmentIndex + 1) % points.length];
        let p3 = points[(segmentIndex + 2) % points.length];
        let [cp1, cp2] = getBezierControlPoints(p0, p1, p2, p3);
        // Compute position and tangent
        let tiePos = getBezierPoint(p1, cp1, cp2, p2, t);
        let tangent = getBezierTangent(p1, cp1, cp2, p2, t);
        let angle = Math.atan2(tangent[1], tangent[0]);
        // Draw rail tie
        context.save();
        context.translate(tiePos[0], tiePos[1]);
        context.rotate(angle + Math.PI / 2); // Rotate 90 degrees to make it perpendicular
        context.fillStyle = "brown";
        context.fillRect(-10, -2, 20, 4); // Small rectangle for the rail tie
        context.restore();
    }
}

/**
 * Draw parallel rails along the track
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {Array<number[]>} points - Control points
 * @param {number} railOffset - Distance between the rails
 * @param {number} resolution - Number of samples per segment
 */
function drawParallelRails(context, points, railOffset = 6, resolution = 100) {
    arcLengths = computeArcLengths(thePoints);
    context.strokeStyle = "black";
    context.lineWidth = 2;
    // Draw outer rail
    context.beginPath();
    for (let i = 0; i < points.length; i++) {
        let p0 = points[(i - 1 + points.length) % points.length];
        let p1 = points[i];
        let p2 = points[(i + 1) % points.length];
        let p3 = points[(i + 2) % points.length];
        let [cp1, cp2] = getBezierControlPoints(p0, p1, p2, p3);
        let prevPoint = getBezierPoint(p1, cp1, cp2, p2, 0);
        for (let t = 0; t <= 1; t += 1 / resolution) {
            let currentPoint = getBezierPoint(p1, cp1, cp2, p2, t);
            let tangent = getBezierTangent(p1, cp1, cp2, p2, t);
            let normal = [-tangent[1], tangent[0]]; // Perpendicular vector
            let length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2);
            normal = [normal[0] / length, normal[1] / length]; // Normalize
            let offsetPoint = [
                currentPoint[0] + normal[0] * railOffset,
                currentPoint[1] + normal[1] * railOffset,
            ];
            if (t === 0 && i === 0) {
                context.moveTo(offsetPoint[0], offsetPoint[1]);
            } else {
                context.lineTo(offsetPoint[0], offsetPoint[1]);
            }
            prevPoint = currentPoint;
        }
    }
    context.closePath();
    context.stroke();
    // Draw inner rail
    context.beginPath();
    for (let i = 0; i < points.length; i++) {
        let p0 = points[(i - 1 + points.length) % points.length];
        let p1 = points[i];
        let p2 = points[(i + 1) % points.length];
        let p3 = points[(i + 2) % points.length];
        let [cp1, cp2] = getBezierControlPoints(p0, p1, p2, p3);
        let prevPoint = getBezierPoint(p1, cp1, cp2, p2, 0);
        for (let t = 0; t <= 1; t += 1 / resolution) {
            let currentPoint = getBezierPoint(p1, cp1, cp2, p2, t);
            let tangent = getBezierTangent(p1, cp1, cp2, p2, t);
            let normal = [-tangent[1], tangent[0]]; // Perpendicular vector
            let length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2);
            normal = [normal[0] / length, normal[1] / length]; // Normalize
            let offsetPoint = [
                currentPoint[0] - normal[0] * railOffset,
                currentPoint[1] - normal[1] * railOffset,
            ];
            if (t === 0 && i === 0) {
                context.moveTo(offsetPoint[0], offsetPoint[1]);
            } else {
                context.lineTo(offsetPoint[0], offsetPoint[1]);
            }
            prevPoint = currentPoint;
        }
    }
    context.closePath();
    context.stroke();
}

/**
 * Draw the train and its cars
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {number} param - Train position parameter
 * @param {boolean} isMain - Whether this is the main train
 */
function drawTrain(context, param, isMain) {
    const carSpacing = 0.18; // Spacing between cars in parameter space
    const numCars = 3; // Number of cars including the engine
    const carColors = ["darkred", "purple", "blue"]; // Colors for each car

    for (let i = 0; i < numCars; i++) {
        let carParam = param - i * carSpacing;
        if (carParam < 0) {
            carParam += thePoints.length; // Wrap around the track
        }

        let segmentIndex = Math.floor(carParam); // Determine which segment the car is on
        let t = carParam - segmentIndex; // Parameter within the segment
        let p0 = thePoints[(segmentIndex - 1 + thePoints.length) % thePoints.length];
        let p1 = thePoints[segmentIndex];
        let p2 = thePoints[(segmentIndex + 1) % thePoints.length];
        let p3 = thePoints[(segmentIndex + 2) % thePoints.length];
        let [cp1, cp2] = getBezierControlPoints(p0, p1, p2, p3);

        // Compute car position and tangent
        let carPos = getBezierPoint(p1, cp1, cp2, p2, t);
        let tangent = getBezierTangent(p1, cp1, cp2, p2, t);
        let angle = Math.atan2(tangent[1], tangent[0]);

        // Draw the car
        context.save();
        context.translate(carPos[0], carPos[1]);
        context.rotate(angle);

        // Engine or car body
        context.fillStyle = carColors[i % carColors.length]; // Assign color based on index
        context.fillRect(-20, -10, 40, 20);

        if (i === 0) {
            // Engine front
            context.beginPath();
            context.moveTo(20, 0);
            context.lineTo(30, -10);
            context.lineTo(30, 10);
            context.closePath();
            context.fillStyle = "black";
            context.fill();
            // Train light
            context.beginPath();
            context.arc(35, 0, 10, 0, Math.PI * 2);
            context.closePath();
            context.fillStyle = "rgba(255, 255, 0, 0.5)";
            context.fill();
        }

        context.restore();
    }
}

// Generate initial trees
generateTrees();
let tensionSlider = /** @type {HTMLInputElement} */ (document.getElementById("tension"));
/**
 * Have the array of control points for the track be a "global" (to the module) variable
 * Note: the control points are stored as Arrays of 2 numbers, rather than
 * as "objects" with an x,y. Because we require a Cardinal Spline (interpolating)
 * the track is defined by a list of points.
 */
/** @type Array<number[]> */ 
let thePoints = [
  [100, 100], 
  [400, 200], 
  [400, 400], 
  [150, 500], 
];
// Precompute arc lengths for all points
let arcLengths = computeArcLengths(thePoints);

/**
 * Draw function - this is the meat of the operation
 *
 * It's the main thing that needs to be changed
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} param
 */
function draw(canvas, param) {
    arcLengths = computeArcLengths(thePoints);
    let context = canvas.getContext("2d");
    // clear the screen
    context.clearRect(0, 0, canvas.width, canvas.height);
    // make a green background
    context.fillStyle = "lightgreen";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw trees
    drawTrees(context);

    // draw the control points
    thePoints.forEach(function(pt) {
        context.beginPath();
        context.arc(pt[0], pt[1], 5, 0, Math.PI * 2);
        context.closePath();
        context.fillStyle = "black";
        context.fill();
    });
    // Check if "simple-track" checkbox is checked
    if (document.getElementById("check-simple-track").checked) {
        context.beginPath();
        for (let i = 0; i < thePoints.length; i++) {
            let p0 = thePoints[(i - 1 + thePoints.length) % thePoints.length];
            let p1 = thePoints[i];
            let p2 = thePoints[(i + 1) % thePoints.length];
            let p3 = thePoints[(i + 2) % thePoints.length];
            let [cp1, cp2] = getBezierControlPoints(p0, p1, p2, p3);
            if (i === 0) {
                context.moveTo(p1[0], p1[1]);
            }
            context.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], p2[0], p2[1]);
        }
        context.closePath();
        context.stroke();
    } else {
        // Draw rail ties and parallel rails when simple-track is unchecked
        drawRailTies(context, thePoints, arcLengths);
        drawParallelRails(context, thePoints);
    }
    // Draw rail ties along the track and the train
    drawTrain(context, param, true);
}

/**
 * Initialization code - sets up the UI and start the train
 */
let canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas1"));
let context = canvas.getContext("2d");
// we need the slider for the draw function, but we need the draw function
// to create the slider - so create a variable and we'll change it later
let slider;
// note: we wrap the draw call so we can pass the right arguments
function wrapDraw() {
    let param = Number(slider.value) % thePoints.length; // Ensure parameter wraps around
    if (document.getElementById("check-arc-length").checked) {
        param = mapToArcLength(param, arcLengths);
    }
    draw(canvas, param);
}

// create a UI
let runcanvas = new RunCanvas(canvas, wrapDraw);
// now we can connect the draw function correctly
slider = runcanvas.range;
// note: if you add these features, uncomment the lines for the checkboxes
// in your code, you can test if the checkbox is checked by something like:
// document.getElementById("check-simple-track").checked in your drawing code
// WARNING: makeCheckbox adds a "check-" to the id of the checkboxes
// makeCheckbox("simple-track");
// makeCheckbox("arc-length").checked=true;
// Checkboxes are now created in the HTML instead

// helper function - set the slider to have max = # of control points
function setNumPoints() {
    runcanvas.setupSlider(0, thePoints.length, 0.05);
}

setNumPoints();
runcanvas.setValue(0);

// Update arc lengths when points are dragged
function updateArcLengths() {
    arcLengths = computeArcLengths(thePoints); // Recompute arc lengths
    setNumPoints(); // Update slider range
    wrapDraw(); // Redraw the canvas
}

// add the point dragging UI
draggablePoints(canvas, thePoints, wrapDraw, 10, updateArcLengths);

// call draw() when a checkbox is clicked or the tension slider is changed
tensionSlider.oninput = wrapDraw;
document.getElementById("check-simple-track").onclick = wrapDraw;
document.getElementById("check-arc-length").onclick = wrapDraw;