let showFPS = false;
let canvasStyleWidth = parseInt(canvas.style.width);
let canvasStyleHeight = parseInt(canvas.style.height);
let windowScale = 0.96;
// let width = 85.3333333333*Math.sqrt(2.0), height = 64.0*Math.sqrt(2.0);
let width = 64.0*Math.sqrt(2.0), height = 64.0*Math.sqrt(2.0);
if (canvas.width === canvas.height && canvas.width  !== 512) {
    width = (canvas.width/512)*64.0*Math.sqrt(2.0);
    height = (canvas.width/512)*64.0*Math.sqrt(2.0);
}

if (window.innerHeight < window.innerWidth) {
    canvasStyleWidth = parseInt((width/height)*window.innerHeight*windowScale);
    canvasStyleHeight = parseInt(window.innerHeight*windowScale);
} else {
    canvasStyleWidth = parseInt(window.innerWidth*windowScale);
    canvasStyleHeight = parseInt((width/height)*window.innerWidth*windowScale);
}
canvas.style.width = `${canvasStyleWidth}px`;
canvas.style.height = `${canvasStyleHeight}px`;
let scale = {w: canvasStyleWidth/canvas.width,
             h: canvasStyleHeight/canvas.height};
let pixelWidth = canvas.width, pixelHeight = canvas.height;

