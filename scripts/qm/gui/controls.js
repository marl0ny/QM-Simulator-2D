let stats = null;
try {
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
} catch (e) {
    console.log(e);
}

let gui = new dat.GUI();


let guiControls = {
    instructions: null,
    source: null,
    iter: null,
    brightness: null,
    colourPhase: null,
    mouseMode: null,
    presetPotentialSelect: null,
    mouseControls: null,
    presetControlsFolder: null,
    moreControlsFolder: null,
    visualizationOptionsFolder: null,
    potColourController: null,
    showPotHeightMap: null,
    visualizationOptionsFolder: null,
    probColourController: null,
    showProbHeightMap: null,
    showFolder: null,
    boxW: null,
    boxH: null,
    changeDimensionsFolder: null,
    gridSelect: null,
    textEditPotential: null,
    useTex: null,
    textEditPotentialEntry: null,
    textEditSubFolder: null,
    textEditWavefunc: null,
    wavefuncUseTex: null,
    textEditWavefuncEntry: null,
    textEditWavefuncSubFolder: null,
    textEditNonlinear: null,
    textEditNonlinearEntry: null,
    textEditNonlinearSubFolder: null,
    boundariesFolder: null,
    boundariesSelect: null,
    imagePotentialFolder: null,
    uploadImageButton: null,
    displayBG: null,
    bgBrightness: null,
    recordVideoFolder: null,
    screenshotsFolder: null,
    numberOfFramesEntry: null,
    downloadScreenshotsButton: null,
    screenshotProgress: null,
    setStartSpeed: null,
    startSpeed: null,
    pauseOnFinish: null,
    intMethod: null,
    methodControl: null,
    iterations: null,
    assessConvergence: null,
    setTol: null,
    editUniformsFolder: null,
    dtSlider: null,
    laplaceSelect: null,
    uploadImage: null,
    imageNameWidget: null,
    invertImageControl: null
};

let palette0 = {color: '#1b191b'};
guiControls.instructions = gui.addColor(palette0, 'color').name(
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
guiControls.instructions.domElement.hidden = true;
let palette = {color: '#1b191b'};
guiControls.source = gui.addColor(palette, 'color').name(
    ' <a href="https://github.com/marl0ny/QM-Simulator-2D"'
    + 'style="color: #efefef; text-decoration: none; font-size: 1em;">'
    + 'Source</a>'
);
guiControls.source.domElement.hidden = true;
guiControls.brightness = gui.add(guiData , 'brightness', 
                                 0, guiData.maxBrightness).name('Brightness');
guiControls.iter = gui.add(guiData, 'speed', 0, 
                           guiData.maxSpeed).name('Speed');
guiControls.iter.step(1.0);
guiControls.colourPhase
     = gui.add(guiData, 'colourPhase').name('Colour Phase');

// How to do dropdowns in dat.gui:
// https://stackoverflow.com/questions/30372761/
// Question by Adi Shavit (https://stackoverflow.com/users/135862/adi-shavit)
// Answer (https://stackoverflow.com/a/31000465)
// by Djuro Mirkovic (https://stackoverflow.com/users/4972372/djuro-mirkovic)
guiControls.mouseMode = gui.add(guiData, 'mouseMode',
                        ['new ψ(x, y)', 
                         'sketch barrier',
                         'erase barrier',
                         'prob. in box']).name('Mouse Usage');
// gui.add(guiData, 'changeDimensions', ['400x400', '512x512',
//         '640x640', '800x800']).name('Grid Size');
guiControls.presetPotentialSelect = gui.add(guiData, 'presetPotential',
                                    ['ISW', 'SHO', 'Double Slit',
                                     'Single Slit', 'Step', 'Spike',
                                     'Triple Slit']).name('Preset Potential');
guiControls.mouseControls = gui.addFolder('Mouse Usage Controls');
guiControls.mouseControls.widgets = [];


guiControls.presetControlsFolder
     = gui.addFolder('Preset Potential Controls');
guiControls.presetControlsFolder.controls = [];
gui.add(guiData, 'measurePosition').name('Measure Position');
guiControls.moreControlsFolder = gui.addFolder('More Controls');
guiControls.visualizationOptionsFolder = 
        guiControls.moreControlsFolder.addFolder(
            'More Visualization Options');
guiControls.visualizationOptionsFolder.add(guiData, 'brightness2', 
        0.0, guiData.maxBrightness2).name('Pot. brightness');
guiControls.potColourController
    = guiControls.visualizationOptionsFolder.addColor(
        {colour: [255.0, 255.0, 255.0]}, 'colour').name('Pot. Colour');
guiControls.showPotHeightMap
    = guiControls.visualizationOptionsFolder.add(
        guiData, 'showPotHeightMap', false).name('Pot. Height Map');
guiControls.potColourController.onChange(e => {
    guiData.potColour[0] = e[0]/255.0;
    guiData.potColour[1] = e[1]/255.0;
    guiData.potColour[2] = e[2]/255.0;
    guiData.showPotHeightMap = false;
    guiControls.showPotHeightMap.updateDisplay(); 
});
guiControls.visualizationOptionsFolder.add(guiData, 'viewProbCurrent', 
                                           false).name('Prob. Current');
guiControls.probColourController
     = guiControls.visualizationOptionsFolder.addColor(
         {colour: [255.0, 255.0, 255.0]}, 'colour').name('Prob. Colour');
guiControls.probColourController.onChange(e => {
    guiData.probColour[0] = e[0]/255.0;
    guiData.probColour[1] = e[1]/255.0;
    guiData.probColour[2] = e[2]/255.0;
    guiData.colourPhase = false;
    guiControls.colourPhase.updateDisplay();
    guiData.showProbHeightMap = false;
    guiControls.showProbHeightMap.updateDisplay();
});
guiControls.showProbHeightMap
        = guiControls.visualizationOptionsFolder.add(
            guiData, 'showProbHeightMap', false).name('Prob. Height Map');
guiControls.showProbHeightMap.onChange(e => {
    guiData.colourPhase = false;
    guiControls.colourPhase.updateDisplay();
});

guiControls.showFolder
    = guiControls.moreControlsFolder.addFolder('Show Dimensions');
guiControls.boxW = guiControls.showFolder.add(guiData.showValues, 
                                              'w', `${width}`
                                              ).name('Box Width');
guiControls.boxH = guiControls.showFolder.add(guiData.showValues, 
                                              'h', `${height}`
                                             ).name('Box Height');
guiControls.changeDimensionsFolder
     = guiControls.moreControlsFolder.addFolder('Change Grid Size');
let screenFitW = parseInt(3.0*window.innerWidth*windowScale/5.0);
let screenFitH = parseInt(3.0*window.innerHeight*windowScale/5.0);
let screenFitWLarge = parseInt(window.innerWidth*windowScale);
let screenFitHLarge = parseInt(window.innerHeight*windowScale);
let aspectRatiosWidths = {'1:1': [256, 400, 512, 640, 800, 1024, 2048],
                          '16:9': [683, 1024, 1280, 1366, 1920]};
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
guiControls.gridSelect
    = guiControls.changeDimensionsFolder.add(guiData, 'changeDimensions',
                                             gridSizes
                                             ).name('Grid Size');
guiControls.textEditPotential
    = guiControls.moreControlsFolder.addFolder('Text Edit Potential');
guiControls.useTex = guiControls.textEditPotential.add(guiData,
                                   'useTextureCoordinates'
                                  ).name('Use Tex Coordinates');
guiControls.textEditPotentialEntry = guiControls.textEditPotential.add(guiData,
    'enterPotential').name('Enter Potential V(x, y)');
guiControls.textEditSubFolder
    = guiControls.textEditPotential.addFolder('Edit variables');
guiControls.textEditSubFolder.controls = [];

/* guiControls.textEditWavefunc
    = guiControls.moreControlsFolder.addFolder('Text Edit Wavefunction');
// textEditWavefunc.hide();
guiControls.wavefuncUseTex = guiControls.textEditWavefunc.add(guiData,
                                          'useTextureCoordinates'
                                         ).name('Use Tex Coordinates');
guiControls.textEditWavefuncEntry = guiControls.textEditWavefunc.add(guiData,
    'enterWavefunc').name('Enter ψ(x, y)');
guiControls.textEditWavefuncSubFolder
    = guiControls.textEditWavefunc.addFolder('Edit variables');
guiControls.textEditWavefuncSubFolder.controls = [];*/

guiControls.boundariesFolder
        = guiControls.moreControlsFolder.addFolder('Edit Boundary Type');
guiControls.boundariesSelect 
    = guiControls.boundariesFolder.add(guiData, 'boundaryType', 
                                            ['Dirichlet', 'Neumann', 
                                             'Periodic']
                                            ).name('Type');
guiControls.imagePotentialFolder
    = guiControls.moreControlsFolder.addFolder('Upload Image');
guiControls.uploadImageButton
    = guiControls.imagePotentialFolder.add({'uploadImage': () => {}}, 
                         'uploadImage', true).name(
                             `<div>
                             <input id="uploadImage" type="file" 
                              style="color: #efefef; 
                              text-decoration: none; font-size: 1em;">
                             </div>`
                         );
guiControls.uploadImageButton.domElement.hidden = true;
guiControls.uploadImage = document.getElementById("uploadImage");
guiControls.imageNameWidget = guiControls.imagePotentialFolder.add(guiData, 
                                              'imageName'
                                              ).name('File: ');

guiControls.invertImageControl
    = guiControls.imagePotentialFolder.add(guiData, 
        'invertImage', false).name('invert');
guiControls.imagePotentialFolder.add({'useImageDimensions': 
                          () => guiData.setToImageDimensions()}, 
                          'useImageDimensions').name('Use Dim.');
guiControls.imagePotentialFolder.add({'submit': () => guiData.imageFunc()},
                         'submit').name('Use for Pot.');
// guiControls.imagePotentialFolder.add({submit2: () =>
//                                       guiData.imageBackgroundFunc()}, 
//                                       'submit2'
//                                      ).name('Use for bg.');
guiControls.displayBG = guiControls.imagePotentialFolder.add(
                                    guiData, 'displayBGImage'
                                    ).name('Display as B.G.');
guiControls.displayBG.onChange(e => {
    if (e === true) guiData.imageBackgroundFunc();
});
guiControls.bgBrightness = guiControls.imagePotentialFolder.add(
    guiData, 'bgBrightness', 0.0, 1.0
).name('B.G. Scale');
guiControls.recordVideoFolder
     = guiControls.moreControlsFolder.addFolder('Record Video');
guiControls.screenshotsFolder
    = guiControls.moreControlsFolder.addFolder('Take Screenshots');


guiControls.numberOfFramesEntry 
    = guiControls.screenshotsFolder.add(guiData,
                                        'nScreenshots'
                                        ).name('Number of frames');
guiControls.downloadScreenshotsButton = 
    guiControls.screenshotsFolder.add(
        {download: () => {
            guiData.takeScreenshot = true;
            if (guiData.setStartSpeed) {
                guiData.speed = guiData.startSpeed;
                guiControls.iter.updateDisplay();
            }
        }},
            'download').name('Start');
guiControls.screenshotProgress
    = guiControls.screenshotsFolder.add(guiData, 
                                        'screenshotProgress'
                                        ).name('Progress');
guiControls.setStartSpeed = guiControls.screenshotsFolder.add(
    guiData, 'setStartSpeed', false
).name('Set Start Speed');
guiControls.startSpeed = guiControls.screenshotsFolder.add(
    guiData, 'startSpeed', 0, guiData.maxSpeed, 1
).name('Start Speed');
guiControls.pauseOnFinish = guiControls.screenshotsFolder.add(
    guiData, 'pauseOnFinish', false
).name('Pause On Finish');
guiControls.recordVideoFolder.add({'func': () => {
    guiData.recordVideo = true;
}}, 'func').name('Start');

guiControls.intMethod
     = guiControls.moreControlsFolder.addFolder('Integration Method');
guiControls.methodControl = guiControls.intMethod.add(guiData, 'method', 
                                  ['Leapfrog', 'Leapfrog 2',
                                   'CN w/ Jacobi', 
                                   // 'CNJ w/ B-Field',
                                   // 'Split-Op. (CPU FFT)', 
                                   'Split-Op. (GPU FFT)',
                                   'Split-Op. Nonlinear',
                                   'Leapfrog Nonlinear'
                                  ]
                                 ).name('Methods');

guiControls.editUniformsFolder = 
    guiControls.moreControlsFolder.addFolder('Edit Other Values');
guiControls.editUniformsFolder.add(guiData, 'm', 0.75, 10.0);
guiControls.dtSlider
    = guiControls.editUniformsFolder.add(guiData, 'dt', -0.01, 0.013);
guiControls.laplaceSelect
     = guiControls.editUniformsFolder.add(guiData, 'laplace',
                                          ['5 point', '9 point'],
                                          10).name('Laplacian');
guiControls.laplaceSelect.onChange(e => {
    guiData.laplaceVal = parseInt(e.split(' ')[0]);
});
