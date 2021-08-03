let vShader = makeShader(gl.VERTEX_SHADER, vertexShaderSource);
let initWaveShader = makeShader(gl.FRAGMENT_SHADER, 
                                initialSpinorWaveFragmentSource);
let stepUpShader = makeShader(gl.FRAGMENT_SHADER, 
                              diracStepUpFragmentSource);
let stepDownShader = makeShader(gl.FRAGMENT_SHADER,
                                diracStepDownFragmentSource);
let viewShader = makeShader(gl.FRAGMENT_SHADER,
                            diracViewFragmentSource);
let potShader = makeShader(gl.FRAGMENT_SHADER, 
                            initialPotentialFragmentSource);
let reshapePotShader = makeShader(gl.FRAGMENT_SHADER,
                                  reshapePotentialFragmentSource);
let copyOverShader = makeShader(gl.FRAGMENT_SHADER, copyOverFragmentSource);

let initWaveProgram = makeProgram(vShader, initWaveShader);
let stepUpProgram = makeProgram(vShader, stepUpShader);
let stepDownProgram = makeProgram(vShader, stepDownShader);
let potProgram = makeProgram(vShader, potShader);
let viewProgram = makeProgram(vShader, viewShader);
let reshapePotProgram = makeProgram(vShader, reshapePotShader);
let copyOverProgram = makeProgram(vShader, copyOverShader);

let viewFrame = new Frame(pixelWidth, pixelHeight, 0);
uFrames = [1, 2].map(e => new Frame(pixelWidth, pixelHeight, e));
let uSwap = () => uFrames = [uFrames[1], uFrames[0]];
vFrames = [3, 4].map(e => new Frame(pixelWidth, pixelHeight, e));
let vSwap = () => vFrames = [vFrames[1], vFrames[0]];
let potFrame = new Frame(pixelWidth, pixelHeight, 5);
let extraFrame = new Frame(pixelWidth, pixelHeight, 6);
let nullTex = 7;
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


let gui = new dat.GUI();
let controls = {
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
    mouseSelect: 'new ψ(x, y)',
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
                              "spacing": 0.03, "x1": 0.43, "x2": 0.57}
};
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
gui.add(controls , 'stepsPerFrame', 0, 20).name('speed').step(1);
let potSelect = gui.add(controls, 'presetPotentials', 
                        ['Free (Periodic)', 'SHO', 'Double Slit',
                         'Single Slit', 'Step', 'Spike']
                        ).name('Preset Potential');
let mouseSelect = gui.add(controls, 'mouseSelect', ['new ψ(x, y)', 
                                                    'Draw Barrier', 
                                                    'Erase Barrier']
                          ).name('Mouse Select');
let presetPotOptions = gui.addFolder('Preset Potential Options');
let additions = [];
additions.push(presetPotOptions.add(controls.presetPotentialSettings, 
                                    'a', 0.0, 11000/controls.c));
additions.push(presetPotOptions.add(controls.presetPotentialSettings, 
                                    'y0', 0.25, 0.75));
additions.push(presetPotOptions.add(controls.presetPotentialSettings, 
                                    'w', 0.0, 0.05));
additions.push(presetPotOptions.add(controls.presetPotentialSettings, 
                                    'spacing', 0.0, 0.06));
additions.push(presetPotOptions.add(controls.presetPotentialSettings, 
                                    'x1', 0.35, 0.5));
additions.push(presetPotOptions.add(controls.presetPotentialSettings, 
                                    'x2', 0.5, 0.65));
presetPotOptions.additions = additions;
let newWavefuncOptions = gui.addFolder('New ψ(x, y) Options');
newWavefuncOptions.add(controls, 'sigma', 0.01, 0.08);
let initPByMouse = newWavefuncOptions.add(controls, 
                                          'initMomentumByPxPySliders'
                                          ).name('Use px/py sliders');
let pxControl = newWavefuncOptions.add(controls, 'px', -50.0, 50.0);
let pyControl = newWavefuncOptions.add(controls, 'py', -50.0, 50.0);
let drawBarrierOptions = gui.addFolder('Draw Barrier Options');
drawBarrierOptions.add(controls, 'drawShape',
                       ['circle', 'square']).name('Draw Shape');
drawBarrierOptions.add(controls, 'drawSize', 0.0, 0.1).name('Size');
drawBarrierOptions.add(controls, 'drawValue', 0.0, 
                       11000.0/controls.c).name('E');
let viewOptions = gui.addFolder('ψ(x, y) View Options');
viewOptions.add(controls, 'brightness', 0.0, 10.0);
phaseOptions = viewOptions.add(controls, 'phaseOption', 
                               controls.phaseOptions).name('Colour Options');
phaseOptions.onChange(e => {controls.phaseMode
                             = controls.phaseOptions.indexOf(e);});
viewOptions.add(controls, 'showPsi1').name('Show |ψ1|^2');
viewOptions.add(controls, 'showPsi2').name('Show |ψ2|^2');
viewOptions.add(controls, 'showPsi3').name('Show |ψ3|^2');
viewOptions.add(controls, 'showPsi4').name('Show |ψ4|^2');
viewOptions.add(controls, 'applyPhaseShift').name('Adjust Global Phase');
gui.add(controls, 'dt', 0.000001, 0.00003).name('dt');
gui.add(controls, 'm', 0.0, 2.0).name('m');

function logFPS() {
    if (controls.showFPS) {
        let date = new Date();
        let time = date.getMilliseconds();
        let interval = (controls.timeMilliseconds > time)?
                        1000 + time - controls.timeMilliseconds:
                        time - controls.timeMilliseconds;
        controls.timeMilliseconds = time;
        console.clear();
        console.log(parseInt(1000/interval));
    }
}

function initWavefunc() {
    controls.t = 0.0;
    let frames = [];
    uFrames.forEach(e => frames.push(e));
    vFrames.forEach(e => frames.push(e));
    let sigma = controls.sigma;
    for (let f of frames) {
        f.useProgram(initWaveProgram);
        f.bind();
        f.setFloatUniforms(
            {"bx": controls.bx, "by": controls.by, 
            "sx": controls.sigma, "sy": sigma, 
            "amp": (f.frameNumber > 2)? 0.0: 2.0*30.0/(sigma*512.0),
            "px": controls.px, "py": controls.py}
        );
        draw();
        unbind();
    }
}

function initializePotential(type) {
    controls.presetPotentialSettings.a = 10000/controls.c
    potFrame.useProgram(potProgram);
    potFrame.bind();
    if (type == 'SHO') {
        controls.potentialType = 1;
        potFrame.setFloatUniforms(controls.presetPotentialSettings);
        potFrame.setIntUniforms({"potentialType": controls.potentialType});
        let newControlVals = {bx: 0.30, by: 0.30, 
                              px: -10.0, py: 10.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newControlVals).forEach(e => controls[e[0]] = e[1]);
    } else if (type == 'Double Slit') {
        controls.potentialType = 2;
        controls.presetPotentialSettings.x1 = 0.43;
        controls.presetPotentialSettings.x2 = 0.57;
        controls.presetPotentialSettings.w = 0.02;
        controls.presetPotentialSettings.spacing = 0.03;
        potFrame.setFloatUniforms(controls.presetPotentialSettings);
        potFrame.setIntUniforms({"potentialType": controls.potentialType});
        let newControlVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true, 
                              mouseSelect: 'new ψ(x, y)'};
        Object.entries(newControlVals).forEach(e => controls[e[0]] = e[1]);
    } else if (type == 'Single Slit') {
        controls.potentialType = 3;
        controls.presetPotentialSettings.x1 = 0.5;
        controls.presetPotentialSettings.w = 0.01;
        controls.presetPotentialSettings.spacing = 0.01;
        potFrame.setFloatUniforms(controls.presetPotentialSettings);
        potFrame.setIntUniforms({"potentialType": controls.potentialType});
        let newControlVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'new ψ(x, y)'};
        Object.entries(newControlVals).forEach(e => controls[e[0]] = e[1]);
    } else if (type == 'Step') {
        controls.potentialType = 4;
        controls.presetPotentialSettings.a = 5000/controls.c
        potFrame.setFloatUniforms(controls.presetPotentialSettings);
        potFrame.setIntUniforms({"potentialType": controls.potentialType});
        let newControlVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'new ψ(x, y)'};
        Object.entries(newControlVals).forEach(e => controls[e[0]] = e[1]);
    } else if (type == 'Spike') {
        controls.potentialType = 5;
        potFrame.setIntUniforms({"potentialType": controls.potentialType});
        let newControlVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'new ψ(x, y)'};
        Object.entries(newControlVals).forEach(e => controls[e[0]] = e[1]);
    } else {
        controls.potentialType = 7;
        potFrame.setIntUniforms({"potentialType": controls.potentialType});
    }
    draw();
    unbind();
    controls.isDisplayUpdate = true;
    mouseSelect.updateDisplay();
    for (let e of presetPotOptions.additions) e.updateDisplay();
    controls.isDisplayUpdate = false;
}
potSelect.onChange(e => initializePotential(e));


function onPotentialSettingsChange() {
    if (controls.isDisplayUpdate === false) {
        potFrame.useProgram(potProgram);
        potFrame.bind();
        potFrame.setIntUniforms({'potentialType': controls.potentialType});
        potFrame.setFloatUniforms(controls.presetPotentialSettings);
        draw();
        unbind();
    }
}
for (let e of presetPotOptions.additions) {
    e.onChange(onPotentialSettingsChange);
}

function reshapePotential(mode) {
    let drawMode = 0;
    if (controls.drawShape === 'circle') {
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
        "drawWidth": controls.drawSize, 
        "bx": controls.bx, "by": controls.by, 
        "v2": (mode === 0)? controls.drawValue: 0.0
    });
    draw();
    unbind();
}

function step() {
    let dt = controls.dt;
    controls.t += dt;
    let w = controls.w, h = controls.h;
    let hbar = controls.hbar;
    let m = controls.m;
    let c = controls.c;
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
        let prevBx = controls.bx;
        let prevBy = controls.by;
        controls.bx = Math.floor((ev.clientX 
                                  - canvas.offsetLeft))/canvasStyleWidth;
        controls.by = 1.0 - Math.floor((ev.clientY
                                         - canvas.offsetTop)
                                       )/canvasStyleHeight;
        if (!controls.initMomentumByPxPySliders) {
            controls.px = pixelWidth*parseFloat(controls.bx - prevBx);
            if (Math.abs(controls.px) > 80.0) {
                controls.px = Math.sign(controls.px)*80.0;
            }
            controls.py = pixelHeight*parseFloat(controls.by - prevBy);
            if (Math.abs(controls.py) > 80.0) {
                controls.py = Math.sign(controls.py)*80.0;
            }
        }
    }
    if (mouseUse) {
        controls.mouseAction = true;
    }
};
canvas.addEventListener("mouseup", ev => {
    pxControl.updateDisplay();
    pyControl.updateDisplay();
    mousePos(ev, 'up');
    mouseUse = false;
});
canvas.addEventListener("mousedown", () => {
    mouseUse = true;
});
canvas.addEventListener("mousemove", ev => mousePos(ev, 'move'));

initWavefunc();

function animation() {
    if (controls.mouseAction) {
        if (controls.mouseSelect === 'new ψ(x, y)') initWavefunc();
        else if (controls.mouseSelect === 'Draw Barrier') reshapePotential(0);
        else if (controls.mouseSelect === 'Erase Barrier') reshapePotential(1);
        controls.mouseAction = false;
    }
    for (let i = 0; i < controls.stepsPerFrame; i++) step();
    viewFrame.useProgram(viewProgram);
    viewFrame.bind();
    viewFrame.setIntUniforms(
        {"uTex": uFrames[0].frameNumber,
         "vTex1": vFrames[0].frameNumber,
         "vTex2": vFrames[1].frameNumber, 
         "potTex": potFrame.frameNumber,
         "displayMode": controls.phaseMode}
    );
    viewFrame.setFloatUniforms(
        {"constPhase": (controls.applyPhaseShift)? 
                        controls.t*controls.m*controls.c**2: 0.0,
         "pixelW": pixelWidth, "pixelH": pixelHeight,
         "brightness": controls.brightness,
         "showPsi1": (controls.showPsi1)? 1.0: 0.0, 
         "showPsi2": (controls.showPsi2)? 1.0: 0.0,
         "showPsi3": (controls.showPsi3)? 1.0: 0.0, 
         "showPsi4": (controls.showPsi4)? 1.0: 0.0}
    )
    logFPS();
    draw();
    unbind();
    requestAnimationFrame(animation);
}

animation();