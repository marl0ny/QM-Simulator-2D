let divCanvas = document.getElementById('div-canvas');
let windowScale = 0.96;
let w = 512, h = 512;
divCanvas.innerHTML = `
<canvas id="sketch-canvas",
        width="${w}", 
        height="${h}",
        text="WebGL not supported",
        style = "touch-action: none; width: 700px; height: 512px; 
                 border: solid white 1px; top: 0px; bottom: 0px;">
`;
let divImageCanvas = document.getElementById("div-image-canvas");
divImageCanvas.innerHTML = `<canvas id="image-canvas" hidden="true"
                            width="${w}" height="${h}"></canvas>`;

// divImageCanvas.innerHTML = `<canvas id="image-canvas" `;
// divImageCanvas.innerHTML += `hidden="true" width="${w}" height="${h}"> `;
// divImageCanvas.innerHTML += `</canvas>`;
let canvas = document.getElementById("sketch-canvas");
let canvasStyleWidth = parseInt(canvas.style.width);
let canvasStyleHeight = parseInt(canvas.style.height);
let width = (canvas.width/512)*64.0*Math.sqrt(2.0);
let height = (canvas.height/512)*64.0*Math.sqrt(2.0);

function setCanvasStyleWidthAndHeight(width, height) {
    if (window.innerHeight < window.innerWidth) {
        canvasStyleWidth = parseInt((width/height)*
                                    window.innerHeight*windowScale);
        canvasStyleHeight = parseInt(window.innerHeight*windowScale);
    } else {
        canvasStyleWidth = parseInt(window.innerWidth*windowScale);
        canvasStyleHeight = parseInt((height/width)*
                                     window.innerWidth*windowScale);
    }
    canvas.style.width = `${canvasStyleWidth}px`;
    canvas.style.height = `${canvasStyleHeight}px`;
}
setCanvasStyleWidthAndHeight(width, height);

let scale = {w: canvasStyleWidth/canvas.width,
             h: canvasStyleHeight/canvas.height};
let pixelWidth = canvas.width, pixelHeight = canvas.height;


function resizeCanvas(newWidth, newHeight) {
    let divCanvas = document.getElementById('div-canvas');
    // divCanvas.innerHTML = ``;
    document.getElementById('sketch-canvas').remove();
    divCanvas.innerHTML = `<canvas id="sketch-canvas",
                            width="${newWidth}", height="${newHeight}",
                            text="WebGL not supported",
                            style = "touch-action: none; 
                            width: 700px; height: 512px; 
                            border: solid white 1px;
                            top: 0px; bottom: 0px;">`;
    canvas = document.getElementById("sketch-canvas");
    let divImageCanvas = document.getElementById("div-image-canvas");
    divImageCanvas.innerHTML = `<canvas id="image-canvas" 
                                hidden="true"
                                width="${newWidth}" 
                                height="${newHeight}"></canvas>`;
    width = (canvas.width/512)*64.0*Math.sqrt(2.0);
    height = (canvas.height/512)*64.0*Math.sqrt(2.0);
    setCanvasStyleWidthAndHeight(width, height);
}
