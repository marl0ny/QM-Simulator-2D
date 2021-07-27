let vShader = makeShader(gl.VERTEX_SHADER, vertexShaderSource);
let initWaveShader = makeShader(gl.FRAGMENT_SHADER, 
                                initialSpinorWaveFragmentSource);
let stepUpShader = makeShader(gl.FRAGMENT_SHADER, 
                              diracStepUpFragmentSource);
let stepDownShader = makeShader(gl.FRAGMENT_SHADER,
                                diracStepDownFragmentSource);
let viewShader = makeShader(gl.FRAGMENT_SHADER,
                            diracViewFragmentSource);

let initWaveProgram = makeProgram(vShader, initWaveShader);
let stepUpProgram = makeProgram(vShader, stepUpShader);
let stepDownProgram = makeProgram(vShader, stepDownShader);
let viewProgram = makeProgram(vShader, viewShader);

let viewFrame = new Frame(pixelWidth, pixelHeight, 0);
uFrames = [1, 2].map(e => new Frame(pixelWidth, pixelHeight, e));
let uSwap = () => uFrames = [uFrames[1], uFrames[0]];
vFrames = [3, 4].map(e => new Frame(pixelWidth, pixelHeight, e));
let vSwap = () => vFrames = [vFrames[1], vFrames[0]];
let potFrame = new Frame(pixelWidth, pixelHeight, 5);
let nullTex = 6;


let gui = new dat.GUI();
let controls = {
    bx: 0.5, by: 0.5, px: 0.0, py: 40.0, dt: 0.00001,
    // The fundamental constants used are expressed
    // in terms of [Hartree atomic units]
    // (https://en.wikipedia.org/wiki/Hartree_atomic_units)
    m: 1.0, c: 137.036, hbar: 1.0
};
gui.add(controls , 'dt', 0.000001, 0.00003).name('dt');
gui.add(controls , 'm', 0.0, 2.0).name('m');

function initWavefunc() {
    let frames = [];
    uFrames.forEach(e => frames.push(e));
    vFrames.forEach(e => frames.push(e));
    for (let f of frames) {
        f.useProgram(initWaveProgram);
        f.bind();
        f.setFloatUniforms(
            {"bx": controls.bx, "by": controls.by, 
            "sx": 0.05859375, "sy": 0.05859375, "amp": 2.0,
            "px": controls.px, "py": controls.py}
        );
        draw();
        unbind();
    }
}

function step() {
    let dt = controls.dt;
    let w = 2.0, h = 2.0;
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
         "uTex": uFrames[0].frameNumber}
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
         "uTex": uFrames[0].frameNumber}
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
                                  - canvas.offsetLeft))/pixelWidth;
        controls.by = 1.0 - Math.floor((ev.clientY - canvas.offsetTop))/pixelHeight;
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
        initWavefunc();
        mouseAction = false;
    }
    step();
    viewFrame.useProgram(viewProgram);
    viewFrame.bind();
    viewFrame.setIntUniforms(
        {"wavefuncTex": uFrames[0].frameNumber}
    );
    draw();
    unbind();
    requestAnimationFrame(animation);
}

animation();