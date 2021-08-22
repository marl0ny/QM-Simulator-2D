let gui = new dat.GUI();
let stats = null;
try {
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
} catch (e) {
    console.log(e);
}

let drawRect = {x: 0.0, y: 0.0, w: 0.0, h: 0.0};
let controls = {
    brightness: 4,
    brightness2: 1.0,
    speed: 6,
    bx: 0.0,
    by: 0.0,
    px: 0.0,
    py: 0.0,
    colourPhase: true,
    viewProbCurrent: false,
    displayOutline: false,
    mouseMode: 'new ψ(x, y)',
    presetPotentials: 'SHO',
    useTextureCoordinates: true,
    enterPotential: 'V(x, y)',
    measure: false,
    dt: 0.01,
    m: 1.0,
    laplace: '5 point',
    laplaceVal: 5,
    scaleP: 1.0,
    object: "string",
    changeDimensions: '512x512',
    boundaries: 'default',
    borderAlpha: 0.0,
    boundaryType: "Dirichlet",
    probColour: [1.0, 1.0, 1.0],
    potColour: [1.0, 1.0, 1.0],
    imageName: '',
    imageFunc: () => {},
    };
let measurePosition = () => controls.measure = true;
controls.measurePosition = measurePosition;


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

gui.add(controls , 'brightness', 0, 10).name('Brightness');
let iter = gui.add(controls, 'speed', 0, 20).name('Speed');
iter.step(1.0);
gui.add(controls, 'colourPhase').name('Colour Phase');

// How to do dropdowns in dat.gui:
// https://stackoverflow.com/questions/30372761/
// Question by Adi Shavit (https://stackoverflow.com/users/135862/adi-shavit)
// Answer (https://stackoverflow.com/a/31000465)
// by Djuro Mirkovic (https://stackoverflow.com/users/4972372/djuro-mirkovic)
let mouseMode = gui.add(controls, 'mouseMode',
                        ['new ψ(x, y)', 
                         'sketch barrier',
                         'erase barrier',
                         'prob. in box']).name('Mouse Usage');
// gui.add(controls, 'changeDimensions', ['400x400', '512x512',
//         '640x640', '800x800']).name('Grid Size');
gui.add(controls, 'presetPotentials', ['ISW', 'SHO', 'Double Slit',
                                       'Single Slit', 'Step', 'Spike',
                                       'Triple Slit']
                                       ).name('Preset Potential');
let mouseControls = gui.addFolder('Mouse Usage Controls');
mouseControls.widgets = [];
mouseControls.values = {name: () => {},
                        stencilTypes: 'square',
                        erase: false,
                        stencilType: 0,
                        width: 0.01, v2: 10.0,
                        fixInitialP: false,
                        sigma: 0.05859375,
                        px0: 0.0, py0: 20.0,
                        probabilityInBox: '0.0'};


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
        let items = mouseControls.values;
        let name = mouseControls.add(items, 'name').name(`${e} controls`);
        let fixInitialP = mouseControls.add(items,
                                            'fixInitialP'
                                           ).name('Fix Init. Mom.');
        
        let sigma = mouseControls.add(items, 'sigma', 
                                      10.0/512.0, 40.0/512.0).name('sigma');
        let pVal = parseInt(40.0*pixelWidth/512.0);
        let px0 = mouseControls.add(items, 'px0', -pVal, pVal).name('kx');
        let py0 = mouseControls.add(items, 'py0', -pVal, pVal).name('ky');
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
        let items = mouseControls.values;
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
            mouseControls.values.erase = false;
            mouseControls.values.v2 = 10.0;
            vControl = mouseControls.add(items, 'v2', 
                                         0.0, 10.0).name('E');
        } else {
            mouseControls.values.v2 = 0.0;
            mouseControls.values.erase = true;
        }
        stencilTypes.onChange(
            e => {
                let DRAW_SQUARE = 0;
                let DRAW_CIRCLE = 1;
                let DRAW_GAUSS = 2;
                if (e === 'square') {
                    mouseControls.values.stencilType = DRAW_SQUARE;
                } else if (e === 'circle') {
                    mouseControls.values.stencilType = DRAW_CIRCLE;
                } else if (e === 'gaussian') {
                    mouseControls.values.stencilType = DRAW_GAUSS;
                }
            }
        );
        mouseControls.widgets.push(name);
        mouseControls.widgets.push(stencilTypes);
        mouseControls.widgets.push(widthControl);
        if (e[0] === SKETCH_BARRIER) mouseControls.widgets.push(vControl);
    } else if (e[0] === PROB_IN_BOX) {
        let items = mouseControls.values;
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
gui.add(controls, 'measurePosition').name('Measure Position');
let moreControlsFolder = gui.addFolder('More Controls');
let visualizationOptionsFolder = 
        moreControlsFolder.addFolder('More Visualization Options');
visualizationOptionsFolder.add(controls, 'brightness2', 
        1.0, 10.0).name('Pot. brightness');
let potColourController
    = visualizationOptionsFolder.addColor({colour: [255.0, 255.0, 255.0]},
                                          'colour').name('Pot. Colour');
potColourController.onChange(e => {
    controls.potColour[0] = e[0]/255.0;
    controls.potColour[1] = e[1]/255.0;
    controls.potColour[2] = e[2]/255.0;
});
visualizationOptionsFolder.add(controls, 'viewProbCurrent', 
                               false).name('Prob. Current');
let probColourController
     = visualizationOptionsFolder.addColor({colour: [255.0, 255.0, 255.0]},
                                            'colour').name('Prob. Colour');
probColourController.onChange(e => {
    controls.probColour[0] = e[0]/255.0;
    controls.probColour[1] = e[1]/255.0;
    controls.probColour[2] = e[2]/255.0;
});
let showFolder = moreControlsFolder.addFolder('Show Dimensions');
let showValues = {w: width, h: height};
let boxW = showFolder.add(showValues, 'w', `${width}`).name('Box Width');
let boxH = showFolder.add(showValues, 'h', `${height}`).name('Box Height');
let changeDimensionsFolder = moreControlsFolder.addFolder('Change Grid Size');
let gridSelect = changeDimensionsFolder.add(controls, 'changeDimensions',
                                            [
                                             '256x256', 
                                             '400x400', '512x512',
                                             '640x640', '800x800',
                                             '1024x1024', '2048x2048'
                                             // '4096x4096'
                                            ]
                                           ).name('Grid Size');
let textEditPotential = moreControlsFolder.addFolder('Text Edit Potential');
textEditPotential.add(controls,
                      'useTextureCoordinates').name('Use Tex Coordinates');
textEditPotential.add(controls,
                      'enterPotential').name('Enter Potential V(x, y)');
let textEditSubFolder = textEditPotential.addFolder('Edit variables');
textEditSubFolder.controls = [];
let boundariesFolder = moreControlsFolder.addFolder('Edit Boundary Type');
let boundariesSelect = boundariesFolder.add(controls, 'boundaryType', 
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
let imageNameWidget = imagePotentialFolder.add(controls, 
                                              'imageName'
                                              ).name('File: ');
function onUploadImage() {
    let im = document.getElementById("image");
    im.file = this.files[0];
    controls.imageName = im.file.name;
    imageNameWidget.updateDisplay();
    const reader = new FileReader();
    reader.onload = e => im.src = e.target.result;
    reader.readAsDataURL(this.files[0]);
}
uploadImage.addEventListener("change", onUploadImage, false);
imagePotentialFolder.add({'submit': () => controls.imageFunc()}, 
                         'submit').name('Use for Pot.');
// tmp.domElement.outerHTML = "<div class=\"c\"><div class=\"submit\"></div></div>";
// tmp.domElement.innerHTML = "";
let editUniformsFolder = moreControlsFolder.addFolder('Edit Other Values');
editUniformsFolder.add(controls, 'm', 0.75, 10.0);
editUniformsFolder.add(controls, 'dt', -0.01, 0.01);
let laplaceSelect = editUniformsFolder.add(controls, 'laplace',
                                           ['5 point', '9 point'],
                                           10).name('Laplacian');
laplaceSelect.onChange(e => {
    controls.laplaceVal = parseInt(e.split(' ')[0]);
});

let rScaleV = 0.0;
let timeMilliseconds = 0;
