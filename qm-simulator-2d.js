let canvas = document.getElementById("sketch-canvas");
let gl = canvas.getContext("webgl");
gl.getExtension('OES_texture_float');
gl.getExtension('OES_texture_float_linear');


let vShader = makeShader(gl.VERTEX_SHADER, vertexShaderSource);
let realTimeStepShader = makeShader(gl.FRAGMENT_SHADER, realTimeStepFragmentSource);
let realTimeStepProgram = makeProgram(vShader, realTimeStepShader);
let imagTimeStepShader = makeShader(gl.FRAGMENT_SHADER, imagTimeStepFragmentSource);
let imagTimeStepProgram = makeProgram(vShader, imagTimeStepShader);
let initialWaveShader = makeShader(gl.FRAGMENT_SHADER, initialWaveFragmentSource);
let initialWaveProgram = makeProgram(vShader, initialWaveShader);
let initPotentialShader = makeShader(gl.FRAGMENT_SHADER, initializePotentialFragmentSource);
let initPotentialProgram = makeProgram(vShader, initPotentialShader);
let reshapePotentialShader = makeShader(gl.FRAGMENT_SHADER, reshapePotentialFragmentSource);
let shapePotentialProgram = makeProgram(vShader, reshapePotentialShader);
let displayShader = makeShader(gl.FRAGMENT_SHADER, viewFrameFragmentSource);
let displayProgram = makeProgram(vShader, displayShader);
let copyToShader = makeShader(gl.FRAGMENT_SHADER, copyOverFragmentSource);
let copyToProgram = makeProgram(vShader, copyToShader);


let canvasStyleWidth = parseInt(canvas.style.width);
let canvasStyleHeight = parseInt(canvas.style.height);
canvasStyleWidth = parseInt(window.innerHeight*0.95);
canvasStyleHeight = parseInt(window.innerHeight*0.95);
canvas.style.width = `${canvasStyleWidth}px`;
canvas.style.height = `${canvasStyleHeight}px`;
let scale = {w: canvasStyleWidth/canvas.width, 
             h: canvasStyleHeight/canvas.height};
let pixelWidth = canvas.width, pixelHeight = canvas.height;
let width = 64.0, height = 64.0;
let gui = new dat.GUI();
let controls = {
    speed: 6, 
    px: 0.0,
    py: 0.0,
    probabilityDistribution: false,
    displayOutline: false,
    mouseMode: 'new ψ(x, y)',
    presetPotentials: 'SHO',
    useTextureCoordinates: true,
    enterPotential: 'V(x, y)',
    // measurePosition: ev => console.log('clicked')
    };
// gui.add(controls, 'realImaginary').name('complex phase');
// |ψ(x, y)|²
// let folderView = gui.addFolder('View Mode');
gui.add(controls, 'probabilityDistribution').name('Show Probability Density');
let iter = gui.add(controls, 'speed', 0, 12).name('Speed');
iter.stepValue = 1.0;
// let folderInit = gui.addFolder('Initial Wavefunction')

// How to do dropdowns in dat.gui:
// https://stackoverflow.com/questions/30372761/
// Question by Adi Shavit (https://stackoverflow.com/users/135862/adi-shavit)
// Answer (https://stackoverflow.com/a/31000465)
// by Djuro Mirkovic (https://stackoverflow.com/users/4972372/djuro-mirkovic)
gui.add(controls, 'mouseMode', ['new ψ(x, y)', 'reshape V(x, y)']).name('Mouse');
gui.add(controls, 'presetPotentials', ['ISW', 'SHO', 'Double Slit']).name('Preset Potential');
let moreControlsFolder = gui.addFolder('More Controls');
let textEditPotential = moreControlsFolder.addFolder('Text Edit Potential');
textEditPotential.add(controls, 'useTextureCoordinates').name('Use Tex Coordinates');
textEditPotential.add(controls, 'enterPotential').name('Enter Potential V(x, y)');
// gui.add(controls, 'measurePosition', 1).name('Measure position');


// new Promise(() => setTimeout(main, 500));
main();
function main() {

    let draw = () => gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    let viewFrame = new Frame(pixelWidth, pixelHeight, 0);

    let swapFrames = [1, 2, 3, 4].map(i => new Frame(pixelWidth, pixelHeight, i));
    let t = 3;
    let swap = () => swapFrames = [swapFrames[2], swapFrames[3], 
                                   swapFrames[0], swapFrames[1]];

    let storeFrame = new Frame(pixelWidth, pixelHeight, 5);

    let nullTexNumber = 7;

    let potentialFrame = new Frame(pixelWidth, pixelHeight, 6);
    potentialFrame.presetPotentials = controls.presetPotentials;
    potentialFrame.enterPotential = controls.enterPotential;
    potentialFrame.useTextureCoordinates = controls.useTextureCoordinates;
    initializePotential('SHO');


    let bx = 0; let by = 0;
    let mouseUse = false;
    let mouseAction = false;

    function initializePotential(type) {
        gl.activeTexture(gl.TEXTURE0 + nullTexNumber);
        potentialFrame.useProgram(initPotentialProgram);
        potentialFrame.bind();
        if (type === 'SHO') {
            potentialFrame.setFloatUniforms({a: 50.0});
            potentialFrame.setIntUniforms({potentialType: 1});
        } else if (type == 'Double Slit') {

            let doubleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.46, x2: 0.54, 
                                      spacing: 0.02, a: 50.0};
            potentialFrame.setFloatUniforms(doubleSlitUniforms);
            potentialFrame.setIntUniforms({potentialType: 2});
            mouseAction = true;
            bx = pixelWidth/2;
            by = pixelHeight*0.75;
            controls.py = 40.0;
            controls.px = 0.0;
            // controls.mouseMode = 'new ψ(x, y)';
        } else {
            potentialFrame.setFloatUniforms({a: 0.0});
            potentialFrame.setIntUniforms({potentialType: 3});
        }
        draw();
        unbind();
    }

    function reshapePotential() {
        gl.activeTexture(gl.TEXTURE0 + potentialFrame.frameNumber);
        storeFrame.useProgram(shapePotentialProgram);
        storeFrame.bind();
        gl.bindTexture(gl.TEXTURE_2D, potentialFrame.frameTexture);
        storeFrame.setFloatUniforms({bx: bx/canvas.width, 
                                     by: 1.0 - by/canvas.height,
                                     v2: 30.0});
        storeFrame.setIntUniforms({tex1: potentialFrame.frameNumber});
        draw();
        unbind();
        gl.activeTexture(gl.TEXTURE0 + storeFrame.frameNumber);
        potentialFrame.useProgram(copyToProgram);
        potentialFrame.bind();
        potentialFrame.setIntUniforms({tex1: storeFrame.frameNumber, 
                                       tex2: nullTexNumber});
        draw();
        unbind();
    }

    function createNewWave() {
        gl.activeTexture(gl.TEXTURE0);
        swapFrames[t].useProgram(initialWaveProgram);
        swapFrames[t].bind();
        gl.bindTexture(gl.TEXTURE_2D, makeTexture(null, pixelWidth, pixelHeight));
        swapFrames[t].setFloatUniforms({dx: 1.0/pixelWidth, dy: 1.0/pixelHeight,
                                            px: controls.px, py: controls.py,
                                            bx: bx/canvas.width, 
                                            by: 1.0 - by/canvas.height});
        draw();
        unbind();
        gl.activeTexture(gl.TEXTURE0 + swapFrames[t].frameNumber);
        gl.bindTexture(gl.TEXTURE_2D, swapFrames[t].frameTexture);
        storeFrame.useProgram(copyToProgram);
        storeFrame.bind();
        storeFrame.setIntUniforms({tex1: swapFrames[t].frameNumber, 
                                   tex2: nullTexNumber});
        draw();
        unbind();
    }

    function copyNewWaveToFrames() {
        for (let k = 0; k < swapFrames.length - 1; k++) {
            swapFrames[t].useProgram(copyToProgram);
            swapFrames[t].bind();
            swapFrames[t].setIntUniforms({// tex1: swapFrames[k].frameNumber, 
                                          tex1: nullTexNumber, 
                                          tex2: nullTexNumber});
            draw();
            unbind();
            swapFrames[k].useProgram(copyToProgram);
            swapFrames[k].bind();
            swapFrames[k].setIntUniforms({tex1: storeFrame.frameNumber, 
                                            tex2: swapFrames[t].frameNumber});
            draw();
            unbind();
        }
    }

    function timeStepWave() {
        swapFrames[t-1].useProgram(realTimeStepProgram);
        swapFrames[t-1].bind();
        swapFrames[t-1].setFloatUniforms({dx: width/pixelWidth, dy: height/pixelHeight, 
                                        dt: 0.01, w: width, h: height, m: 1.0, hbar: 1.0});
        swapFrames[t-1].setIntUniforms({texPsi: swapFrames[t-2].frameNumber,
                                        texV: potentialFrame.frameNumber});
        draw();
        unbind();
        swapFrames[t].useProgram(imagTimeStepProgram);
        swapFrames[t].bind();
        swapFrames[t].setFloatUniforms({dx: width/pixelWidth, dy: height/pixelHeight, 
                                        dt: 0.01, w: width, h: height, m: 1.0, hbar: 1.0});
        swapFrames[t].setIntUniforms({texPsi: swapFrames[t-1].frameNumber,
                                      texV: potentialFrame.frameNumber});
        draw();
        unbind();
    }

    function display() {
        gl.activeTexture(gl.TEXTURE0);
        viewFrame.useProgram(displayProgram);
        viewFrame.bind();
        viewFrame.setIntUniforms({tex1: swapFrames[t-1].frameNumber,
                                  tex2: swapFrames[t-2].frameNumber,
                                  tex3: swapFrames[t-3].frameNumber,
                                  texV: potentialFrame.frameNumber,
                                  displayMode: (controls.probabilityDistribution)? 1: 0});
        draw();
        unbind();
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    function onPotentialChange() {
        if (controls.presetPotentials !== potentialFrame.presetPotentials) {
            potentialFrame.presetPotentials = controls.presetPotentials;
            initializePotential(controls.presetPotentials);
            return;
        }
        if ((controls.enterPotential !== potentialFrame.enterPotential) ||
           (controls.useTextureCoordinates !== 
            potentialFrame.useTextureCoordinates)) {
            potentialFrame.useTextureCoordinates = controls.useTextureCoordinates;
            potentialFrame.enterPotential = controls.enterPotential;
            gl.activeTexture(gl.TEXTURE0 + nullTexNumber);
            let expr = potentialFrame.enterPotential;
            expr = replaceIntsToFloats(expr);
            let shader = createFunctionShader(expr, []);
            if (shader === null) {
                return;
            }
            let program = makeProgram(vShader, shader);
            potentialFrame.useProgram(program);
            potentialFrame.bind();
            // gl.bindTexture(gl.TEXTURE_2D, potentialFrame.frameTexture);
            if (controls.useTextureCoordinates) {
                potentialFrame.setFloatUniforms({xScale: 1.0, yScale: 1.0});
            } else {
                potentialFrame.setFloatUniforms({xScale: width, yScale: height});
            }
            draw();
            unbind();
        }
    }

    function animate() {
        onPotentialChange();
        if (mouseAction) {
            if (controls.mouseMode[0] === 'n') {
                createNewWave();
                copyNewWaveToFrames();
            } else {
                reshapePotential();
            }
            mouseAction = false;
        }
        for (let i = 0; i < controls.speed; i++) {
            timeStepWave();
            swap();
        }
        display();
        requestAnimationFrame(animate);
    }

    let mousePos = function(ev, mode) {
        if (mode == 'move') {
            let prevBx = bx;
            let prevBy = by;
            bx = Math.floor((ev.clientX - canvas.offsetLeft))/scale.w;
            by = Math.floor((ev.clientY - canvas.offsetTop))/scale.h;
            controls.px = parseInt(bx - prevBx);
            if (Math.abs(controls.px) > 60.0) {
                controls.px = Math.sign(controls.px)*60.0;
            }
            controls.py = -parseInt(by - prevBy);
            if (Math.abs(controls.py) > 60.0) {
                controls.py = Math.sign(controls.py)*60.0;
            }
        }
        if (mouseUse) {
            if (bx < canvas.width && by < canvas.height && 
                bx >= 0 && by >= 0) mouseAction = true;
        }
    }

    let touchReleaseWave = function(ev) {
        let touches = ev.changedTouches;
        if (touches.length >= 1) {
            bx = Math.floor((touches[0].pageX - canvas.offsetLeft));
            by = Math.floor((touches[0].pageY - canvas.offsetTop));
        }
    }

    document.addEventListener("touchstart", ev => touchReleaseWave(ev));
    document.addEventListener("touchmove", ev => touchReleaseWave(ev));   
    document.addEventListener("touchevent", ev => touchReleaseWave(ev));
    document.addEventListener("mouseup", ev => {
        mousePos(ev, 'up');
        mouseUse = false;
    });
    document.addEventListener("mousedown", () => mouseUse = true);
    document.addEventListener("mousemove", ev => mousePos(ev, 'move'));

    animate();
}
