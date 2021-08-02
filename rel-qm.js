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
    dt: 0.00001,
    // dt: 0.001,
    sigma: 0.05859375,
    // The fundamental constants used are expressed
    // in terms of [Hartree atomic units]
    // (https://en.wikipedia.org/wiki/Hartree_atomic_units)
    m: 1.0, c: 137.036, hbar: 1.0,
    t: 0.0,
    mouseSelect: 'new ψ(x, y)',
    presetPotentials: 'Free (Periodic)',
    stepsPerFrame: 6,
    brightness: 1.0,
    applyPhaseShift: true,
    showFPS: false, timeMilliseconds: 0,
    showPsi1: true, showPsi2: true, showPsi3: true, showPsi4: true,
    phaseOption: 'ψ1 Phase',
    phaseOptions: ['ψ1 Phase', 'ψ2 Phase', 'ψ3 Phase', 'ψ4 Phase', 
                   '|ψ12|-|ψ34|', 'None'],
    phaseMode: 0
};
gui.add(controls, 'brightness', 0.0, 10.0);
gui.add(controls , 'stepsPerFrame', 0, 20).name('steps/frame').step(1);
let potSelect = gui.add(controls, 'presetPotentials', 
                        ['Free (Periodic)', 'SHO', 'Double Slit',
                         'Single Slit', 'Step', 'Spike',
                         'Triple Slit']
                        ).name('Preset Potential');
let mouseSelect = gui.add(controls, 'mouseSelect', ['new ψ(x, y)', 
                                                    'Draw Barrier', 
                                                    'Erase Barrier']
                          ).name('Mouse Select');
let viewOptions = gui.addFolder('ψ(x, y) View Options');
phaseOptions = viewOptions.add(controls, 'phaseOption', 
                               controls.phaseOptions).name('Colour Options');
phaseOptions.onChange(e => {controls.phaseMode
                             = controls.phaseOptions.indexOf(e);});
viewOptions.add(controls, 'showPsi1').name('Show |ψ1|^2');
viewOptions.add(controls, 'showPsi2').name('Show |ψ2|^2');
viewOptions.add(controls, 'showPsi3').name('Show |ψ3|^2');
viewOptions.add(controls, 'showPsi4').name('Show |ψ4|^2');
viewOptions.add(controls, 'applyPhaseShift').name('Adjust Global Phase');
gui.add(controls, 'sigma', 0.01, 0.08);
gui.add(controls, 'dt', 0.000001, 0.00003).name('dt');
// gui.add(controls, 'dt', 0.001, 0.03).name('dt');
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
    for (let f of frames) {
        f.useProgram(initWaveProgram);
        f.bind();
        f.setFloatUniforms(
            {"bx": controls.bx, "by": controls.by, 
            "sx": controls.sigma, "sy": controls.sigma, 
            "amp": (f.frameNumber > 2)? 0.0: 2.0,
            "px": controls.px, "py": controls.py}
        );
        draw();
        unbind();
    }
}

function initializePotential(type) {
    potFrame.useProgram(potProgram);
    potFrame.bind();
    if (type == 'SHO') {
        potFrame.setFloatUniforms({"a": 10000.0/controls.c});
        potFrame.setIntUniforms({"potentialType": 1});
    } else if (type == 'Double Slit') {
        potFrame.setFloatUniforms(
            {"a": 10000.0/controls.c, "y0": 0.45, "w": 0.02, 
             "spacing": 0.03, "x1": 0.43, "x2": 0.57}
        );
        potFrame.setIntUniforms({"potentialType": 2});
    } else if (type == 'Single Slit') {
        potFrame.setFloatUniforms(
            {"a": 10000.0/controls.c, "y0": 0.45, "w": 0.01, 
             "spacing": 0.01, "x1": 0.5}
        );
        potFrame.setIntUniforms({"potentialType": 3});
    } else if (type == 'Step') {
        potFrame.setFloatUniforms({"a": 5000.0/controls.c});
        potFrame.setIntUniforms({"potentialType": 4});
    } else if (type == 'Spike') {
        potFrame.setIntUniforms({"potentialType": 5});
    } else if (type == 'Triple Slit') {
        potFrame.setIntUniforms({"potentialType": 6});
    } else {
        potFrame.setIntUniforms({"potentialType": 7});
    }
    draw();
    unbind();
}
potSelect.onChange(e => initializePotential(e));


function reshapePotential(mode) {
    extraFrame.useProgram(copyOverProgram);
    extraFrame.bind();
    extraFrame.setIntUniforms({"tex1": potFrame.frameNumber});
    draw();
    unbind();
    potFrame.useProgram(reshapePotProgram);
    potFrame.bind();
    potFrame.setIntUniforms({"tex1": extraFrame.frameNumber, 
                             "eraseMode": mode,
                             "drawMode" : 1});
    potFrame.setFloatUniforms({
        "drawWidth": 0.015, "bx": controls.bx, "by": controls.by, 
        "v2": (mode === 0)? 10000.0/controls.c: 0.0
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
let mouseAction = false;
let mousePos = function(ev, mode) {
    if (mode == 'move') {
        let prevBx = controls.bx;
        let prevBy = controls.by;
        controls.bx = Math.floor((ev.clientX 
                                  - canvas.offsetLeft))/canvasStyleWidth;
        controls.by = 1.0 - Math.floor((ev.clientY - canvas.offsetTop))/canvasStyleHeight;
        controls.px = pixelWidth*parseFloat(controls.bx - prevBx);
        if (Math.abs(controls.px) > 80.0) {
            controls.px = Math.sign(controls.px)*80.0;
        }
        controls.py = pixelHeight*parseFloat(controls.by - prevBy);
        if (Math.abs(controls.py) > 80.0) {
            controls.py = Math.sign(controls.py)*80.0;
        }
    }
    if (mouseUse) {
        mouseAction = true;
    }
};
canvas.addEventListener("mouseup", ev => {
    mousePos(ev, 'up');
    mouseUse = false;
});
canvas.addEventListener("mousedown", () => {
    mouseUse = true;
});
canvas.addEventListener("mousemove", ev => mousePos(ev, 'move'));

initWavefunc();

function animation() {
    if (mouseAction) {
        if (controls.mouseSelect === 'new ψ(x, y)') initWavefunc();
        else if (controls.mouseSelect === 'Draw Barrier') reshapePotential(0);
        else if (controls.mouseSelect === 'Erase Barrier') reshapePotential(1);
        mouseAction = false;
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