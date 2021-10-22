let gui = new dat.GUI();


let stats = null;
try {
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
} catch (e) {
    console.log(e);
}

console.log(pixelWidth, pixelHeight);
let guiData = {
    brightness: 4, // brightness for wavefunction
    brightness2: 1.0, // brightness for potential
    speed: 6, // number of steps per frame
    bx: 0.0,
    by: 0.0,
    px: 0.0,
    py: 0.0,
    colourPhase: true,
    viewProbCurrent: false,
    displayOutline: false,
    mouseMode: 'new ψ(x, y)',
    mouseData: {name: () => {},
                stencilTypes: 'square',
                erase: false,
                stencilType: 0,
                width: 0.01, v2: 10.0,
                fixInitialP: false,
                sigma: 0.05859375,
                px0: 0.0, py0: 20.0,
                probabilityInBox: '0.0',
                mouseUse: false,
                mouseAction: false,
                mouseCount: 0},
    drawRect: {x: 0.0, y: 0.0, w: 0.0, h: 0.0},
    presetPotential: 'SHO',
    useTextureCoordinates: true,
    enterPotential: 'V(x, y)',
    enterPotentialExpr: '',
    measure: false,
    dt: 0.01,
    m: 1.0,
    laplace: '5 point',
    laplaceVal: 5,
    scaleP: 1.0,
    rScaleV: 0.0,
    object: "string",
    changeDimensions: `${pixelWidth}x${pixelHeight}`,
    boundaries: 'default',
    borderAlpha: 0.0,
    boundaryType: "Dirichlet",
    probColour: [1.0, 1.0, 1.0],
    potColour: [1.0, 1.0, 1.0],
    imageName: '',
    imageFunc: () => {},
    invertImage: false,
    takeScreenshot: false,
    recordVideo: false,
    mediaRecorder: null,
    nVideoFrames: 0,
    videoData: [],
    nScreenshots: 1,
    screenshotCount: 0,
    screenshotDownloadCount: 0,
    screenshots: [],
    screenshotProgress: '',
    streams: []
};
let measurePosition = () => guiData.measure = true;
guiData.measurePosition = measurePosition;


let palette0 = {color: '#1b191b'};
let instructions = gui.addColor(palette0, 'color').name(
    '<a href='
    + '"https://github.com/marl0ny/QM-Simulator-2D/blob/main/INSTRUCTIONS.md"'
    + 'style="color: #efefef; text-decoration: none; font-size: 1em;">'
    + 'Instructions</a>'
);
// How to display only text:
// https://stackoverflow.com/q/30834678
// Question by Oggy (https://stackoverflow.com/users/2562154)
// Answer (https://stackoverflow.com/a/31001163)
// by Djuro Mirkovic (https://stackoverflow.com/users/4972372)
instructions.domElement.hidden = true;
let palette = {color: '#1b191b'};
source = gui.addColor(palette, 'color').name(
    ' <a href="https://github.com/marl0ny/QM-Simulator-2D"'
    + 'style="color: #efefef; text-decoration: none; font-size: 1em;">'
    + 'Source</a>'
);
source.domElement.hidden = true;

gui.add(guiData , 'brightness', 0, 10).name('Brightness');
let iter = gui.add(guiData, 'speed', 0, 20).name('Speed');
iter.step(1.0);
gui.add(guiData, 'colourPhase').name('Colour Phase');

// How to do dropdowns in dat.gui:
// https://stackoverflow.com/questions/30372761/
// Question by Adi Shavit (https://stackoverflow.com/users/135862/adi-shavit)
// Answer (https://stackoverflow.com/a/31000465)
// by Djuro Mirkovic (https://stackoverflow.com/users/4972372/djuro-mirkovic)
let mouseMode = gui.add(guiData, 'mouseMode',
                        ['new ψ(x, y)', 
                         'sketch barrier',
                         'erase barrier',
                         'prob. in box']).name('Mouse Usage');
// gui.add(guiData, 'changeDimensions', ['400x400', '512x512',
//         '640x640', '800x800']).name('Grid Size');
let presetPotentialSelect = gui.add(guiData, 'presetPotential',
                                    ['ISW', 'SHO', 'Double Slit',
                                     'Single Slit', 'Step', 'Spike',
                                     'Triple Slit']).name('Preset Potential');
let mouseControls = gui.addFolder('Mouse Usage Controls');
mouseControls.widgets = [];


const NEW_PSI = 'n'; 
const SKETCH_BARRIER = 's';
const ERASE_BARRIER = 'e'; 
const PROB_IN_BOX = 'p';
function mouseControlsCallback(e) {
    if (e[0] === NEW_PSI) {
        for (let w of mouseControls.widgets) {
            w.remove();
        }
        mouseControls.widgets = [];
        let items = guiData.mouseData;
        let name = mouseControls.add(items, 'name').name(`${e} guiData`);
        let fixInitialP = mouseControls.add(items,
                                            'fixInitialP'
                                           ).name('Fix Init. Mom.');
        
        let sigma = mouseControls.add(items, 'sigma', 
                                      10.0/512.0, 40.0/512.0).name('sigma');
        // let pVal = parseInt(80.0*pixelWidth/512.0);
        let pxVal = parseInt(40.0*pixelWidth/512.0);
        let pyVal = parseInt(40.0*pixelHeight/512.0);
        let px0 = mouseControls.add(items, 'px0', -pxVal, pxVal).name('kx');
        let py0 = mouseControls.add(items, 'py0', -pyVal, pyVal).name('ky');
        mouseControls.widgets.push(name);
        mouseControls.widgets.push(fixInitialP);
        mouseControls.widgets.push(sigma);
        mouseControls.widgets.push(px0);
        mouseControls.widgets.push(py0);

    } else if (e[0] === SKETCH_BARRIER || e[0] === ERASE_BARRIER) {
        for (let w of mouseControls.widgets) {
            w.remove();
        }
        mouseControls.widgets = [];
        let items = guiData.mouseData;
        let name = mouseControls.add(items, 'name').name(`${e} Controls`);
        let stencilTypesList = ['square', 'circle'];
        // if (e[0] === SKETCH_BARRIER) {
            stencilTypesList.push('gaussian');
        // }
        let stencilTypes = mouseControls.add(items, 'stencilTypes',
                                             stencilTypesList
                                            ).name('Draw Type');
        let widthControl = mouseControls.add(items, 'width',
                                             0.0, 0.03).name('Draw Width');
        let vControl;
        if (e[0] === SKETCH_BARRIER) {
            guiData.mouseData.erase = false;
            guiData.mouseData.v2 = 10.0;
            vControl = mouseControls.add(items, 'v2', 
                                         0.0, 10.0).name('E');
        } else {
            guiData.mouseData.v2 = 0.0;
            guiData.mouseData.erase = true;
        }
        stencilTypes.onChange(
            e => {
                let DRAW_SQUARE = 0;
                let DRAW_CIRCLE = 1;
                let DRAW_GAUSS = 2;
                if (e === 'square') {
                    guiData.mouseData.stencilType = DRAW_SQUARE;
                } else if (e === 'circle') {
                    guiData.mouseData.stencilType = DRAW_CIRCLE;
                } else if (e === 'gaussian') {
                    guiData.mouseData.stencilType = DRAW_GAUSS;
                }
            }
        );
        mouseControls.widgets.push(name);
        mouseControls.widgets.push(stencilTypes);
        mouseControls.widgets.push(widthControl);
        if (e[0] === SKETCH_BARRIER) mouseControls.widgets.push(vControl);
    } else if (e[0] === PROB_IN_BOX) {
        let items = guiData.mouseData;
        let name = mouseControls.add(items, 'name').name(`${e} Controls`);
        for (let w of mouseControls.widgets) {
            w.remove();
        }
        mouseControls.widgets = [];
        let w = mouseControls.add(items, 'probabilityInBox', 
                                  '0.0').name('Probability in box');
        mouseControls.widgets.push(name);
        mouseControls.widgets.push(w);
        mouseControls.open();
    }
}

mouseMode.onChange(mouseControlsCallback);
let presetControlsFolder = gui.addFolder('Preset Potential Controls');
presetControlsFolder.controls = [];
gui.add(guiData, 'measurePosition').name('Measure Position');
let moreControlsFolder = gui.addFolder('More Controls');
let visualizationOptionsFolder = 
        moreControlsFolder.addFolder('More Visualization Options');
visualizationOptionsFolder.add(guiData, 'brightness2', 
        0.0, 10.0).name('Pot. brightness');
let potColourController
    = visualizationOptionsFolder.addColor({colour: [255.0, 255.0, 255.0]},
                                          'colour').name('Pot. Colour');
potColourController.onChange(e => {
    guiData.potColour[0] = e[0]/255.0;
    guiData.potColour[1] = e[1]/255.0;
    guiData.potColour[2] = e[2]/255.0;
});
visualizationOptionsFolder.add(guiData, 'viewProbCurrent', 
                               false).name('Prob. Current');
let probColourController
     = visualizationOptionsFolder.addColor({colour: [255.0, 255.0, 255.0]},
                                            'colour').name('Prob. Colour');
probColourController.onChange(e => {
    guiData.probColour[0] = e[0]/255.0;
    guiData.probColour[1] = e[1]/255.0;
    guiData.probColour[2] = e[2]/255.0;
});
let showFolder = moreControlsFolder.addFolder('Show Dimensions');
let showValues = {w: width, h: height};
let boxW = showFolder.add(showValues, 'w', `${width}`).name('Box Width');
let boxH = showFolder.add(showValues, 'h', `${height}`).name('Box Height');
let changeDimensionsFolder = moreControlsFolder.addFolder('Change Grid Size');
let screenFitW = parseInt(3.0*window.innerWidth*windowScale/5.0);
let screenFitH = parseInt(3.0*window.innerHeight*windowScale/5.0);
let screenFitWLarge = parseInt(window.innerWidth*windowScale);
let screenFitHLarge = parseInt(window.innerHeight*windowScale);
let aspectRatiosWidths = {'1:1': [400, 512, 640, 800, 1024, 2048],
                          '16:9': [683, 1024, 1280, 1366]};
let gridSizes = [`${screenFitW}x${screenFitH}`,
                 `${screenFitWLarge}x${screenFitHLarge}`];
for (let k of Object.keys(aspectRatiosWidths)) {
    for (let length of aspectRatiosWidths[k]) {
        let numDen = k.split(':');
        let length2 = parseInt(length*numDen[1]/numDen[0]);
        if (window.innerHeight < window.innerWidth) {
            gridSizes.push(`${length}x${length2}`);
        } else {
            gridSizes.push(`${length2}x${length}`);
        }
    }
}
let gridSelect = changeDimensionsFolder.add(guiData, 'changeDimensions',
                                            gridSizes
                                           ).name('Grid Size');
let textEditPotential = moreControlsFolder.addFolder('Text Edit Potential');
let useTex = textEditPotential.add(guiData,
                                   'useTextureCoordinates'
                                  ).name('Use Tex Coordinates');
let textEditPotentialEntry = textEditPotential.add(guiData,
    'enterPotential').name('Enter Potential V(x, y)');
let textEditSubFolder = textEditPotential.addFolder('Edit variables');
textEditSubFolder.controls = [];
let boundariesFolder = moreControlsFolder.addFolder('Edit Boundary Type');
let boundariesSelect = boundariesFolder.add(guiData, 'boundaryType', 
                                            ['Dirichlet', 'Neumann', 
                                             'Periodic']
                                            ).name('Type');
let imagePotentialFolder = moreControlsFolder.addFolder('Upload Image');
let uploadImageButton = imagePotentialFolder.add({'uploadImage': () => {}}, 
                         'uploadImage', true).name(
                             `<div>
                             <input id="uploadImage" type="file" 
                              style="color: #efefef; 
                              text-decoration: none; font-size: 1em;">
                             </div>`
                         );
uploadImageButton.domElement.hidden = true;
let uploadImage = document.getElementById("uploadImage");
let imageNameWidget = imagePotentialFolder.add(guiData, 
                                              'imageName'
                                              ).name('File: ');
function onUploadImage() {
    let im = document.getElementById("image");
    im.file = this.files[0];
    guiData.imageName = im.file.name;
    imageNameWidget.updateDisplay();
    const reader = new FileReader();
    reader.onload = e => im.src = e.target.result;
    reader.readAsDataURL(this.files[0]);
}
uploadImage.addEventListener("change", onUploadImage, false);
let invertImageControl = imagePotentialFolder.add(guiData, 
    'invertImage', false).name('invert');
imagePotentialFolder.add({'submit': () => guiData.imageFunc()}, 
                         'submit').name('Use for Pot.');
let recordVideoFolder = moreControlsFolder.addFolder('Record Video');
let screenshotsFolder = moreControlsFolder.addFolder('Take Screenshots');


function createDownloadTag(dataURL, num, total) {
    let time = Date.now();
    let numStr = `${num + 1}`, totalStr = `${total}`;
    let numZeros = totalStr.length - numStr.length;
    for (let i = 0; i < numZeros; i++) {
        numStr = '0' + numStr;
    }
    let name = `image_${numStr}_${time}.png`;
    let div = document.getElementById('image-download');
    // Download with javascript: https://stackoverflow.com/a/16302092
    // Origianl question: https://stackoverflow.com/questions/2408146
    // Question by Pierre (https://stackoverflow.com/users/206808)
    // Answer by Francisco Costa (https://stackoverflow.com/users/621727)
    div.innerHTML += `<a href="${dataURL}" hidden="true" 
                        id="a-download-${num}" download="${name}"></a>`;
    // let aDownload = document.getElementById(`a-download-${num}`);
    // aDownload.click();
}


let numberOfFramesEntry = screenshotsFolder.add(guiData,
                                                'nScreenshots'
                                               ).name('Number of frames');
let downloadScreenshotsButton = 
    screenshotsFolder.add({download: () => guiData.takeScreenshot = true},
                          'download').name('Start');
let screenshotProgress = screenshotsFolder.add(guiData, 
                                          'screenshotProgress'
                                         ).name('Progress');


recordVideoFolder.add({'func': () => {
    guiData.recordVideo = true;
}}, 'func').name('Start');
let finishRecordingVideo = () => {
    guiData.recordVideo = false;
    let div = document.getElementById('video-download');
    guiData.mediaRecorder.stop();
    // To use the MediaRecorder to record video, the example
    // provided here from the Mozilla Web documentation
    // was particularly helpful
    // https://developer.mozilla.org/en-US/
    // docs/Web/API/MediaStream_Recording_API
    let f = () => {
        let a = document.createElement('a');
        div.appendChild(a);
        let blob = new Blob(guiData.videoData, {type: "video/webm"});
        let url = URL.createObjectURL(blob);
        a.href = url;
        let time = Date.now();
        a.download = `${time}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
    setTimeout(f, 1000);
    guiData.videoData = [];
};
recordVideoFolder.add({'func': finishRecordingVideo}, 'func').name('Finish');


function downloadScreenshot() {
    if (guiData.screenshots.length === 30 || 
        guiData.screenshotCount === guiData.nScreenshots) {
        guiData.screenshots.reverse();
        while (guiData.screenshots.length > 0) {
            let dataURL = guiData.screenshots.pop();
            let downloadCount = guiData.screenshotDownloadCount;
            createDownloadTag(dataURL, downloadCount,
                               guiData.nScreenshots);
            document.getElementById(`a-download-${downloadCount}`).click();
            let div = document.getElementById('image-download');
            div.innerHTML = '';
            guiData.screenshotDownloadCount++;
        }
    }
    screenshotProgress.setValue(
        `${guiData.screenshotDownloadCount}/${guiData.nScreenshots}`);
}

function handleRecording(canvas) {
    if (guiData.takeScreenshot) {
        guiData.screenshots.push(canvas.toDataURL('image/png', 1));
        guiData.screenshotCount++;
        downloadScreenshot();
        if (guiData.screenshotCount === guiData.nScreenshots) {
            guiData.screenshotCount = 0;
            guiData.screenshotDownloadCount = 0;
            guiData.takeScreenshot = false;
            screenshotProgress.setValue('');
        }
    }
    if (guiData.recordVideo) {
        if (guiData.mediaRecorder === null || 
            guiData.mediaRecorder.state === 'inactive') {
            let stream = canvas.captureStream();
            let dimensions = guiData.changeDimensions.split('x');
            let width = parseInt(dimensions[0]);
            let height = parseInt(dimensions[1]);
            let options = {bitsPerSecond: parseInt(width*height*8*15/4.0)};
            guiData.mediaRecorder = new MediaRecorder(stream, options);
            guiData.mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) guiData.videoData.push(e.data);
            }
            guiData.mediaRecorder.onerror = e => {
                console.log(e);
            }
            guiData.mediaRecorder.start();
        }
    }
}

let mousePos = function(ev, mode) {
    if (mode == 'move') {
        guiData.mouseData.mouseCount++;
        let prevBx = guiData.bx;
        let prevBy = guiData.by;
        guiData.bx = Math.floor((ev.clientX 
                                  - canvas.offsetLeft))/scale.w;
        guiData.by = Math.floor((ev.clientY - canvas.offsetTop))/scale.h;
        guiData.px = parseInt(guiData.bx - prevBx);
        if (Math.abs(guiData.px) > 50.0/guiData.scaleP) {
            guiData.px = Math.sign(guiData.px)*
                         50.0*(pixelWidth/512.0)/guiData.scaleP;
        }
        guiData.py = -parseInt(guiData.by - prevBy);
        if (Math.abs(guiData.py) > 50.0/guiData.scaleP) {
            guiData.py = Math.sign(guiData.py)*
                         50.0*(pixelHeight/512.0)/guiData.scaleP;
        }
    }
    if (guiData.mouseData.mouseUse) {
        if (guiData.bx < canvas.width && guiData.by < canvas.height &&
            guiData.bx >= 0 && 
            guiData.by >= 0) guiData.mouseData.mouseAction = true;
    }
};

function setMouseInput() {
    canvas.addEventListener("touchstart", ev => {
        guiData.mouseData.mouseUse = true;
        let touches = ev.changedTouches;
        let mouseEv = {clientX: touches[0].pageX, clientY: touches[0].pageY};
        guiData.drawRect.w = 0;
        guiData.drawRect.h = 0;
        guiData.drawRect.x = Math.floor((mouseEv.clientX
                                          - canvas.offsetLeft))/scale.w;
        guiData.drawRect.y = Math.floor((mouseEv.clientY
                                          - canvas.offsetTop))/scale.h;
        // mousePos(mouseEv, 'move');
    });
    canvas.addEventListener("touchmove", ev => {
        let touches = ev.changedTouches;
        let mouseEv = {clientX: touches[0].pageX, clientY: touches[0].pageY};
        mousePos(mouseEv, 'move');
    });
    canvas.addEventListener("touchend", ev => {
        let touches = ev.changedTouches;
        let mouseEv = {clientX: touches[0].pageX, clientY: touches[0].pageY};
        mousePos(mouseEv, 'up');
        guiData.mouseData.mouseCount = 0;
        guiData.mouseData.mouseUse = false;
    });
    canvas.addEventListener("mouseup", ev => {
        mousePos(ev, 'up');
        guiData.mouseData.mouseCount = 0;
        guiData.mouseData.mouseUse = false;
    });
    canvas.addEventListener("mousedown", ev => {
        guiData.mouseData.mouseUse = true;
        guiData.drawRect.w = 0;
        guiData.drawRect.h = 0;
        guiData.drawRect.x = Math.floor((ev.clientX
                                           - canvas.offsetLeft))/scale.w;
        guiData.drawRect.y = Math.floor((ev.clientY
                                           - canvas.offsetTop))/scale.h;
    });
    canvas.addEventListener("mousemove", ev => mousePos(ev, 'move'));
}

let editUniformsFolder = moreControlsFolder.addFolder('Edit Other Values');
editUniformsFolder.add(guiData, 'm', 0.75, 10.0);
editUniformsFolder.add(guiData, 'dt', -0.01, 0.013);
let laplaceSelect = editUniformsFolder.add(guiData, 'laplace',
                                           ['5 point', '9 point'],
                                           10).name('Laplacian');
laplaceSelect.onChange(e => {
    guiData.laplaceVal = parseInt(e.split(' ')[0]);
});

