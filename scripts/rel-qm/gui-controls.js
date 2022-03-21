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
let speedSelect
    = gui.add(guiData , 'stepsPerFrame', 0, 20).name('speed').step(1);
let potSelect = gui.add(guiData, 'presetPotentials', 
                        ['Free (Periodic)', 'SHO', 'Double Slit',
                         'Single Slit', 'Step', 'Coulomb']
                        ).name('Preset Potential');
let mouseSelect = gui.add(guiData, 'mouseSelect', ['New ψ(x, y)', 
                                                    'Draw Barrier', 
                                                    'Erase Barrier',
                                                    'Prob. in Box']
                          ).name('Mouse Select');
let presetPotOptions = gui.addFolder('Preset Potential Options');
let additions = [];
additions.push(presetPotOptions.add(guiData.presetPotentialSettings, 
                                    'a', 0.0, 11000/guiData.c));
additions.push(presetPotOptions.add(guiData.presetPotentialSettings, 
                                    'y0', 0.25, 0.75));
additions.push(presetPotOptions.add(guiData.presetPotentialSettings, 
                                    'w', 0.0, 0.05));
additions.push(presetPotOptions.add(guiData.presetPotentialSettings, 
                                    'spacing', 0.0, 0.06));
additions.push(presetPotOptions.add(guiData.presetPotentialSettings, 
                                    'x1', 0.35, 0.5));
additions.push(presetPotOptions.add(guiData.presetPotentialSettings, 
                                    'x2', 0.5, 0.65));
presetPotOptions.additions = additions;
let mouseOptions = gui.addFolder('Mouse Select Options')
let newWavefuncOptions = mouseOptions.addFolder('New ψ(x, y)');
newWavefuncOptions.add(guiData, 'sigma', 0.01, 0.1);
let initPByMouse = newWavefuncOptions.add(guiData, 
                                          'initMomentumByPxPySliders'
                                          ).name('Use kx/ky sliders');
let pxControl = newWavefuncOptions.add(guiData, 'px', -50.0, 50.0).name('kx');
let pyControl = newWavefuncOptions.add(guiData, 'py', -50.0, 50.0).name('ky');
let initSpinorOptions = newWavefuncOptions.addFolder('Spinor Initialization Options');
{
    let components = ['Re(+E1)', 'Im(+E1)', 'Re(+E2)', 'Im(+E2)',
                    'Re(-E1)', 'Im(-E1)', 'Re(-E2)', 'Im(-E2)'];
    for (let i = 0; i < components.length; i++) {
        let e = components[i];
        let string = e.substring(0, 2).toLowerCase()
                     + 'Psi' + Math.floor(i/2 + 1).toString();
        initSpinorOptions.add(guiData.initSpinor, string,
                              -1.0, 1.0).name(e).step(0.02);
    }
}
let drawBarrierOptions = mouseOptions.addFolder('Draw/Erase Barrier');
let probInBoxFolder = mouseOptions.addFolder('Probability in Box');
let probShow = probInBoxFolder.add(guiData, 'probInRegion').name('Probability');
drawBarrierOptions.add(guiData, 'drawShape',
                       ['circle', 'square', 'gaussian']).name('Draw Shape');
drawBarrierOptions.add(guiData, 'drawSize', 0.0, 0.1).name('Size');
drawBarrierOptions.add(guiData, 'drawValue', 0.0, 
                       11000.0/guiData.c).name('E');
let viewOptionsFolder = gui.addFolder('Visualization Options');
let viewOptions = viewOptionsFolder.addFolder('ψ(x, y)');
viewOptions.add(guiData, 'brightness', 0.0, 8.0);
phaseOptions = viewOptions.add(guiData, 'phaseOption', 
                               guiData.phaseOptions).name('Phase Options');
viewOptions.add(guiData, 'showPsi1').name('Show |ψ1|^2');
viewOptions.add(guiData, 'showPsi2').name('Show |ψ2|^2');
viewOptions.add(guiData, 'showPsi3').name('Show |ψ3|^2');
viewOptions.add(guiData, 'showPsi4').name('Show |ψ4|^2');
viewOptions.add(guiData, 'applyPhaseShift').name('Adjust Global Phase');
viewOptions.add(guiData, 'viewProbCurrent').name('Show Current');
let probColourControls = viewOptions.addColor(
    {colour: [255.0, 255.0, 255.0]}, 'colour').name('|ψ|^2 Colour');
let wavefuncHeightMap = viewOptions.add(
    guiData, 'showWavefuncHeightMap').name('Show Height Map');
wavefuncHeightMap.onChange(() => {
    guiData.phaseOption = 'None';
    phaseOptions.updateDisplay();
});
probColourControls.onChange(
    e => {
        guiData.probColour[0] = e[0]/255.0;
        guiData.probColour[1] = e[1]/255.0;
        guiData.probColour[2] = e[2]/255.0;
        guiData.phaseMode = 5;
        guiData.phaseOption = 'None';
        phaseOptions.updateDisplay();
        guiData.showWavefuncHeightMap = false;
        wavefuncHeightMap.updateDisplay();
    }
);
phaseOptions.onChange(e => {
    guiData.phaseMode = guiData.phaseOptions.indexOf(e);
    guiData.showWavefuncHeightMap = false;
    wavefuncHeightMap.updateDisplay();
});
let potViewOptions = 
    viewOptionsFolder.addFolder('Potential');
potViewOptions.add(guiData, 'potBrightness', 0.0, 8.0).name('brightness');
let dx = guiData.w/pixelWidth;
let potColourControls = potViewOptions.addColor(
    {colour: [255.0, 255.0, 255.0]}, 'colour').name('V(x, y) Colour');
let potHeightMap = potViewOptions.add(
    guiData, 'showPotentialHeightMap').name('Show Height Map');
potHeightMap.onChange(e => {
    guiData.potentialDisplayMode = (e === true)? 1: 0; 
});
potColourControls.onChange(e => {
    guiData.potColour[0] = e[0]/255.0;
    guiData.potColour[1] = e[1]/255.0;
    guiData.potColour[2] = e[2]/255.0;
    guiData.potentialDisplayMode = 0;
    guiData.showPotentialHeightMap = false;
    potHeightMap.updateDisplay();
});
dtControl = gui.add(guiData, 'dt', -0.5*dx/guiData.c, 0.999*dx/guiData.c).name('dt');
gui.add(guiData, 'm', 0.0, 2.0).name('m');
// gui.add(guiData, 'c', 1.0, 140.0).name('c');
// gui.add(guiData, 'measurePosition').name('Measure Position');
let moreControls = gui.addFolder('More Controls');
let vectorPotOptions = moreControls.add(guiData, 'presetVectorPotentials', 
                                        ['None', 'ay, -bx, 0']
                                       ).name('Vector Potential');
let changeGrid = moreControls.add(guiData, 'gridDimensions', 
                                  ['256x256', '512x512', '1024x1024']
                                ).name('Grid Dimensions');
let imageOptions = moreControls.addFolder('Upload Image');
var htmlTxt = `<div>
<input id="uploadImage" type="file" 
style="color: #efefef; 
text-decoration: none; font-size: 1em;">
</div>`
let uploadImageButton = imageOptions.add({'uploadImage': () => {}}, 
                                        'uploadImage', true).name(htmlTxt);
uploadImageButton.domElement.hidden = true;
let uploadImage = document.getElementById("uploadImage");
let imageNameDisplay = imageOptions.add(guiData, 'imageName').name('File: ');
let screenshotsOptions = moreControls.addFolder('Take Screenshots');
let numberOfFramesEntry = screenshotsOptions.add(
    guiData, 'nScreenshots').name('Number of Screenshots');
downloadScreenshotsButton = screenshotsOptions.add(
    {download: () => {
        guiData.takeScreenshot = true;
        if (guiData.setStartSpeed) {
            guiData.stepsPerFrame = guiData.startSpeed;
            speedSelect.updateDisplay();
        }
    }}, 'download'
).name('Start');
let screenshotProgress = screenshotsOptions.add(guiData, 'screenshotProgress'
    ).name('Progress');
let setStartSpeed = screenshotsOptions.add(
    guiData, 'setStartSpeed', false).name('Set Start Speed');
let startSpeed = screenshotsOptions.add(
    guiData, 'startSpeed', 0, 20, 1).name('Start Speed');
let pauseOnFinish = screenshotsOptions.add(
    guiData, 'pauseOnFinish', false
).name('Pause On Finish');


function downloadScreenshotsZip(screenshots, screenshotNames) {
    if (screenshots.length > 100) {
        newScreenshots = [];
        newScreenshotNames = [];
        for (let i = 0; i < 100; i++) {
            newScreenshots.push(screenshots.pop());
            newScreenshotNames.push(screenshotNames.pop());
        }
        return downloadScreenshotsZip(newScreenshots, 
            newScreenshotNames).then(() =>
                downloadScreenshotsZip(screenshots, screenshotNames)
            );
    }
    let zip = new JSZip();
    while (screenshots.length > 0) {
        let dataURL = screenshots.pop();
        let imageName = screenshotNames.pop();
        zip.file(imageName, dataURL.slice(22), {base64: true});
    }
    let time = Date.now();

    // let options = {type: "blob",
    //                compression: "DEFLATE",
    //                compressionOptions: {level: 2}
    //             };
    // return zip.generateAsync(options).then( data => {
    //     let zipFile = new File([data], `images-${time}.zip`, 
    //                             {type: "application/zip"});
    // });

    let options = {type: "base64",
                   compression: "STORE",
                   // compression: "DEFLATE",
                   compressionOptions: {level: 2}
                };
    return zip.generateAsync(options).then( data => {
        // let div = document.getElementById('image-download');
        let aTag = document.createElement('a');
        aTag.hidden = true;
        aTag.id = `a-download-${time}-zip`;
        aTag.download = `"images-${time}.zip`;
        aTag.href = `data:application/zip;base64,${data}`;
        /*div.innerHTML += `<a href="data:application/zip;base64,${data}"
                            hidden="true" 
                            id="a-download-${time}-zip" 
                            download="images-${time}.zip"></a>`;*/
        return aTag;
    }).then(aTag => {
        // let aTag = document.getElementById(`a-download-${time}-zip`);
        // console.log(aTag);
        aTag.click();
        return aTag;
    }).then(aTag => {
        aTag.remove();
    });
}


function makeImageFilename(num, total) {
    let time = Date.now();
    let numStr = `${num + 1}`, totalStr = `${total}`;
    let numZeros = totalStr.length - numStr.length;
    for (let i = 0; i < numZeros; i++) {
        numStr = '0' + numStr;
    }
    return `image_${numStr}_${time}.png`;
}

function handleRecording(canvas) {
    if(guiData.takeScreenshot) {
        let zipSize = Math.floor(guiData.nScreenshots/15);
        if (zipSize <= 50) zipSize = 50;
        guiData.screenshots.push(canvas.toDataURL("image/png", 1));
        let name = makeImageFilename(guiData.screenshotCount, guiData.nScreenshots);
        guiData.screenshotNames.push(name);
        guiData.screenshotCount++;
        screenshotProgress.setValue(
            `Recording ${guiData.screenshotCount}/${guiData.nScreenshots}`);
        if (guiData.screenshotCount === guiData.nScreenshots) {
            let p = downloadScreenshotsZip(
                guiData.screenshots, guiData.screenshotNames).then(() => {
                    screenshotProgress.setValue('');
                })
            if (guiData.pauseOnFinish) {
                guiData.stepsPerFrame = 0;
                speedSelect.updateDisplay();
            }
            guiData.screenshotCount = 0;
            guiData.takeScreenshot = false;
            return p;
        }
        if (guiData.screenshotCount > 0 && 
            guiData.screenshotCount % zipSize === 0) {
            let screenshots = [];
            let screenshotNames = [];
            for (let i = 0; i < zipSize; i++) {
                screenshots.push(guiData.screenshots.pop());
                screenshotNames.push(guiData.screenshotNames.pop());
            }
            return downloadScreenshotsZip(screenshots, screenshotNames);
        }
    }
    return Promise.resolve();
}


function onUploadImage() {
    let im = document.getElementById("image");
    im.file = this.files[0];
    guiData.imageName = im.file.name;
    imageNameDisplay.updateDisplay();
    const reader = new FileReader();
    reader.onload = e => im.src = e.target.result;
    reader.readAsDataURL(this.files[0]);
}
uploadImage.addEventListener("change", onUploadImage, false);
imageOptions.add({'submit': () => guiData.imageFunc()},
                 'submit').name('Use for Pot.');


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
    changeGrid: changeGrid,
    imageOptions: imageOptions,
    imageNameDisplay: imageNameDisplay
};


guiControls.mouseSelect.onChange(e => {
    if (e === 'Prob. in Box') {
        guiControls.mouseOptions.open();
        guiControls.probInBoxFolder.open();
    } else if (e === 'Draw Barrier' || e === 'Erase Barrier') {
        guiData.initMomentumByPxPySliders = false;
        guiControls.initPByMouse.updateDisplay();
    } else {
        guiData.probInRegion = '0';
        guiControls.probShow.updateDisplay();
        guiControls.probInBoxFolder.close();
    }
});


function logFPS() {
    if (guiData.showFPS) {
        let date = new Date();
        let time = date.getMilliseconds();
        let interval = (guiData.timeMilliseconds > time)?
                        1000 + time - guiData.timeMilliseconds:
                        time - guiData.timeMilliseconds;
        guiData.timeMilliseconds = time;
        console.clear();
        console.log(parseInt(1000/interval));
    }
}

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
    let drawRect = guiData.drawRect;
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
        guiData.probInRegion = `${Math.round(1000.0*val)/1000.0}`;
    } else {
        guiData.probInRegion = '0';
    }
    guiControls.probShow.updateDisplay();
}


let mouseUse = false;
let mousePos = function(ev, mode) {
    if (mode == 'move') {
        guiData.mouseCount++;
        let prevBx = guiData.bx;
        let prevBy = guiData.by;
        guiData.bx = Math.floor((ev.clientX 
                                  - canvas.offsetLeft))/canvasStyleWidth;
        guiData.by = 1.0 - Math.floor((ev.clientY
                                         - canvas.offsetTop)
                                       )/canvasStyleHeight;
        if (mouseUse && guiData.mouseSelect === 'Prob. in Box') {
            guiData.drawRect.w = guiData.bx - guiData.drawRect.x; 
            guiData.drawRect.h = guiData.by - guiData.drawRect.y;
        }
        if (!guiData.initMomentumByPxPySliders) {
            guiData.px = pixelWidth*parseFloat(guiData.bx - prevBx);
            if (Math.abs(guiData.px) > 80.0) {
                guiData.px = Math.sign(guiData.px)*80.0;
            }
            guiData.py = pixelHeight*parseFloat(guiData.by - prevBy);
            if (Math.abs(guiData.py) > 80.0) {
                guiData.py = Math.sign(guiData.py)*80.0;
            }
        }
    }
    if (mouseUse) {
        guiData.mouseAction = true;
    }
};
canvas.addEventListener("mouseup", ev => {
    guiControls.pxControl.updateDisplay();
    guiControls.pyControl.updateDisplay();
    mousePos(ev, 'up');
    guiData.mouseCount = 0;
    mouseUse = false;
});
canvas.addEventListener("mousedown", ev => {
    guiData.drawRect.w = 0.0;
    guiData.drawRect.h = 0.0;
    guiData.bx = Math.floor((ev.clientX 
        - canvas.offsetLeft))/canvasStyleWidth;
    guiData.by = 1.0 - Math.floor((ev.clientY
                - canvas.offsetTop)
                )/canvasStyleHeight;
    guiData.drawRect.x = Math.floor((ev.clientX
                                       - canvas.offsetLeft)
                                    )/canvasStyleWidth;
    guiData.drawRect.y = 1.0 - Math.floor((ev.clientY 
                                           - canvas.offsetTop)
                                          )/canvasStyleHeight;
    mouseUse = true;
});
canvas.addEventListener("mousemove", ev => mousePos(ev, 'move'));