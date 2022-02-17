

let sim = new SplitStepSimulationManager();



function initializePotential(type) {
    guiData.presetPotentialSettings.a = 10000/guiData.c;
    guiData.potBrightness = (type == 'Coulomb')? 0.25: 1.0;
    let newDataVals;
    if (type == 'SHO') {
        guiData.potentialType = 1;
        newDataVals = {bx: 0.30, by: 0.30, 
                       px: -10.0, py: 10.0, mouseAction: true,
                       mouseSelect: 'New ψ(x, y)'};
    } else if (type == 'Double Slit') {
        guiData.potentialType = 2;
        guiData.presetPotentialSettings.x1 = 0.43;
        guiData.presetPotentialSettings.x2 = 0.57;
        guiData.presetPotentialSettings.w = 0.02;
        guiData.presetPotentialSettings.spacing = 0.03;
        newDataVals = {bx: 0.5, by: 0.20, 
                       px: 0.0, py: 30.0, mouseAction: true, 
                       mouseSelect: 'New ψ(x, y)'};
    } else if (type == 'Single Slit') {
        guiData.potentialType = 3;
        guiData.presetPotentialSettings.x1 = 0.5;
        guiData.presetPotentialSettings.w = 0.01;
        guiData.presetPotentialSettings.spacing = 0.01;
        newDataVals = {bx: 0.5, by: 0.20, 
                       px: 0.0, py: 30.0, mouseAction: true,
                       mouseSelect: 'New ψ(x, y)'};
    } else if (type == 'Step') {
        guiData.potentialType = 4;
        guiData.presetPotentialSettings.a = 5000/guiData.c
        newDataVals = {bx: 0.5, by: 0.20, 
                       px: 0.0, py: 30.0, mouseAction: true,
                       mouseSelect: 'New ψ(x, y)'};
    } else if (type == 'Coulomb') {
        guiData.potentialType = 7;
        newDataVals = {bx: 0.5, by: 0.20, 
                       px: 0.0, py: 30.0, mouseAction: true,
                       mouseSelect: 'New ψ(x, y)'};
    } else {
        guiData.potentialType = 0;
    }
    if (guiData.potentialType >= 1 && guiData.potentialType <= 7) {
        Object.entries(newDataVals).forEach(e => guiData[e[0]] = e[1]);
    }
    sim.presetPotential(guiData.potentialType, 
                        0, guiData.presetPotentialSettings);
    unbind();
    guiData.isDisplayUpdate = true;
    guiControls.mouseSelect.updateDisplay();
    for (let e of guiControls.presetPotOptions.additions) e.updateDisplay();
    guiData.isDisplayUpdate = false;
}


guiControls.potSelect.onChange(e => {
    initializePotential(e);
    // guiControls.newWavefuncOptions.open();
    guiControls.drawBarrierOptions.close();
    guiControls.probInBoxFolder.close();
});


function setFrameDimensions(newWidth, newHeight) {
    document.getElementById('sketch-canvas').width = newWidth;
    document.getElementById('sketch-canvas').height = newHeight;
    pixelWidth = newWidth;
    pixelHeight = newHeight;
    sim.setFrameDimensions(newWidth, newHeight);
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
        initializePotential(guiData.presetPotentials);
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
    sim.imagePotential(imageData, 0);
}

function initWavefunc(customData = null) {
    guiData.t = 0.0;
    let simData = {
        dt: guiData.dt, 
        w: guiData.w, h: guiData.h, 
        hbar: guiData.hbar, m: guiData.m, c: guiData.c, 
        useVectorPotential: guiData.useVectorPotential
    };
    let wavefuncData = (customData !== null)? 
                            customData: guiData;
    sim.initWavefunc(simData, wavefuncData);
}


function onPotentialSettingsChange() {
    if (guiData.isDisplayUpdate === false) {
        sim.presetPotential(guiData.potentialType, 
                            0, guiData.presetPotentialSettings);
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
    sim.reshapePotential(drawMode, mode, data);
}

function getUnnormalizedProbDist() {
    return sim.getUnnormalizedProbDist();
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
    sim.probBoxDisplay(guiData);
}

function showProbCurrent() {
    sim.probCurrent({});
}

function step() {
    let dt = guiData.dt;
    guiData.t += dt;
    sim.step(guiData);
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
    guiData.showBox = false;
    if (guiData.mouseSelect === 'Prob. in Box') {
        guiData.showBox =true;
        showProbInfo();
    }
    if (guiData.viewProbCurrent) {
        showProbCurrent();
    }
    for (let i = 0; i < guiData.stepsPerFrame; i++) step();
    sim.display(guiData);
    logFPS();
    if (stats) stats.end();
    handleRecording(canvas).then(
        () => requestAnimationFrame(animation));
}

animation();
