let vShader = makeShader(gl.VERTEX_SHADER, vertexShaderSource);
let initWaveShader = makeShader(gl.FRAGMENT_SHADER, 
                                initialUpperSpinorFragmentSource);
let initWave2Shader = makeShader(gl.FRAGMENT_SHADER, 
                                initialBottomSpinorFragmentSource);
let stepUpShader = makeShader(gl.FRAGMENT_SHADER, 
                              upperSpinorTimestepFragmentSource);
let stepDownShader = makeShader(gl.FRAGMENT_SHADER,
                                bottomSpinorTimestepFragmentSource);
let viewShader = makeShader(gl.FRAGMENT_SHADER,
                            diracViewFragmentSource);
let potShader = makeShader(gl.FRAGMENT_SHADER, 
                            initialPotentialFragmentSource);
let reshapePotShader = makeShader(gl.FRAGMENT_SHADER,
                                  reshapePotentialFragmentSource);
let copyOverShader = makeShader(gl.FRAGMENT_SHADER, copyOverFragmentSource);
let probDensityShader = makeShader(gl.FRAGMENT_SHADER, 
                                   diracProbDensityFragmentSource);
let guiRectShader = makeShader(gl.FRAGMENT_SHADER, 
                               guiRectangleFragmentSource);
let currentShader = makeShader(gl.FRAGMENT_SHADER, 
                               diracCurrentFragmentSource);
let onesShader = makeShader(gl.FRAGMENT_SHADER, onesFragmentSource);

let initWaveProgram = makeProgram(vShader, initWaveShader);
let initWave2Program = makeProgram(vShader, initWave2Shader);
let stepUpProgram = makeProgram(vShader, stepUpShader);
let stepDownProgram = makeProgram(vShader, stepDownShader);
let potProgram = makeProgram(vShader, potShader);
let viewProgram = makeProgram(vShader, viewShader);
let reshapePotProgram = makeProgram(vShader, reshapePotShader);
let copyOverProgram = makeProgram(vShader, copyOverShader);
let probDensityProgram = makeProgram(vShader, probDensityShader);
let guiRectProgram = makeProgram(vShader, guiRectShader);
let currentProgram = makeProgram(vShader, currentShader);
let onesProgram = makeProgram(vShader, onesShader);

let viewFrame = new Frame(pixelWidth, pixelHeight, 0);
uFrames = [1, 2].map(e => new Frame(pixelWidth, pixelHeight, e));
let uSwap = () => uFrames = [uFrames[1], uFrames[0]];
vFrames = [3, 4].map(e => new Frame(pixelWidth, pixelHeight, e));
let vSwap = () => vFrames = [vFrames[1], vFrames[0]];
let potFrame = new Frame(pixelWidth, pixelHeight, 5);
let guiFrame = new Frame(pixelWidth, pixelHeight, 6);
let vectorFieldFrame = new VectorFieldFrame(pixelWidth, pixelHeight, 7);
let extraFrame = new Frame(pixelWidth, pixelHeight, 8);
let nullTex = 9;
var frames = [];
frames.push(viewFrame);
uFrames.forEach(e => frames.push(e));
vFrames.forEach(e => frames.push(e));
frames.push(potFrame);
frames.push(extraFrame);
for (let f of frames) {
    f.setTexture(canvas.width, canvas.height, {s: gl.REPEAT, t: gl.REPEAT});
    f.activateFramebuffer();
}

let data = {
    w: 2.0, h: 2.0,
    bx: 0.5, by: 0.5, px: 0.0, py: 40.0,
    initMomentumByPxPySliders: false,
    dt: 0.00001,
    // dt: 0.001,
    sigma: 0.05859375,
    // The fundamental constants used are expressed
    // in terms of [Hartree atomic units]
    // (https://en.wikipedia.org/wiki/Hartree_atomic_units)
    m: 1.0, c: 137.036, hbar: 1.0,
    t: 0.0,
    drawShape: 'circle',
    drawSize: 0.01,
    drawValue: 10000/137.036,
    mouseSelect: 'New ψ(x, y)',
    presetPotentials: 'Free (Periodic)',
    potentialType: 7,
    stepsPerFrame: 6,
    brightness: 1.0,
    applyPhaseShift: true,
    showFPS: false, timeMilliseconds: 0,
    showPsi1: true, showPsi2: true, showPsi3: true, showPsi4: true,
    isDisplayUpdate: true,
    phaseOption: 'ψ1 Phase',
    phaseOptions: ['ψ1 Phase', 'ψ2 Phase', 'ψ3 Phase', 'ψ4 Phase', 
                   '|ψ12|-|ψ34|', 'None'],
    phaseMode: 0,
    mouseAction: false,
    presetPotentialSettings: {"a": 10000.0/137.036, "y0": 0.45, "w": 0.02, 
                              "spacing": 0.03, "x1": 0.43, "x2": 0.57},
    measurePosition: e => {},
    drawRect: {x: 0.0, y: 0.0, w: 0.0, h: 0.0},
    probInRegion: '0',
    viewProbCurrent: false,
    potBrightness: 1.0,
    gridDimensions: '512x512'
};

function setFrameDimensions(newWidth, newHeight) {
    document.getElementById('sketch-canvas').width = newWidth;
    document.getElementById('sketch-canvas').height = newHeight;
    pixelWidth = newWidth;
    pixelHeight = newHeight;
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    let frames = [viewFrame, potFrame, guiFrame, 
                  vectorFieldFrame, extraFrame];
    uFrames.forEach(e => frames.push(e));
    vFrames.forEach(e => frames.push(e));
    for (let f of frames) {
        f.setTexture(pixelWidth, pixelHeight, {s: gl.REPEAT, t: gl.REPEAT});
        f.activateFramebuffer();
        unbind();
    }
}

let gui = new dat.GUI();
let stats = null;
try {
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
} catch (e) {
    console.log(e);
}
// How to display only text:
// https://stackoverflow.com/q/30834678
// Question by Oggy (https://stackoverflow.com/users/2562154)
// Answer (https://stackoverflow.com/a/31001163)
// by Djuro Mirkovic (https://stackoverflow.com/users/4972372)
let palette = {color: '#1b191b'};
source = gui.addColor(palette, 'color').name(
    ' <a href="https://github.com/marl0ny/QM-Simulator-2D/tree/relativistic-qm"'
    + 'style="color: #efefef; text-decoration: none; font-size: 1em;">'
    + 'Source</a>'
);
source.domElement.hidden = true;
gui.add(data , 'stepsPerFrame', 0, 20).name('speed').step(1);
let potSelect = gui.add(data, 'presetPotentials', 
                        ['Free (Periodic)', 'SHO', 'Double Slit',
                         'Single Slit', 'Step', 'Coulomb']
                        ).name('Preset Potential');
let mouseSelect = gui.add(data, 'mouseSelect', ['New ψ(x, y)', 
                                                    'Draw Barrier', 
                                                    'Erase Barrier',
                                                    'Prob. in Box']
                          ).name('Mouse Select');
let presetPotOptions = gui.addFolder('Preset Potential Options');
let additions = [];
additions.push(presetPotOptions.add(data.presetPotentialSettings, 
                                    'a', 0.0, 11000/data.c));
additions.push(presetPotOptions.add(data.presetPotentialSettings, 
                                    'y0', 0.25, 0.75));
additions.push(presetPotOptions.add(data.presetPotentialSettings, 
                                    'w', 0.0, 0.05));
additions.push(presetPotOptions.add(data.presetPotentialSettings, 
                                    'spacing', 0.0, 0.06));
additions.push(presetPotOptions.add(data.presetPotentialSettings, 
                                    'x1', 0.35, 0.5));
additions.push(presetPotOptions.add(data.presetPotentialSettings, 
                                    'x2', 0.5, 0.65));
presetPotOptions.additions = additions;
let mouseOptions = gui.addFolder('Mouse Select Options')
let newWavefuncOptions = mouseOptions.addFolder('New ψ(x, y)');
newWavefuncOptions.add(data, 'sigma', 0.01, 0.1);
let initPByMouse = newWavefuncOptions.add(data, 
                                          'initMomentumByPxPySliders'
                                          ).name('Use kx/ky sliders');
let pxControl = newWavefuncOptions.add(data, 'px', -50.0, 50.0).name('kx');
let pyControl = newWavefuncOptions.add(data, 'py', -50.0, 50.0).name('ky');
let drawBarrierOptions = mouseOptions.addFolder('Draw/Erase Barrier');
let probInBoxFolder = mouseOptions.addFolder('Probability in Box');
let probShow = probInBoxFolder.add(data, 'probInRegion').name('Probability');
drawBarrierOptions.add(data, 'drawShape',
                       ['circle', 'square']).name('Draw Shape');
drawBarrierOptions.add(data, 'drawSize', 0.0, 0.1).name('Size');
drawBarrierOptions.add(data, 'drawValue', 0.0, 
                       11000.0/data.c).name('E');
let viewOptionsFolder = gui.addFolder('Visualization Options');
let viewOptions = viewOptionsFolder.addFolder('ψ(x, y)');
viewOptions.add(data, 'brightness', 0.0, 8.0);
phaseOptions = viewOptions.add(data, 'phaseOption', 
                               data.phaseOptions).name('Colour Options');
phaseOptions.onChange(e => {data.phaseMode
                             = data.phaseOptions.indexOf(e);});
viewOptions.add(data, 'showPsi1').name('Show |ψ1|^2');
viewOptions.add(data, 'showPsi2').name('Show |ψ2|^2');
viewOptions.add(data, 'showPsi3').name('Show |ψ3|^2');
viewOptions.add(data, 'showPsi4').name('Show |ψ4|^2');
viewOptions.add(data, 'applyPhaseShift').name('Adjust Global Phase');
viewOptions.add(data, 'viewProbCurrent').name('Show Current');
let potViewOptions = 
    viewOptionsFolder.addFolder('Potential');
potViewOptions.add(data, 'potBrightness', 0.0, 8.0).name('brightness');
let dx = data.w/pixelWidth;
dtControl = gui.add(data, 'dt', -0.5*dx/data.c, 0.9*dx/data.c).name('dt');
gui.add(data, 'm', 0.0, 2.0).name('m');
// gui.add(data, 'c', 1.0, 140.0).name('c');
// gui.add(data, 'measurePosition').name('Measure Position');
let moreControls = gui.addFolder('More Controls');
let changeGrid = moreControls.add(data, 'gridDimensions', 
                                  ['256x256', '512x512', '1024x1024']
                                 ).name('Grid Dimensions');


let guiControls = {
    gui: gui,
    potSelect: potSelect,
    mouseSelect: mouseSelect,
    presetPotOptions: presetPotOptions,
    mouseOptions: mouseOptions,
    newWavefuncOptions: newWavefuncOptions,
    initPByMouse:  initPByMouse,
    pxControl: pxControl,
    pyControl: pyControl,
    drawBarrierOptions: drawBarrierOptions,
    viewOptions: viewOptions,
    probInBoxFolder: probInBoxFolder,
    probShow: probShow,
    potViewOptions: potViewOptions,
    moreControls: moreControls,
    dtControl: dtControl,
};

changeGrid.onChange(
    e => {
        let w = parseInt(e.split('x')[0]);
        setFrameDimensions(w, w);
        let dx = data.w/pixelWidth;
        dtControl.min(-0.5*dx/data.c);
        dtControl.max(0.9*dx/data.c);
        dtControl.setValue(0.3508*dx/data.c);
        dtControl.updateDisplay();
        initializePotential(data.presetPotentials);
        guiControls.drawBarrierOptions.close();
        guiControls.probInBoxFolder.close();
    }
);

guiControls.mouseSelect.onChange(e => {
    if (e === 'Prob. in Box') {
        guiControls.mouseOptions.open();
        guiControls.probInBoxFolder.open();
    } else {
        data.probInRegion = '0';
        guiControls.probShow.updateDisplay();
        guiControls.probInBoxFolder.close();
    }
});

function logFPS() {
    if (data.showFPS) {
        let date = new Date();
        let time = date.getMilliseconds();
        let interval = (data.timeMilliseconds > time)?
                        1000 + time - data.timeMilliseconds:
                        time - data.timeMilliseconds;
        data.timeMilliseconds = time;
        console.clear();
        console.log(parseInt(1000/interval));
    }
}

function initWavefunc(customData = null) {
    data.t = 0.0;
    let frames = [];
    uFrames.forEach(e => frames.push(e));
    vFrames.forEach(e => frames.push(e));
    let wavefuncData = (customData !== null)? 
                            customData: data;
    let sigma = wavefuncData.sigma;
    for (let f of frames) {
        if (f.frameNumber === vFrames[0].frameNumber || 
            f.frameNumber === vFrames[1].frameNumber) {
            f.useProgram(initWave2Program);
        } else {
            f.useProgram(initWaveProgram);
        }
        f.bind();
        let t = 0.0;
        if (f.frameNumber === uFrames[0].frameNumber) {
            t = 2.0*wavefuncData.dt;
        } else if (f.frameNumber === vFrames[0].frameNumber || 
                   f.frameNumber === vFrames[1].frameNumber) {
            t = wavefuncData.dt;
        }
        f.setFloatUniforms(
            {"bx": wavefuncData.bx, "by": wavefuncData.by, 
            "sx": sigma, "sy": sigma, 
            "amp": 2.0*30.0/(sigma*512.0),
            "pixelW": pixelWidth, "pixelH": pixelHeight,
            "m": wavefuncData.m, "c": wavefuncData.c,
            "kx": wavefuncData.px, "ky": wavefuncData.py,
            "w": wavefuncData.w, "h": wavefuncData.h,
            "t": t, "hbar": wavefuncData.hbar}
        );
        draw();
        unbind();
    }
}

function initializePotential(type) {
    data.presetPotentialSettings.a = 10000/data.c
    potFrame.useProgram(potProgram);
    potFrame.bind();
    data.potBrightness = (type == 'Coulomb')? 0.25: 1.0;
    if (type == 'SHO') {
        data.potentialType = 1;
        potFrame.setFloatUniforms(data.presetPotentialSettings);
        potFrame.setIntUniforms({"potentialType": data.potentialType});
        let newDataVals = {bx: 0.30, by: 0.30, 
                              px: -10.0, py: 10.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => data[e[0]] = e[1]);
    } else if (type == 'Double Slit') {
        data.potentialType = 2;
        data.presetPotentialSettings.x1 = 0.43;
        data.presetPotentialSettings.x2 = 0.57;
        data.presetPotentialSettings.w = 0.02;
        data.presetPotentialSettings.spacing = 0.03;
        potFrame.setFloatUniforms(data.presetPotentialSettings);
        potFrame.setIntUniforms({"potentialType": data.potentialType});
        let newDataVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true, 
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => data[e[0]] = e[1]);
    } else if (type == 'Single Slit') {
        data.potentialType = 3;
        data.presetPotentialSettings.x1 = 0.5;
        data.presetPotentialSettings.w = 0.01;
        data.presetPotentialSettings.spacing = 0.01;
        potFrame.setFloatUniforms(data.presetPotentialSettings);
        potFrame.setIntUniforms({"potentialType": data.potentialType});
        let newDataVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => data[e[0]] = e[1]);
    } else if (type == 'Step') {
        data.potentialType = 4;
        data.presetPotentialSettings.a = 5000/data.c
        potFrame.setFloatUniforms(data.presetPotentialSettings);
        potFrame.setIntUniforms({"potentialType": data.potentialType});
        let newDataVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => data[e[0]] = e[1]);
    } else if (type == 'Coulomb') {
        data.potentialType = 7;
        potFrame.setIntUniforms({"potentialType": data.potentialType});
        let newDataVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => data[e[0]] = e[1]);
    } else {
        data.potentialType = 8;
        potFrame.setIntUniforms({"potentialType": data.potentialType});
    }
    draw();
    unbind();
    data.isDisplayUpdate = true;
    guiControls.mouseSelect.updateDisplay();
    for (let e of guiControls.presetPotOptions.additions) e.updateDisplay();
    data.isDisplayUpdate = false;
}
guiControls.potSelect.onChange(e => {
    initializePotential(e);
    // guiControls.newWavefuncOptions.open();
    guiControls.drawBarrierOptions.close();
    guiControls.probInBoxFolder.close();
});


function onPotentialSettingsChange() {
    if (data.isDisplayUpdate === false) {
        potFrame.useProgram(potProgram);
        potFrame.bind();
        potFrame.setIntUniforms({'potentialType': data.potentialType});
        potFrame.setFloatUniforms(data.presetPotentialSettings);
        draw();
        unbind();
    }
}
for (let e of guiControls.presetPotOptions.additions) {
    e.onChange(onPotentialSettingsChange);
}

function reshapePotential(mode) {
    let drawMode = 0;
    if (data.drawShape === 'circle') {
        drawMode = 1;
    }
    extraFrame.useProgram(copyOverProgram);
    extraFrame.bind();
    extraFrame.setIntUniforms({"tex1": potFrame.frameNumber});
    draw();
    unbind();
    potFrame.useProgram(reshapePotProgram);
    potFrame.bind();
    potFrame.setIntUniforms({"tex1": extraFrame.frameNumber, 
                             "eraseMode": mode,
                             "drawMode" : drawMode});
    potFrame.setFloatUniforms({
        "drawWidth": data.drawSize, 
        "bx": data.bx, "by": data.by, 
        "v2": (mode === 0)? data.drawValue: 0.0
    });
    draw();
    unbind();
}

function getUnnormalizedProbDist() {
    extraFrame.useProgram(probDensityProgram);
    extraFrame.bind();
    extraFrame.setIntUniforms({uTex: uFrames[0].frameNumber,
                               vTex1: vFrames[0].frameNumber,
                               vTex2: vFrames[1].frameNumber});
    extraFrame.setFloatUniforms({pixelW: pixelWidth, pixelH: pixelHeight});
    draw();
    let probDensity = extraFrame.getTextureArray({x: 0, y: 0, 
                                                  w: pixelWidth, 
                                                  h: pixelHeight});
    unbind();
    return probDensity;
}

function measurePosition() {
    let probDensity = getUnnormalizedProbDist();
    let total = 0.0;
    for (let i = 0; i < probDensity.length; i++) {
        total += probDensity[i];
    }
    console.log(total);
    let randNum = Math.random()*total;
    let j = 0;
    let notNormalizedProb = 0;
    for (let i = 0; i < probDensity.length; i++) {
        notNormalizedProb += probDensity[i];
        if (randNum <= notNormalizedProb) {
            j = i/4;
            break;
        }
    }
    let customData = Object.create(data);
    customData.by = j/(pixelWidth*canvas.width);
    customData.bx = (j%(pixelHeight))/canvas.height;
    customData.px = 0.0;
    customData.py = 0.0;
    customData.sigma = 6.0/pixelWidth;
    initWavefunc(customData);
}
data.measurePosition = measurePosition;

function getProbInRegion(probDist, i0, j0, w, h) {
    let reg = 0.0;
    let tot = 0.0;
    for (let j = 0; j < pixelHeight; j++) {
        for (let i = 0; i < pixelWidth; i++) {
            let val = 0.0;
            for (let k = 0; k < 4; k++) {
                val += probDist[4*j*pixelWidth + 4*i + k];
            }
            if (i >= i0 && j >= j0 && i < w + i0 && j < h + j0) {
                reg += val;
            }
            tot += val;
        }
    }
    return reg/tot;
}

function showProbInfo() {
    let drawRect = data.drawRect;
    let j0 = pixelHeight*(drawRect.y);
    console.log(j0);
    let h = pixelHeight*drawRect.h;
    let i0 = pixelWidth*((drawRect.w < 0.0)? 
                         drawRect.x + drawRect.w: drawRect.x);
    j0 = (h < 0.0)? j0 + h: j0;
    let w = pixelWidth*((drawRect.w < 0.0)? -drawRect.w: drawRect.w);
    h = (h < 0.0)? -h: h;
    if (w*w > 0.0 && h*h > 0.0) {
        let prob = getUnnormalizedProbDist();
        let val = getProbInRegion(prob, i0, j0, w, h);
        data.probInRegion = `${Math.round(1000.0*val)/1000.0}`;
    } else {
        data.probInRegion = '0';
    }
    guiControls.probShow.updateDisplay();
}

function changeProbBoxDisplay() {
    guiFrame.useProgram(guiRectProgram);
    guiFrame.bind();
    guiFrame.setFloatUniforms({
        x0: data.drawRect.x, y0: data.drawRect.y,
        w: data.drawRect.w, h: data.drawRect.h,
        lineWidth: 0.003
    });
    draw();
    unbind();
}

function showProbCurrent() {
    extraFrame.useProgram(currentProgram);
    extraFrame.bind();
    extraFrame.setIntUniforms({uTex: uFrames[0].frameNumber,
                               vTex1: vFrames[0].frameNumber, 
                               vTex2: vFrames[1].frameNumber});
    extraFrame.setFloatUniforms({pixelW: pixelWidth,
                                 pixelH: pixelHeight});
    draw();
    let current = extraFrame.getTextureArray({x: 0,y: 0,
                                              w: pixelWidth,
                                              h: pixelHeight});
    unbind();
    let vecs = [];
    let dst = 32;
    let wSpacing = pixelWidth/dst, hSpacing = pixelHeight/dst;
    let hEnd = pixelHeight;
    let wEnd = pixelWidth;
    let count = 0;
    for (let i = hSpacing; i < hEnd; i += hSpacing) {
        for (let j = wSpacing; j < wEnd; j += wSpacing) {
            let vy = current[4*i*pixelHeight + 4*j + 1];
            let vx = current[4*i*pixelHeight + 4*j + 2];
            if (vx*vx + vy*vy > 1e-9) {
                let x = 2.0*i/pixelHeight - 1.0;
                let y = 2.0*j/pixelWidth - 1.0;
                let maxSize = 0.05;
                if (vx*vx + vy*vy > maxSize*maxSize) {
                    let norm = 1.0/Math.sqrt(vx*vx + vy*vy);
                    vx = vx*norm*maxSize;
                    vy = vy*norm*maxSize; 
                }
                vecs.push(y - vy/2.0);
                vecs.push(x - vx/2.0);
                vecs.push(0.0);
                vecs.push(y + vy/2.0);
                vecs.push(x + vx/2.0);
                vecs.push(0.0);
                count += 2;
            }
        }
    }
    let vertices = new Float32Array(vecs);
    vectorFieldFrame.useProgram(onesProgram);
    vectorFieldFrame.bind(vertices);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawLines(count);
    unbind();

}

function step() {
    let dt = data.dt;
    data.t += dt;
    let w = data.w, h = data.h;
    let hbar = data.hbar;
    let m = data.m;
    let c = data.c;
    uFrames[1].useProgram(stepUpProgram);
    uFrames[1].bind();
    uFrames[1].setFloatUniforms(
        {"dt": dt, "dx": w/pixelWidth, "dy": h/pixelHeight,
         "w": w, "h": h, "m": m, 
         "hbar": hbar, "c": c}
    );
    uFrames[1].setIntUniforms(
        {"vTex": vFrames[0].frameNumber,
         "uTex": uFrames[0].frameNumber,
         "potTex": potFrame.frameNumber}
    );
    draw();
    unbind();
    uSwap();
    vFrames[1].useProgram(stepDownProgram);
    vFrames[1].bind();
    vFrames[1].setFloatUniforms(
        {"dt": dt, "dx": w/pixelWidth, "dy": h/pixelHeight,
         "w": w, "h": h, "m": m, 
         "hbar": hbar, "c": c}
    );
    vFrames[1].setIntUniforms(
        {"vTex": vFrames[0].frameNumber,
         "uTex": uFrames[0].frameNumber,
         "potTex": potFrame.frameNumber}
    );
    draw();
    unbind();
    vSwap();
}

let mouseUse = false;
let mousePos = function(ev, mode) {
    if (mode == 'move') {
        let prevBx = data.bx;
        let prevBy = data.by;
        data.bx = Math.floor((ev.clientX 
                                  - canvas.offsetLeft))/canvasStyleWidth;
        data.by = 1.0 - Math.floor((ev.clientY
                                         - canvas.offsetTop)
                                       )/canvasStyleHeight;
        if (mouseUse && data.mouseSelect === 'Prob. in Box') {
            data.drawRect.w = data.bx - data.drawRect.x; 
            data.drawRect.h = data.by - data.drawRect.y;
        }
        if (!data.initMomentumByPxPySliders) {
            data.px = pixelWidth*parseFloat(data.bx - prevBx);
            if (Math.abs(data.px) > 80.0) {
                data.px = Math.sign(data.px)*80.0;
            }
            data.py = pixelHeight*parseFloat(data.by - prevBy);
            if (Math.abs(data.py) > 80.0) {
                data.py = Math.sign(data.py)*80.0;
            }
        }
    }
    if (mouseUse) {
        data.mouseAction = true;
    }
};
canvas.addEventListener("mouseup", ev => {
    guiControls.pxControl.updateDisplay();
    guiControls.pyControl.updateDisplay();
    mousePos(ev, 'up');
    mouseUse = false;
});
canvas.addEventListener("mousedown", ev => {
    data.drawRect.w = 0.0;
    data.drawRect.h = 0.0;
    data.drawRect.x = Math.floor((ev.clientX
                                       - canvas.offsetLeft)
                                    )/canvasStyleWidth;
    data.drawRect.y = 1.0 - Math.floor((ev.clientY 
                                           - canvas.offsetTop)
                                          )/canvasStyleHeight;
    mouseUse = true;
});
canvas.addEventListener("mousemove", ev => mousePos(ev, 'move'));

initWavefunc();

function animation() {
    if (stats) stats.begin();
    if (data.mouseAction) {
        if (data.mouseSelect === 'New ψ(x, y)') 
            initWavefunc();
        else if (data.mouseSelect === 'Draw Barrier')
            reshapePotential(0);
        else if (data.mouseSelect === 'Erase Barrier')
            reshapePotential(1);
        else if (data.mouseSelect === 'Prob. in Box')
            changeProbBoxDisplay();
        data.mouseAction = false;
    }
    let showBox = false;
    if (data.mouseSelect === 'Prob. in Box') {
        showBox =true;
        showProbInfo();
    }
    if (data.viewProbCurrent) {
        showProbCurrent();
    }
    for (let i = 0; i < data.stepsPerFrame; i++) step();
    viewFrame.useProgram(viewProgram);
    viewFrame.bind();
    viewFrame.setIntUniforms(
        {"uTex": uFrames[0].frameNumber,
         "vTex1": vFrames[0].frameNumber,
         "vTex2": vFrames[1].frameNumber, 
         "potTex": potFrame.frameNumber,
         "guiTex": (showBox)? guiFrame.frameNumber: nullTex,
         "displayMode": data.phaseMode,
         "vecTex": (data.viewProbCurrent)? 
                    vectorFieldFrame.frameNumber: nullTex}
    );
    viewFrame.setFloatUniforms(
        {"constPhase": (data.applyPhaseShift)? 
                        data.t*data.m*data.c**2: 0.0,
         "pixelW": pixelWidth, "pixelH": pixelHeight,
         "psiBrightness": data.brightness,
         "potBrightness": data.potBrightness,
         "showPsi1": (data.showPsi1)? 1.0: 0.0, 
         "showPsi2": (data.showPsi2)? 1.0: 0.0,
         "showPsi3": (data.showPsi3)? 1.0: 0.0, 
         "showPsi4": (data.showPsi4)? 1.0: 0.0}
    )
    logFPS();
    draw();
    unbind();
    if (stats) stats.end();
    requestAnimationFrame(animation);
}

animation();
