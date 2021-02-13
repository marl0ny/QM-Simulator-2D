let vShader = makeShader(gl.VERTEX_SHADER, vertexShaderSource);
let realTimeStepShader = makeShader(gl.FRAGMENT_SHADER, realTimestepFragmentSource);
let realTimeStepProgram = makeProgram(vShader, realTimeStepShader);
let imagTimeStepShader = makeShader(gl.FRAGMENT_SHADER, imagTimestepFragmentSource);
let imagTimeStepProgram = makeProgram(vShader, imagTimeStepShader);
let initialWaveShader = makeShader(gl.FRAGMENT_SHADER, initialWaveFragmentSource);
let initialWaveProgram = makeProgram(vShader, initialWaveShader);
let initPotentialShader = makeShader(gl.FRAGMENT_SHADER, initialPotentialFragmentSource);
let initPotentialProgram = makeProgram(vShader, initPotentialShader);
let reshapePotentialShader = makeShader(gl.FRAGMENT_SHADER, reshapePotentialFragmentSource);
let shapePotentialProgram = makeProgram(vShader, reshapePotentialShader);
let displayShader = makeShader(gl.FRAGMENT_SHADER, viewFrameFragmentSource);
let displayProgram = makeProgram(vShader, displayShader);
let copyToShader = makeShader(gl.FRAGMENT_SHADER, copyOverFragmentSource);
let copyToProgram = makeProgram(vShader, copyToShader);
let probDensityShader = makeShader(gl.FRAGMENT_SHADER, probDensityFragmentSource);
let probDensityProgram = makeProgram(vShader, probDensityShader);

gl.deleteShader(vShader);
gl.deleteShader(realTimeStepShader);
gl.deleteShader(imagTimeStepShader);
gl.deleteShader(initialWaveShader);
gl.deleteShader(initPotentialShader);
gl.deleteShader(reshapePotentialShader);
gl.deleteShader(displayShader);
gl.deleteShader(copyToShader);
gl.deleteShader(probDensityShader);

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
let gui = new dat.GUI();
measure = false;
let drawRect = {x: 0.0, y: 0.0, w: 0.0, h: 0.0};
let controls = {
    brightness: 4,
    speed: 6, 
    px: 0.0,
    py: 0.0,
    colourPhase: true,
    displayOutline: false,
    mouseMode: 'new ψ(x, y)',
    presetPotentials: 'SHO',
    useTextureCoordinates: true,
    enterPotential: 'V(x, y)',
    measurePosition: () => measure=true,
    dt: 0.01,
    m: 1.0,
    scaleP: 1.0,
    changeDimensions: '512x512',
    boundaries: 'default',
    sPeriodic: false,
    tPeriodic: false
    };
gui.add(controls, 'colourPhase').name('Colour Phase');
gui.add(controls , 'brightness', 0, 10).name('Brightness');
let iter = gui.add(controls, 'speed', 0, 20).name('Speed');
iter.step(1.0);

// How to do dropdowns in dat.gui:
// https://stackoverflow.com/questions/30372761/
// Question by Adi Shavit (https://stackoverflow.com/users/135862/adi-shavit)
// Answer (https://stackoverflow.com/a/31000465)
// by Djuro Mirkovic (https://stackoverflow.com/users/4972372/djuro-mirkovic)
let mouseMode = gui.add(controls, 'mouseMode', ['new ψ(x, y)', 'reshape V(x, y)', 
                                                'draw ROI']).name('Mouse');
gui.add(controls, 'presetPotentials', ['ISW', 'SHO', 'Double Slit', 
                                       'Single Slit', '1/r']).name('Preset Potential');
let presetControlsFolder = gui.addFolder('Preset Potential Sliders');
presetControlsFolder.controls = [];
gui.add(controls, 'measurePosition').name('Measure Position');
let moreControlsFolder = gui.addFolder('More Controls');
let changeDimensionsFolder = moreControlsFolder.addFolder('Change Grid Size');
let gridSelect = changeDimensionsFolder.add(controls, 'changeDimensions', ['400x400', '512x512', 
                                                          '640x640', '800x800']).name('Grid Size');
let textEditPotential = moreControlsFolder.addFolder('Text Edit Potential');
textEditPotential.add(controls, 'useTextureCoordinates').name('Use Tex Coordinates');
textEditPotential.add(controls, 'enterPotential').name('Enter Potential V(x, y)');
let textEditSubFolder = textEditPotential.addFolder('Edit variables');
textEditSubFolder.controls = [];
let editUniformsFolder = moreControlsFolder.addFolder('Edit Uniform Values');
editUniformsFolder.add(controls, 'm', 0.75, 10.0);
editUniformsFolder.add(controls, 'dt', -0.01, 0.01);
let boundariesFolder = moreControlsFolder.addFolder('Edit Boundary Type');
let sPeriodic = boundariesFolder.add(controls, 'sPeriodic').name('s periodic');
let tPeriodic = boundariesFolder.add(controls, 'tPeriodic').name('t periodic');
let rScaleV = 0.0;
let timeMilliseconds = 0;

// new Promise(() => setTimeout(main, 500));
main();
function main() {

    let viewFrame = new Frame(pixelWidth, pixelHeight, 0);

    let swapFrames = [1, 2, 3, 4].map(i => new Frame(pixelWidth, pixelHeight, i));
    let t = 3;
    let swap = () => swapFrames = [swapFrames[2], swapFrames[3], 
                                   swapFrames[0], swapFrames[1]];

    let storeFrame = new Frame(pixelWidth, pixelHeight, 5);

    let nullTexNumber = 8;

    let potentialFrame = new Frame(pixelWidth, pixelHeight, 6);
    potentialFrame.presetPotentials = controls.presetPotentials;
    potentialFrame.enterPotential = controls.enterPotential;
    potentialFrame.useTextureCoordinates = controls.useTextureCoordinates;
    initializePotential('SHO');

    let bx = 0; let by = 0;
    let mouseUse = false;
    let mouseAction = false;

    let potChanged = false;

    function changeBoundaries(s, t) {
        if (pixelWidth !== 512 && pixelHeight !== 512) {
            setFrameDimensions(512, 512);
        }
        viewFrame.setTexture(pixelWidth, pixelHeight, {s: s, 
            t: t});
        unbind();
        let frames = [].concat(swapFrames, storeFrame, potentialFrame);
        for (let frame of frames) {
        frame.setTexture(pixelWidth, pixelHeight, {s: s, 
                    t: t});
        frame.activateFramebuffer();
        unbind();
        initializePotential(controls.presetPotentials);
        }
    }
    sPeriodic.onChange(() => {

        let s = (controls.sPeriodic == true)? gl.REPEAT: gl.CLAMP_TO_EDGE;
        let t = (controls.tPeriodic == true)? gl.REPEAT: gl.CLAMP_TO_EDGE;
        changeBoundaries(s, t);
    });
    tPeriodic.onChange(() => {
        let s = (controls.sPeriodic == true)? gl.REPEAT: gl.CLAMP_TO_EDGE;
        let t = (controls.tPeriodic == true)? gl.REPEAT: gl.CLAMP_TO_EDGE;
        changeBoundaries(s, t);
    });


    function setFrameDimensions(newWidth, newHeight) {
        document.getElementById('sketch-canvas').width = newWidth;
        document.getElementById('sketch-canvas').height = newHeight;
        width = (canvas.width/512)*64.0*Math.sqrt(2.0);
        height = (canvas.width/512)*64.0*Math.sqrt(2.0);
        scale = {w: canvasStyleWidth/canvas.width, 
            h: canvasStyleHeight/canvas.height};
        pixelWidth = newWidth;
        pixelHeight = newHeight;
        gl.viewport(0, 0, pixelWidth, pixelHeight);
        // TODO if boundary is changed then changing the frame dimensions
        // causes the boundaries to go back to clamp_to_edge.
        // Change this behaviour.
        viewFrame.setTexture(pixelWidth, pixelHeight, {s: gl.CLAMP_TO_EDGE, 
                                                       t: gl.CLAMP_TO_EDGE});
        unbind();
        let frames = [].concat(swapFrames, storeFrame, potentialFrame);
        for (let frame of frames) {
            frame.setTexture(pixelWidth, pixelHeight, {s: gl.CLAMP_TO_EDGE, 
                                                       t: gl.CLAMP_TO_EDGE});
            frame.activateFramebuffer();
            unbind();
        }
        initializePotential(controls.presetPotentials);
    }
    gridSelect.onChange(e => {
        xyDims = e.split('x');
        setFrameDimensions(parseInt(xyDims[0]), parseInt(xyDims[1]));

    });


    function getUnnormalizedProbDist() {
        storeFrame.useProgram(probDensityProgram);
        storeFrame.bind();
        storeFrame.setIntUniforms({tex1: swapFrames[t].frameNumber,
                                tex2: swapFrames[t-3].frameNumber,
                                tex3: swapFrames[t-2].frameNumber});
        draw();
        probDensity = storeFrame.getTextureArray(
            {x: 0, y: 0, w: pixelWidth, h: pixelHeight});
        unbind();
        return probDensity;
    }

    function getProbInRegion(probDist, i0, j0, w, h) {
        let reg = 0.0;
        let tot = 0.0;
        for (let j = 0; j < pixelHeight; j++) {
            for (let i = 0; i < pixelWidth; i++) {
                let val = probDist[4*j*pixelWidth + 4*i];
                if ((i >= i0) && (j >= j0) && 
                    (i < (w + i0)) && (j < (h + j0))) {
                    reg += val;
                }
                tot += val;
            }
        }
        return reg/tot;
    }

    function logFPS() {
        if (showFPS) {
            let date = new Date();
            let time = date.getMilliseconds();
            let interval = (timeMilliseconds > time)? 
                            1000 + time - timeMilliseconds: 
                            time - timeMilliseconds;
            timeMilliseconds = time;
            console.clear();
            console.log(parseInt(1000/interval));
        }
    }

    function measurePosition() {
        if (measure) {
            let probDensity = getUnnormalizedProbDist();
            notNormalizedTot = 0.0;
            for (let i = 0; i < probDensity.length/4; i++) {
                notNormalizedTot += probDensity[4*i];
            }
            console.log(notNormalizedTot);
            let randNum = Math.random()*notNormalizedTot;
            let j = 0;
            notNormalizedProb = 0;
            for (let i = 0; i < probDensity.length/4; i++) {
                notNormalizedProb += probDensity[4*i];
                if (randNum <= notNormalizedProb) {
                    j = i;
                    break;
                }
            }
            let v = j/pixelHeight;
            let u = j%pixelHeight;
            unbind();
            measure = false;
            swapFrames[t-3].useProgram(initialWaveProgram);
            swapFrames[t-3].bind();
            swapFrames[t-3].setFloatUniforms({dx: 1.0/pixelWidth, dy: 1.0/pixelHeight,
                                                px: 0.0, py: 0.0,
                                                amp: 37.5,
                                                sx: 4.0/pixelWidth, sy: 4.0/pixelHeight,
                                                bx: u/canvas.width, 
                                                by: v/canvas.height});
            draw();
            unbind();
            swapFrames[t-2].useProgram(imagTimeStepProgram);
            swapFrames[t-2].bind();
            swapFrames[t-2].setFloatUniforms({dx: width/pixelWidth, dy: height/pixelHeight, 
                dt: controls.dt/2.0, w: width, h: height, m: controls.m, hbar: 1.0});
            swapFrames[t-2].setIntUniforms({texPsi: swapFrames[t-3].frameNumber,
                texV: potentialFrame.frameNumber});
            draw();
            unbind();
        }
    }

    function initializePotential(type) {
        // Possible presets:
        // 10 - inversesqrt(4*(x-0.5)*(x-0.5) + 4*(y-0.5)*(y-0.5))
        // -20*(x-0.5) + 20.0*circle(x,y,0.6,0.5,0.01) 
        for (let e of presetControlsFolder.controls) {
            e.remove();
        }
        presetControlsFolder.controls = [];
        if (type === 'SHO') {
            let f = (a) => {
                potentialFrame.useProgram(initPotentialProgram);
                potentialFrame.bind();
                potentialFrame.setFloatUniforms({a: a});
                potentialFrame.setIntUniforms({potentialType: 1});
                draw();
                unbind();
            }
            f(40.0);
            let items = {a: 40.0};
            let aVar = presetControlsFolder.add(items, 'a', 0.0, 40.0);
            aVar.onChange(f);
            presetControlsFolder.controls.push(aVar);

        } else if (type == 'Double Slit') {
            let doubleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.46, x2: 0.54, 
                                      spacing: 0.02, a: 30.0};
            let f = (doubleSlitUniforms) => {
                potentialFrame.useProgram(initPotentialProgram);
                potentialFrame.bind();
                potentialFrame.setFloatUniforms(doubleSlitUniforms);
                potentialFrame.setIntUniforms({potentialType: 2});
                draw();
                unbind();
            };
            f(doubleSlitUniforms);
            for (let e of Object.keys(doubleSlitUniforms)) {
                let slider = presetControlsFolder.add(
                    doubleSlitUniforms, e, 
                    doubleSlitUniforms[e]*0.8,
                    doubleSlitUniforms[e]*1.2
                );
                slider.onChange(val => {
                    doubleSlitUniforms[e] = val;
                    f(doubleSlitUniforms);
                });
                presetControlsFolder.controls.push(slider);
            }
            mouseAction = true;
            bx = pixelWidth/2;
            by = pixelHeight*0.75;
            controls.py = 40.0/controls.scaleP;
            controls.px = 0.0;
            controls.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay(); 
        
        } else if (type == 'Single Slit') {
            let singleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.5, 
                                      spacing: 0.02, a: 30.0};
            let f = (singleSlitUniforms) => {
                potentialFrame.useProgram(initPotentialProgram);
                potentialFrame.bind();
                potentialFrame.setFloatUniforms(singleSlitUniforms);
                potentialFrame.setIntUniforms({potentialType: 3});
                draw();
                unbind();
            }
            f(singleSlitUniforms);
            for (let e of Object.keys(singleSlitUniforms)) {
                let slider = presetControlsFolder.add(
                    singleSlitUniforms, e, 
                    singleSlitUniforms[e]*0.8,
                    singleSlitUniforms[e]*1.2
                );
                slider.onChange(val => {
                    singleSlitUniforms[e] = val;
                    f(singleSlitUniforms);
                });
                presetControlsFolder.controls.push(slider);
            }
            mouseAction = true;
            bx = pixelWidth/2;
            by = pixelHeight*0.75;
            controls.py = 40.0/controls.scaleP;
            controls.px = 0.0;
            controls.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        } else {
            potentialFrame.useProgram(initPotentialProgram);
            potentialFrame.bind();
            if (type == '1/r') {
                potentialFrame.setIntUniforms({potentialType: 4});
                bx = pixelWidth/2;
                by = pixelHeight*0.75;
                controls.py = 40.0/controls.scaleP;
                controls.px = 0.0;
            } else {
                potentialFrame.setIntUniforms({potentialType: 5});
                bx = pixelWidth/3;
                by = pixelHeight*0.75;
                controls.py = 30.0/controls.scaleP;
                controls.px = -30.0/controls.scaleP;
            }
            draw();
            unbind();
            mouseAction = true;
            controls.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        }
    }

    function reshapePotential() {
        storeFrame.useProgram(shapePotentialProgram);
        storeFrame.bind();
        storeFrame.setFloatUniforms({bx: bx/canvas.width, 
                                     by: 1.0 - by/canvas.height,
                                     v2: 10.0});
        storeFrame.setIntUniforms({tex1: potentialFrame.frameNumber});
        draw();
        unbind();
        potentialFrame.useProgram(copyToProgram);
        potentialFrame.bind();
        potentialFrame.setIntUniforms({tex1: storeFrame.frameNumber, 
                                       tex2: nullTexNumber});
        draw();
        unbind();
        rScaleV = 0.5;
    }

    function createNewWave() {
        swapFrames[t-3].useProgram(initialWaveProgram);
        swapFrames[t-3].bind();
        swapFrames[t-3].setFloatUniforms({dx: 1.0/pixelWidth, dy: 1.0/pixelHeight,
                                            px: controls.scaleP*controls.px, 
                                            py: controls.scaleP*controls.py,
                                            amp: 5.0,
                                            sx: 30.0/pixelWidth, sy: 30.0/pixelHeight,
                                            bx: bx/canvas.width, 
                                            by: 1.0 - by/canvas.height});
        draw();
        unbind();
        swapFrames[t-2].useProgram(imagTimeStepProgram);
        swapFrames[t-2].bind();
        swapFrames[t-2].setFloatUniforms({dx: width/pixelWidth, dy: height/pixelHeight, 
            dt: controls.dt/2.0, w: width, h: height, m: controls.m, hbar: 1.0});
        swapFrames[t-2].setIntUniforms({texPsi: swapFrames[t-3].frameNumber,
            texV: potentialFrame.frameNumber});
        draw();
        unbind();
    }

    function timeStepWave() {
        let dt = controls.dt;
        if (potChanged) {
            dt = controls.dt/2.0;
            potChanged = false;
        }
        swapFrames[t-1].useProgram(realTimeStepProgram);
        swapFrames[t-1].bind();
        swapFrames[t-1].setFloatUniforms({dx: width/pixelWidth, dy: height/pixelHeight, 
                                        dt: controls.dt, w: width, h: height, m: controls.m, hbar: 1.0, 
                                        rScaleV: rScaleV});
        swapFrames[t-1].setIntUniforms({texPsi: swapFrames[t-2].frameNumber,
                                        texV: potentialFrame.frameNumber});
        draw();
        rScaleV = 0.0;
        unbind();
        swapFrames[t].useProgram(imagTimeStepProgram);
        swapFrames[t].bind();
        swapFrames[t].setFloatUniforms({dx: width/pixelWidth, dy: height/pixelHeight, 
                                        dt: controls.dt, w: width, h: height, m: controls.m, hbar: 1.0});
        swapFrames[t].setIntUniforms({texPsi: swapFrames[t-1].frameNumber,
                                      texV: potentialFrame.frameNumber});
        draw();
        unbind();
    }

    function display() {
        viewFrame.useProgram(displayProgram);
        viewFrame.bind();
        viewFrame.setIntUniforms({tex1: swapFrames[t].frameNumber,
                                  tex2: swapFrames[t-3].frameNumber,
                                  tex3: swapFrames[t-2].frameNumber,
                                  texV: potentialFrame.frameNumber,
                                  // textTex: numberText.frameNumber,
                                  displayMode: (controls.colourPhase)? 0: 1});
        if (controls.mouseMode[0] == 'd') {
            viewFrame.setFloatUniforms({
                x0: drawRect.x/pixelWidth,
                y0: (pixelHeight - drawRect.y)/pixelHeight,
                w: drawRect.w/pixelWidth,
                h: -drawRect.h/pixelHeight,
                lineWidth: 0.002,
                brightness: controls.brightness
            });
        } else {
            viewFrame.setFloatUniforms({lineWidth: 0.0, 
                                         brightness: controls.brightness});
        }
        draw();
        unbind();
        if (controls.mouseMode[0] == 'd') {
            let prob = getUnnormalizedProbDist();
            let j0 = pixelHeight - drawRect.y;
            let h = -drawRect.h;
            let i0 = (drawRect.w < 0.0)? drawRect.x + drawRect.w: drawRect.x;
            j0 = (h < 0.0)? j0 + h: j0;
            let w = (drawRect.w < 0.0)? -drawRect.w: drawRect.w;
            h = (h < 0.0)? -h: h;
            let reg = getProbInRegion(prob, i0, j0, w, h);
            console.log(reg);
        }
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    function onPotentialChange() {
        if (controls.presetPotentials !== potentialFrame.presetPotentials) {
            potentialFrame.presetPotentials = controls.presetPotentials;
            initializePotential(controls.presetPotentials);
            potChanged = true;
            // rScaleV = 0.5;
            return;
        }
        if ((controls.enterPotential !== potentialFrame.enterPotential) ||
           (controls.useTextureCoordinates !== 
            potentialFrame.useTextureCoordinates)) {
            for (let e of textEditSubFolder.controls) {
                e.remove();
            }
            textEditSubFolder.controls = [];
            if (textEditSubFolder.closed) {
                textEditSubFolder.open();
            }

            potentialFrame.useTextureCoordinates = controls.useTextureCoordinates;
            potentialFrame.enterPotential = controls.enterPotential;
            let expr = potentialFrame.enterPotential;
            expr = replaceIntsToFloats(expr);
            let uniforms = getVariables(expr);
            uniforms.delete('x');
            uniforms.delete('y');
            console.log(uniforms);
            let shader = createFunctionShader(expr, uniforms);
            if (shader === null) {
                return;
            }
            let program = makeProgram(vShader, shader);
            storeFrame.useProgram(program);
            storeFrame.bind();
            if (controls.useTextureCoordinates) {
                floatUniforms = {xScale: 1.0, yScale: 1.0};
            } else {
                floatUniforms = {xScale: width, yScale: height};
            }

            let f = (uniforms) => {
                if (controls.useTextureCoordinates) {
                    floatUniforms = {xScale: 1.0, yScale: 1.0};
                } else {
                    floatUniforms = {xScale: width, yScale: height};
                }
                for (let e of Object.keys(floatUniforms)) {
                    uniforms[e] = floatUniforms[e];
                }
                storeFrame.useProgram(program);
                storeFrame.bind();
                storeFrame.setFloatUniforms(uniforms);
                storeFrame.setIntUniforms({prevV: potentialFrame.frameNumber});
                draw();
                unbind();
                potentialFrame.useProgram(copyToProgram);
                potentialFrame.bind();
                potentialFrame.setIntUniforms({tex1: storeFrame.frameNumber,
                                            tex2: nullTexNumber});
                draw();
                unbind();
                potChanged = true;
                rScaleV = 0.5;
            };
            console.log(uniforms);
            let uniformsObj = {};
            for (let u of uniforms) {
                uniformsObj[u] = 0.0;
            }
            for (let e of uniforms) {
                console.log(e);
                let slider = textEditSubFolder.add(
                    uniformsObj, e, 
                    0.0, 10.0
                );
                slider.onChange(val => {
                    uniformsObj[e] = val;
                    f(uniformsObj);
                });
                textEditSubFolder.controls.push(slider);
            }

            for (let u of uniforms) {
                floatUniforms[u] = 1.0;
            }

            storeFrame.setFloatUniforms(floatUniforms);
            storeFrame.setIntUniforms({prevV: potentialFrame.frameNumber});
            draw();
            unbind();
            potentialFrame.useProgram(copyToProgram);
            potentialFrame.bind();
            potentialFrame.setIntUniforms({tex1: storeFrame.frameNumber,
                                           tex2: nullTexNumber});
            draw();
            unbind();
            potChanged = true;
            rScaleV = 0.5;
        }

    }

    function animate() {
        onPotentialChange();
        if (mouseAction) {
            if (controls.mouseMode[0] === 'n') {
                createNewWave();
            } else if ((controls.mouseMode[0] === 'r') ){
                reshapePotential();
            } else {
                drawRect.w = bx - drawRect.x;
                drawRect.h = by - drawRect.y;
            }
            mouseAction = false;
        }
        for (let i = 0; i < controls.speed; i++) {
            timeStepWave();
            rScaleV = 0.0;
            swap();
        }
        logFPS();
        display();
        measurePosition();
        requestAnimationFrame(animate);
    }

    let mousePos = function(ev, mode) {
        if (mode == 'move') {
            let prevBx = bx;
            let prevBy = by;
            bx = Math.floor((ev.clientX - canvas.offsetLeft))/scale.w;
            by = Math.floor((ev.clientY - canvas.offsetTop))/scale.h;
            controls.px = parseInt(bx - prevBx);
            if (Math.abs(controls.px) > 50.0/controls.scaleP) {
                controls.px = Math.sign(controls.px)*50.0/controls.scaleP;
            }
            controls.py = -parseInt(by - prevBy);
            if (Math.abs(controls.py) > 50.0/controls.scaleP) {
                controls.py = Math.sign(controls.py)*50.0/controls.scaleP;
            }
        }
        if (mouseUse) {
            if (bx < canvas.width && by < canvas.height && 
                bx >= 0 && by >= 0) mouseAction = true;
        }
    }

    let touchReleaseWave = function(ev, mode) {
        let touches = ev.changedTouches;
        let n = touches.length;
        if (n !== 0) {
            if (mode == 'move') {
                let prevBx = bx;
                let prevBy = by;
                bx = Math.floor((touches[n-1].pageX - canvas.offsetLeft));
                by = Math.floor((touches[n-1].pageY - canvas.offsetTop));
                controls.px = parseInt(bx - prevBx);
                if (Math.abs(controls.px) > 60.0) {
                    controls.px = Math.sign(controls.px)*60.0;
                }
                controls.py = -parseInt(by - prevBy);
                if (Math.abs(controls.py) > 60.0) {
                    controls.py = Math.sign(controls.py)*60.0;
                }
            }
            if (bx < canvas.width && by < canvas.height && 
                bx >= 0 && by >= 0) {mouseAction = true; }
        }
    }
    canvas.addEventListener("touchstart", ev => touchReleaseWave(ev, 'start'));
    canvas.addEventListener("touchmove", ev => touchReleaseWave(ev, 'move'));   
    // document.addEventListener("touchevent", ev => touchReleaseWave(ev, "start"));
    canvas.addEventListener("mouseup", ev => {
        mousePos(ev, 'up');
        mouseUse = false;
    });
    canvas.addEventListener("mousedown", ev => {
        mouseUse = true;
        drawRect.w = 0;
        drawRect.h = 0;
        drawRect.x = Math.floor((ev.clientX - canvas.offsetLeft))/scale.w;
        drawRect.y = Math.floor((ev.clientY - canvas.offsetTop))/scale.h;
    });
    canvas.addEventListener("mousemove", ev => mousePos(ev, 'move'));
    window.addEventListener("orientationchange", ev => {
        canvasStyleWidth = parseInt(canvas.style.width);
        canvasStyleHeight = parseInt(canvas.style.height);
        if (window.innerHeight < window.innerWidth) {
            canvasStyleWidth = parseInt(window.innerHeight*0.95);
            canvasStyleHeight = parseInt(window.innerHeight*0.95);
        } else {
            canvasStyleWidth = parseInt(window.innerWidth*0.95);
            canvasStyleHeight = parseInt(window.innerWidth*0.95);
        }
        canvas.style.width = `${canvasStyleWidth}px`;
        canvas.style.height = `${canvasStyleHeight}px`;
        scale = {w: canvasStyleWidth/canvas.width, 
                 h: canvasStyleHeight/canvas.height};
    });

    animate();
}
