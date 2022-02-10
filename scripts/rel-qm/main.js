// (?:[a-zA-Z]*[fF]rames*|nullTex)
let viewFrame = new Frame(pixelWidth, pixelHeight, 0);
uFrames = [1, 2].map(e => new Frame(pixelWidth, pixelHeight, e));
let uSwap = () => uFrames = [uFrames[1], uFrames[0]];
vFrames = [3, 4].map(e => new Frame(pixelWidth, pixelHeight, e));
let vSwap = () => vFrames = [vFrames[1], vFrames[0]];
let potFrame = new Frame(pixelWidth, pixelHeight, 5);
let guiFrame = new Frame(pixelWidth, pixelHeight, 6);
let vectorFieldFrame = new VectorFieldFrame(pixelWidth, pixelHeight, 7);
let vectorPotentialFrame = new Frame(pixelWidth, pixelHeight, 8);
let extraFrame = new Frame(pixelWidth, pixelHeight, 9);
let nullTex = 10;
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


changeGrid.onChange(
    e => {
        let w = parseInt(e.split('x')[0]);
        let h = w;
        setFrameDimensions(w, h);
        let dx = guiData.w/pixelWidth;
        dtControl.min(-0.5*dx/guiData.c);
        dtControl.max(0.9*dx/guiData.c);
        dtControl.setValue(0.3508*dx/guiData.c);
        dtControl.updateDisplay();
        initializePotential(guiData.presetPotentials, potFrame, potProgram);
        guiControls.drawBarrierOptions.close();
        guiControls.probInBoxFolder.close();
        document.getElementById('sketch-canvas').width = w;
        document.getElementById('sketch-canvas').height = h;
        document.getElementById('image-canvas').width = w;
        document.getElementById('image-canvas').height = h;
    }
);


guiData.imageFunc = function () {
    let canvas = document.getElementById('image-canvas');
    console.log(canvas.width, canvas.height);
    let ctx = canvas.getContext("2d");
    ctx.rect(0, 0, pixelWidth, pixelHeight);
    ctx.fill();
    let im = document.getElementById('image');
    let w = pixelWidth, h = pixelHeight;
    if (im.width > im.height) {
        let heightOffset = parseInt(`${0.5*w
                                       - 0.5*w*im.height/im.width}`);
        ctx.drawImage(im, 0, heightOffset, 
                      w, parseInt(`${w*im.height/im.width}`));
    } else {
        let widthOffset = parseInt(`${0.5*w
                                      - 0.5*w*im.width/im.height}`);
        ctx.drawImage(im, widthOffset, 0, 
                      parseInt(`${w*im.width/im.height}`), w);
    }
    let imageData = new Float32Array(ctx.getImageData(0.0, 0.0, 
                                                      w, h
                                                      ).data);
    for (let i = 0; i < imageData.length; i++) {
        imageData[i] *= (100.0/255.0);
    }
    extraFrame.substituteTextureArray(pixelWidth, pixelHeight, 
                                      gl.FLOAT, imageData);
    potFrame.useProgram(imagePotentialProgram);
    potFrame.bind();
    potFrame.setIntUniforms({tex: extraFrame.frameNumber,
                             invert: false});
    draw();
    unbind();
}

function initWavefunc(customData = null) {
    guiData.t = 0.0;
    let frames = [];
    uFrames.forEach(e => frames.push(e));
    vFrames.forEach(e => frames.push(e));
    let wavefuncData = (customData !== null)? 
                            customData: guiData;
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
        /*if (f.frameNumber === uFrames[0].frameNumber) {
            t = 2.0*wavefuncData.dt;
        } else if (f.frameNumber === vFrames[0].frameNumber || 
                   f.frameNumber === vFrames[1].frameNumber) {
            t = wavefuncData.dt;
        }*/
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
    let dt = guiData.dt;
    console.log(dt);
    let w = guiData.w, h = guiData.h;
    let hbar = guiData.hbar;
    let m = guiData.m;
    let c = guiData.c;
    // uFrames[0].useProgram(stepUpProgram);
    // uFrames[0].bind();
    // uFrames[0].setFloatUniforms(
    //     {"dt": dt/2.0, "dx": w/pixelWidth, "dy": h/pixelHeight,
    //      "w": w, "h": h, "m": m, 
    //      "hbar": hbar, "c": c}
    // );
    // uFrames[0].setIntUniforms(
    //     {"vTex": vFrames[1].frameNumber,
    //      "uTex": uFrames[1].frameNumber,
    //      "potTex": potFrame.frameNumber,
    //      "useVecPot": (guiData.useVectorPotential)? 1: 0,
    //      "vecPotTex": vectorPotentialFrame.frameNumber}
    // );
    // draw();
    // unbind();
    vFrames[0].useProgram(stepDownProgram);
    vFrames[0].bind();
    vFrames[0].setFloatUniforms(
        {dt: dt/2.0, dx: w/pixelWidth, dy: h/pixelHeight,
         w: w, h: h, m: m, 
         hbar: hbar, c: c}
    );
    vFrames[0].setIntUniforms(
        {vTex: vFrames[1].frameNumber,
         uTex: uFrames[1].frameNumber,
         potTex: potFrame.frameNumber,
         useVecPot: (guiData.useVectorPotential)? 1: 0,
         vecPotTex: vectorPotentialFrame.frameNumber}
    );
    draw();
    unbind();

}

function initializePotential(type, potentialFrame, potentialProgram) {
    guiData.presetPotentialSettings.a = 10000/guiData.c
    potentialFrame.useProgram(potentialProgram);
    potentialFrame.bind();
    guiData.potBrightness = (type == 'Coulomb')? 0.25: 1.0;
    if (type == 'SHO') {
        guiData.potentialType = 1;
        let newDataVals = {bx: 0.30, by: 0.30, 
                              px: -10.0, py: 10.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => guiData[e[0]] = e[1]);
    } else if (type == 'Double Slit') {
        guiData.potentialType = 2;
        guiData.presetPotentialSettings.x1 = 0.43;
        guiData.presetPotentialSettings.x2 = 0.57;
        guiData.presetPotentialSettings.w = 0.02;
        guiData.presetPotentialSettings.spacing = 0.03;
        let newDataVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true, 
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => guiData[e[0]] = e[1]);
    } else if (type == 'Single Slit') {
        guiData.potentialType = 3;
        guiData.presetPotentialSettings.x1 = 0.5;
        guiData.presetPotentialSettings.w = 0.01;
        guiData.presetPotentialSettings.spacing = 0.01;
        let newDataVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => guiData[e[0]] = e[1]);
    } else if (type == 'Step') {
        guiData.potentialType = 4;
        guiData.presetPotentialSettings.a = 5000/guiData.c
        let newDataVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => guiData[e[0]] = e[1]);
    } else if (type == 'Coulomb') {
        guiData.potentialType = 7;
        let newDataVals = {bx: 0.5, by: 0.20, 
                              px: 0.0, py: 30.0, mouseAction: true,
                              mouseSelect: 'New ψ(x, y)'};
        Object.entries(newDataVals).forEach(e => guiData[e[0]] = e[1]);
    } else {
        guiData.potentialType = 0;
    }
    potentialFrame.setFloatUniforms(guiData.presetPotentialSettings);
    potentialFrame.setIntUniforms({"potentialType": guiData.potentialType,
                             "dissipativePotentialType": 1});
    draw();
    unbind();
    guiData.isDisplayUpdate = true;
    guiControls.mouseSelect.updateDisplay();
    for (let e of guiControls.presetPotOptions.additions) e.updateDisplay();
    guiData.isDisplayUpdate = false;
}



guiControls.potSelect.onChange(e => {
    initializePotential(e, potFrame, potProgram);
    // guiControls.newWavefuncOptions.open();
    guiControls.drawBarrierOptions.close();
    guiControls.probInBoxFolder.close();
});


function onPotentialSettingsChange() {
    if (guiData.isDisplayUpdate === false) {
        potFrame.useProgram(potProgram);
        potFrame.bind();
        potFrame.setIntUniforms({'potentialType': guiData.potentialType});
        potFrame.setFloatUniforms(guiData.presetPotentialSettings);
        draw();
        unbind();
    }
}
for (let e of guiControls.presetPotOptions.additions) {
    e.onChange(onPotentialSettingsChange);
}

function reshapePotential(mode, data) {
    let drawWidth = data.drawSize*canvas.width;
    if (data.mouseCount > 1 && data.drawSize > 0.0 && 
        (Math.abs(data.px) > drawWidth ||
         Math.abs(data.py) > drawWidth)) {
        if (data.reshapePotentialRecursionLevel < 100) {
            console.log(data.reshapePotentialRecursionLevel);
            let newData = Object.create(data);
            let dist = Math.sqrt(data.px**2 + data.py**2);
            let dx = drawWidth*data.px/dist;
            let dy = drawWidth*data.py/dist;
            newData.bx -= data.drawSize*data.px/dist;
            newData.by -= data.drawSize*data.py/dist;
            newData.px -= dx;
            newData.py -= dy;
            newData.reshapePotentialRecursionLevel++;
            console.log(newData.bx, newData.by);
            reshapePotential(mode, newData);  
        }
    }
    let drawMode = 0;
    if (data.drawShape === 'circle') {
        drawMode = 1;
    }
    else if (data.drawShape === 'gaussian') {
        drawMode = 2;
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
    // console.log(data.bx, data.by);
    potFrame.setFloatUniforms({
        "drawWidth": data.drawSize,
        "drawHeight": data.drawSize,
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
    let customData = Object.create(guiData);
    customData.by = j/(pixelWidth*canvas.width);
    customData.bx = (j%(pixelHeight))/canvas.height;
    customData.px = 0.0;
    customData.py = 0.0;
    customData.sigma = 6.0/pixelWidth;
    initWavefunc(customData);
}
guiData.measurePosition = measurePosition;


function changeProbBoxDisplay() {
    guiFrame.useProgram(guiRectProgram);
    guiFrame.bind();
    guiFrame.setFloatUniforms({
        x0: guiData.drawRect.x, y0: guiData.drawRect.y,
        w: guiData.drawRect.w, h: guiData.drawRect.h,
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
    let dt = guiData.dt;
    guiData.t += dt;
    let w = guiData.w, h = guiData.h;
    let hbar = guiData.hbar;
    let m = guiData.m;
    let c = guiData.c;
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
         "potTex": potFrame.frameNumber,
         "useVecPot": (guiData.useVectorPotential)? 1: 0,
         "vecPotTex": vectorPotentialFrame.frameNumber}
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
         "potTex": potFrame.frameNumber,
         "useVecPot": (guiData.useVectorPotential)? 1: 0,
         "vecPotTex": vectorPotentialFrame.frameNumber}
    );
    draw();
    unbind();
    vSwap();
}


initWavefunc();

function animation() {
    if (stats) stats.begin();
    if (guiData.mouseAction) {
        if (guiData.mouseSelect === 'New ψ(x, y)') 
            initWavefunc();
        else if (guiData.mouseSelect === 'Draw Barrier')
            reshapePotential(0, guiData);
        else if (guiData.mouseSelect === 'Erase Barrier')
            reshapePotential(1, guiData);
        else if (guiData.mouseSelect === 'Prob. in Box')
            changeProbBoxDisplay();
        guiData.mouseAction = false;
    }
    let showBox = false;
    if (guiData.mouseSelect === 'Prob. in Box') {
        showBox =true;
        showProbInfo();
    }
    if (guiData.viewProbCurrent) {
        showProbCurrent();
    }
    for (let i = 0; i < guiData.stepsPerFrame; i++) step();
    viewFrame.useProgram(viewProgram);
    viewFrame.bind();
    viewFrame.setIntUniforms(
        {"uTex": uFrames[0].frameNumber,
         // "uTex2": uFrames[1].frameNumber,
         "vTex1": vFrames[0].frameNumber,
         "vTex2": vFrames[1].frameNumber, 
         "potTex": potFrame.frameNumber,
         "guiTex": (showBox)? guiFrame.frameNumber: nullTex,
         "wavefuncDisplayMode": (guiData.showWavefuncHeightMap)? 
                                6: guiData.phaseMode,
         "potentialDisplayMode": guiData.potentialDisplayMode,
         "vecTex": (guiData.viewProbCurrent)? 
                    vectorFieldFrame.frameNumber: nullTex}
    );
    viewFrame.setFloatUniforms(
        {"constPhase": (guiData.applyPhaseShift)? 
                        guiData.t*guiData.m*guiData.c**2: 0.0,
         "pixelW": pixelWidth, "pixelH": pixelHeight,
         "psiBrightness": guiData.brightness,
         "potBrightness": guiData.potBrightness,
         "showPsi1": (guiData.showPsi1)? 1.0: 0.0, 
         "showPsi2": (guiData.showPsi2)? 1.0: 0.0,
         "showPsi3": (guiData.showPsi3)? 1.0: 0.0, 
         "showPsi4": (guiData.showPsi4)? 1.0: 0.0}
    );
    viewFrame.setVec3Uniforms(
        {probColour: guiData.probColour, potColour: guiData.potColour}
    );
    logFPS();
    draw();
    unbind();
    if (stats) stats.end();
    handleRecording(canvas).then(
        () => requestAnimationFrame(animation));
}

animation();
