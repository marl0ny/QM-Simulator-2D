
main();


function main() {

    let framesManager = new FramesManager();
    let defaultNumberOfFrames = 8;
    let numberOfFrames = defaultNumberOfFrames;
    framesManager.addFrames(canvas.width, canvas.height, numberOfFrames);
    framesManager.addVectorFieldFrame(canvas.width, canvas.height);
    let SimManager = LeapfrogSimulationManager;
    let sim = new SimManager(framesManager);
    let disableNonPowerTwo = false;

    initializePotential('SHO');

    addLaplacianControls(['5 pt. 2nd or.', '9 pt. 2nd or.']);

    let methodGridSizes;
    let boundaryTypes = [];
    guiControls.methodControl.onChange(e => {
        removeLaplacianControls();
        removeNonlinearControls();
        removeIterationControls();
        removeNonlinearNonlocalControls();
        let addNonlocalControls = false;
        if (e === 'Leapfrog') {
            SimManager = LeapfrogSimulationManager;
            guiData.dtMax = 0.01;
            guiControls.dtSlider.max(guiData.dtMax);
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            boundaryTypes = ['Dirichlet', 'Neumann', 'Periodic'];
            methodGridSizes = gridSizes;
            numberOfFrames = defaultNumberOfFrames;
            disableNonPowerTwo = false;
            addLaplacianControls(['5 pt. 2nd or.', '9 pt. 2nd or.']);
        } if (e ==='Centred 2nd Or.') {
            SimManager = Leapfrog2SimulationManager;
            guiData.dtMax = 0.01;
            guiControls.dtSlider.max(guiData.dtMax);
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            boundaryTypes = ['Dirichlet', 'Neumann', 'Periodic'];
            methodGridSizes = gridSizes;
            numberOfFrames = defaultNumberOfFrames;
            disableNonPowerTwo = false;
            addLaplacianControls(['5 pt. 2nd or.', '9 pt. 2nd or.', 
                                  '9 pt. 4th or.', 
                                  //'13 point', '17 point'
                                  ]);
        } else if (e === 'CN w/ Jacobi') {
            SimManager = CrankNicolsonSimulationManager;
            guiData.dtMax = 0.025;
            guiControls.dtSlider.max(guiData.dtMax);
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            boundaryTypes = ['Dirichlet', 'Neumann', 'Periodic'];
            methodGridSizes = gridSizes;
            numberOfFrames = defaultNumberOfFrames;
            disableNonPowerTwo = false;
            addLaplacianControls(['5 pt. 2nd or.', '9 pt. 2nd or.']);
            addIterationsControls();
       } else if (e === 'CNJ w/ B-Field') {
            SimManager = CrankNicolsonWithAFieldSimulationManager;
            guiData.dtMax = 0.025;
            guiControls.dtSlider.max(guiData.dtMax);
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            methodGridSizes = gridSizes;
            numberOfFrames = defaultNumberOfFrames + 1;
            disableNonPowerTwo = false;
            addLaplacianControls(['5 pt. 2nd or.', '9 pt. 2nd or.']);
            addIterationsControls();
        } else if (e === 'Split-Op. (CPU FFT)') {
            SimManager = SplitStepSimulationManager;
            guiData.dtMax = 0.1;
            guiControls.dtSlider.max(guiData.dtMax);
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            boundaryTypes = ['Periodic'];
            methodGridSizes = ['256x256', '512x512', '1024x1024'];
            numberOfFrames = defaultNumberOfFrames;
            disableNonPowerTwo = true;
        } else if (e === 'Split-Op. (GPU FFT)') {
            SimManager = SplitStepGPUSimulationManager;
            guiData.dtMax = 0.1;
            guiControls.dtSlider.max(guiData.dtMax);
            boundaryTypes = ['Periodic'];
            methodGridSizes = ['256x256', '512x512', '1024x1024'];
            guiControls.dtSlider.setValue(0.03);
            guiControls.dtSlider.updateDisplay();
            guiControls.iter.setValue(2);
            guiControls.iter.updateDisplay();
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            numberOfFrames = defaultNumberOfFrames + 3;
            disableNonPowerTwo = true;
        } else if (e === 'Time Split CN-J') {
            SimManager = TimeSplitWithCNJNonlinearSimulationManager;
            guiData.dtMax = 0.025;
            guiControls.dtSlider.max(guiData.dtMax);
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            boundaryTypes = ['Dirichlet', 'Neumann', 'Periodic'];
            methodGridSizes = gridSizes;
            numberOfFrames = defaultNumberOfFrames + 2;
            disableNonPowerTwo = false;
            addLaplacianControls(['5 pt. 2nd or.', '9 pt. 2nd or.']);
            addIterationsControls();
            /* addNonlinearControls();
            guiControls.textEditNonlinearEntry.onChange(() => {
                textEditNonlinearFuncSplitOperator(sim);
            });*/
        } else if (e === 'Centred Nonlinear') {
            SimManager = LeapfrogNonlinearSimulationManager;
            guiData.dtMax = 0.01;
            guiControls.dtSlider.max(guiData.dtMax);
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            boundaryTypes = ['Dirichlet', 'Neumann', 'Periodic'];
            methodGridSizes = gridSizes;
            numberOfFrames = defaultNumberOfFrames + 3;
            disableNonPowerTwo = false;
            // addNonlocalControls = true;
            addLaplacianControls(['5 pt. 2nd or.', '9 pt. 2nd or.', 
                                  '9 pt. 4th or.', 
                                  // '13 point', '17 point'
                                 ]);
            addNonlinearControls();
            guiControls.textEditNonlinearEntry.onChange(() => {
                textEditNonlinearFuncLeapfrog(sim);
            });
        } else if (e === 'Split-Op. Nonlinear') {
            SimManager = SplitStepNonlinearManager;
            guiData.dtMax = 0.1;
            guiControls.dtSlider.max(guiData.dtMax);
            boundaryTypes = ['Periodic'];
            methodGridSizes = ['256x256', '512x512', '1024x1024'];
            guiControls.dtSlider.setValue(0.03);
            guiControls.dtSlider.updateDisplay();
            guiControls.iter.setValue(2);
            guiControls.iter.updateDisplay();
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            numberOfFrames = defaultNumberOfFrames + 3;
            disableNonPowerTwo = true;
            // addLaplacianControls();
            addNonlinearControls();
            guiControls.textEditNonlinearEntry.onChange(() => {
                textEditNonlinearFuncSplitOperator(sim);
            });
        } else if (e === 'Leapfrog 3') {
            guiData.dtMax = 0.01;
            SimManager = Leapfrog3SimulationManager;
            guiControls.dtSlider.max(guiData.dtMax);
            if (guiData.dt > guiData.dtMax) guiData.dt = guiData.dtMax;
            boundaryTypes = ['Dirichlet', 'Neumann', 'Periodic'];
            methodGridSizes = gridSizes;
            numberOfFrames = defaultNumberOfFrames + 5;
            disableNonPowerTwo = false;
            // addLaplacianControls();
        }
        guiControls.dtSlider.updateDisplay();

        let innerHTML = ``;
        methodGridSizes.map(
            e => innerHTML += `<option value="${e}">${e}</option>`);
        guiControls.gridSelect.__select.innerHTML = innerHTML;
        innerHTML = ``;
        boundaryTypes.map(
            e => innerHTML += `<option value="${e}">${e}</option>`);
        guiControls.boundariesSelect.__select.innerHTML = innerHTML;
        if (disableNonPowerTwo) {
            let evenPowers = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
            if (!(evenPowers.some(e => e === pixelWidth) && 
                  evenPowers.some(e => e === pixelHeight)))
                pixelWidth = 512, pixelHeight = 512;
                guiControls.gridSelect.setValue(`512x512`);
                guiControls.boundariesSelect.setValue(`Periodic`);
        } else {
            if (guiData.borderAlpha === 0.0) {
                guiData.boundaryType = 'Dirichlet';
                guiControls.boundariesSelect.updateDisplay();
            }
            else if (guiData.borderAlpha === 1.0) {
                guiData.boundaryType = 'Neumann';
                guiControls.boundariesSelect.updateDisplay();
            }
        }
        guiControls.boundariesSelect.updateDisplay();
        guiControls.gridSelect.updateDisplay();
        resizeCanvas(pixelWidth, pixelHeight);
        let context = (useWebGL2IfAvailable)? "webgl2": "webgl";
        gl = initializeCanvasGL(canvas, context);
        initPrograms();
        setMouseInput();

        framesManager = new FramesManager();
        framesManager.addFrames(pixelWidth, pixelHeight, numberOfFrames);
        framesManager.addVectorFieldFrame(pixelWidth, pixelHeight);
        sim = new SimManager(framesManager);
        if (addNonlocalControls) {
            addNonlinearNonlocalControls(sim);
        }
        initializePotential(guiData.presetPotential);
    });

    guiData.setToImageDimensions = function () {
        // let canvas = document.getElementById('image-canvas');
        let im = document.getElementById('image');
        console.log(im.width, im.height);
        if (disableNonPowerTwo) {
            if (im.width !== im.height ||
                ![256, 512, 1024, 2048, 4096].some(
                    e => e === parseInt(im.width)) ||
                ![256, 512, 1024, 2048, 4096].some(
                    e => e === parseInt(im.height))) {
                return;
            }
        }
        setFrameDimensions(parseInt(im.width/2.0), 
                           parseInt(im.height/2.0));
    }

    guiData.imageFunc = function () {
        let canvas = document.getElementById('image-canvas');
        console.log(canvas.width, canvas.height);
        let ctx = canvas.getContext("2d");
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();
        let im = document.getElementById('image');
        let w = canvas.width, h = canvas.height;
        console.log(im.width/im.height, w/h);
        if (im.width/im.height > w/h) {
            let r = (im.height/im.width)/(h/w);
            let heightOffset = parseInt(`${0.5*h*(1.0 - r)}`);
            ctx.drawImage(im, 0, heightOffset, 
                          w, parseInt(`${w*im.height/im.width}`));
        } else {
            let r = (im.width/im.height)/(w/h);
            let widthOffset = parseInt(`${0.5*w*(1.0 - r)}`);
            ctx.drawImage(im, widthOffset, 0, 
                          parseInt(`${h*im.width/im.height}`), h);
        }
        let imageData = new Float32Array(ctx.getImageData(0.0, 0.0, 
                                                          w, h
                                                          ).data);
        for (let i = 0; i < imageData.length; i++) {
            imageData[i] *= (15.0/255.0);
        }
        sim.imagePotential(imageData, guiData.invertImage);
        guiData.potChanged = true;
    }

    guiData.imageBackgroundFunc = function() {
        guiData.displayBGImage = true;
        guiControls.displayBG.updateDisplay();
        let canvas = document.getElementById('image-canvas');
        console.log(canvas.width, canvas.height);
        let ctx = canvas.getContext("2d");
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();
        let im = document.getElementById('image');
        let w = canvas.width, h = canvas.height;
        console.log(im.width/im.height, w/h);
        if (im.width/im.height > w/h) {
            let r = (im.height/im.width)/(h/w);
            let heightOffset = parseInt(`${0.5*h*(1.0 - r)}`);
            ctx.drawImage(im, 0, heightOffset, 
                          w, parseInt(`${w*im.height/im.width}`));
        } else {
            let r = (im.width/im.height)/(w/h);
            let widthOffset = parseInt(`${0.5*w*(1.0 - r)}`);
            ctx.drawImage(im, widthOffset, 0, 
                          parseInt(`${h*im.width/im.height}`), h);
        }
        let imageData = new Float32Array(ctx.getImageData(0.0, 0.0, 
                                                          w, h
                                                          ).data);
        for (let i = 0; i < imageData.length; i++) {
            imageData[i] *= (15.0/255.0);
        }
        sim.bgImage(imageData, guiData.bgBrightness);
    }
    guiControls.bgBrightness.onChange(() => guiData.imageBackgroundFunc());

    function changeBoundaries(s, t) {
        if (s === gl.REPEAT || t === gl.REPEAT) {
            if (canvas.width !== 512 && canvas.height !== 512) {
                setFrameDimensions(512, 512);
                guiData.changeDimensions = '512x512';
                guiControls.gridSelect.updateDisplay();
            }
        }
        sim.changeBoundaries(s, t);
        initializePotential(guiData.presetPotential);
    }
    guiControls.boundariesSelect.onChange(e => {
        // List of the names of different boundary conditions:
        // Wikipedia contributors. (2021, March 7). 
        // Boundary value problem
        // https://en.wikipedia.org/wiki/Boundary_value_problem
        // #Types of boundary value problems#Examples
        console.log('update');
        if (e === 'Dirichlet') {
            guiData.borderAlpha = 0.0;
            changeBoundaries(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        } else if (e === 'Neumann') {
            guiData.borderAlpha = 1.0;
            changeBoundaries(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        } else if (e === 'Periodic') {
            guiData.borderAlpha = 1.0;
            changeBoundaries(gl.REPEAT, gl.REPEAT);

        }
    });


    function setFrameDimensions(newWidth, newHeight) {
        let ratioDiff = Math.abs(newWidth/newHeight
                                  - canvas.width/canvas.height);
        pixelWidth = newWidth;
        pixelHeight = newHeight;
        if (ratioDiff > 1e-10 || disableNonPowerTwo) {
            resizeCanvas(newWidth, newHeight);
            let context = (useWebGL2IfAvailable)? "webgl2": "webgl";
            gl = initializeCanvasGL(canvas, context);
            initPrograms();
            framesManager = new FramesManager();
            framesManager.addFrames(newWidth, newHeight, numberOfFrames);
            framesManager.addVectorFieldFrame(newWidth, newHeight);
            sim = new SimManager(framesManager);
            initializePotential('SHO');
            setMouseInput();
        }
        document.getElementById('sketch-canvas').width = newWidth;
        document.getElementById('sketch-canvas').height = newHeight;
        document.getElementById('image-canvas').width = newWidth;
        document.getElementById('image-canvas').height = newHeight;
        width = (canvas.width/512)*64.0*Math.sqrt(2.0);
        height = (canvas.height/512)*64.0*Math.sqrt(2.0);
        console.log(width, height);
        scale = {w: canvasStyleWidth/canvas.width,
            h: canvasStyleHeight/canvas.height};
        guiData.showValues.w = width;
        guiData.showValues.h = height;
        guiData.displayBGImage = false;
        guiControls.displayBG.updateDisplay();
        guiControls.boxW.updateDisplay();
        guiControls.boxH.updateDisplay();

        // TODO if boundary is changed then changing the frame dimensions
        // causes the boundaries to go back to clamp_to_edge.
        // Change this behaviour.
        if (guiData.borderAlpha === 0.0) {
            guiData.boundaryType = 'Dirichlet';
            guiControls.boundariesSelect.updateDisplay();
        }
        else if (guiData.borderAlpha === 1.0) {
            guiData.boundaryType = 'Neumann';
            guiControls.boundariesSelect.updateDisplay();
        }
        sim.setFrameDimensions(pixelWidth, pixelHeight);
        initializePotential(guiData.presetPotential);
        return sim;
    }
    guiControls.gridSelect.onChange(e => {
        xyDims = e.split('x');
        if (disableNonPowerTwo) {
            let pow2List = [1, 2, 4, 8, 16, 32, 64, 128, 
                            256, 512, 1024, 2048, 4096];
            if (!pow2List.some(e => e === parseInt(xyDims[0])) ||
                !pow2List.some(e => e === parseInt(xyDims[1]))) {
                return;
            }
        }
        setFrameDimensions(parseInt(xyDims[0]), parseInt(xyDims[1]));

    });

    function getProbInRegion(probDist, i0, j0, w, h) {
        let reg = 0.0;
        let tot = 0.0;
        for (let j = 0; j < canvas.height; j++) {
            for (let i = 0; i < canvas.width; i++) {
                let val = probDist[4*j*canvas.width + 4*i];
                if ((i >= i0) && (j >= j0) &&
                    (i < (w + i0)) && (j < (h + j0))) {
                    reg += val;
                }
                tot += val;
            }
        }
        guiData.mouseData.probabilityInBox = 
            `${Math.round(1000.0*reg/tot)/1000.0}`;
        guiControls.mouseControls.widgets[1].updateDisplay();
        return reg/tot;
    }

    function measurePosition() {
        if (guiData.measure) {
            let uv = sim.selectPositionFromProbDist();
            let u = uv[0], v = uv[1];
            guiData.measure = false;
            let params = {dx: width/canvas.width, dy: height/canvas.height, 
                          dt: guiData.dt,
                          m: guiData.m, hbar: 1.0,
                          borderAlpha: guiData.borderAlpha,
                          laplaceVal: guiData.laplaceVal,
                          width: width, height: height};
            let sigma = (canvas.width > canvas.height)? 
                         4.0/canvas.height: 4.0/canvas.width;
            let wavefuncParams = {amp: 5.0*30.0/(sigma*512.0),
                                  // sx: 4.0/canvas.width, sy: 4.0/canvas.height,
                                  sx: (canvas.width > canvas.height)? 
                                       sigma*canvas.height/canvas.width: sigma,
                                  sy: (canvas.width > canvas.height)?
                                       sigma: sigma*canvas.width/canvas.height,
                                  bx: u/canvas.width, by: v/canvas.height,
                                  px: 0.0, py: 0.0};
            sim.initWavefunc(params, wavefuncParams);
        }
    }

    function initializePotential(type) {
        for (let e of guiControls.presetControlsFolder.controls) {
            e.remove();
        }
        guiControls.presetControlsFolder.controls = [];
        guiData.mouseData.mouseAction = true;
        let pxMax = canvas.width/512.0*40.0;
        let pyMax = canvas.height/512.0*40.0;
        if (type === 'SHO') {
            let items = {a: 20.0};
            sim.presetPotential(1, guiData.dissipation, items);
            let aVar
                 = guiControls.presetControlsFolder.add(items,
                                                        'a', 0.0, 40.0
                                                        ).name('Strength');
            aVar.onChange(() => 
                          sim.presetPotential(1, guiData.dissipation, 
                                              items));
            guiControls.presetControlsFolder.controls.push(aVar);
            guiData.bx = canvas.width/2;
            guiData.by = canvas.height*0.75;
            guiData.py = 0.0;
            guiData.px = ((Math.random() > 0.5)? -1.0: 1.0)*
                          (pxMax*0.75)/guiData.scaleP;
            guiData.mouseMode = 'New Ψ(x, y)';
            guiControls.mouseMode.updateDisplay();
        } else if (type === 'Double Slit') {
            let doubleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.46, x2: 0.54,
                                      spacing: 0.02, a: 30.0};
            sim.presetPotential(2, guiData.dissipation, doubleSlitUniforms);
            for (let e of Object.keys(doubleSlitUniforms)) {
                let minVal, maxVal, name;
                if (e === 'a') {
                    minVal = 0.0; maxVal = 36.0; name = 'strength';
                } else if (e === 'w') {
                    minVal = 0.0; maxVal = 0.05; name = 'width';
                } else if (e === 'spacing') {
                    minVal = 0.0; maxVal = 0.05; name = e;
                } else {
                    name = e;
                    minVal = doubleSlitUniforms[e]*0.8;
                    maxVal = doubleSlitUniforms[e]*1.2;
                }
                let slider = guiControls.presetControlsFolder.add(
                    doubleSlitUniforms, e,
                    minVal,
                    maxVal
                ).name(name);
                slider.onChange(val => {
                    doubleSlitUniforms[e] = val;
                    sim.presetPotential(2, guiData.dissipation, 
                                        doubleSlitUniforms);
                });
                guiControls.presetControlsFolder.controls.push(slider);
            }
            guiData.bx = canvas.width/2;
            guiData.by = canvas.height*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'New Ψ(x, y)';
            guiControls.mouseMode.updateDisplay();

        } else if (type === 'Single Slit') {
            let singleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.5,
                                      spacing: 0.02, a: 30.0};
            sim.presetPotential(3, guiData.dissipation, 
                                singleSlitUniforms);
            for (let e of Object.keys(singleSlitUniforms)) {
                let minVal, maxVal, name;
                if (e === 'a') {
                    minVal = 0.0; maxVal = 36.0; name = 'strength';
                } else if (e === 'w') {
                    minVal = 0.0; maxVal = 0.05; name = 'width';
                } else if (e === 'spacing') {
                    minVal = 0.0; maxVal = 0.05; name = e;
                } else {
                    name = e;
                    minVal = singleSlitUniforms[e]*0.8;
                    maxVal = singleSlitUniforms[e]*1.2;
                }
                let slider = guiControls.presetControlsFolder.add(
                    singleSlitUniforms, e,
                    minVal,
                    maxVal
                ).name(name);
                slider.onChange(val => {
                    singleSlitUniforms[e] = val;
                    sim.presetPotential(3, guiData.dissipation,
                                        singleSlitUniforms);
                });
                guiControls.presetControlsFolder.controls.push(slider);
            }
            guiData.bx = canvas.width/2;
            guiData.by = canvas.height*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'New Ψ(x, y)';
            guiControls.mouseMode.updateDisplay();
        } else if (type === 'Step') {
            let stepUniforms = {y0: 0.5, a: 4.0};
            sim.presetPotential(4, guiData.dissipation,
                                stepUniforms);
            let aSlider = guiControls.presetControlsFolder.add(
                stepUniforms, 'a', 0.0, 10.0
            ).step(0.1).name('strength');
            aSlider.onChange(val => {
                stepUniforms['a'] = val;
                sim.presetPotential(4, guiData.dissipation, stepUniforms);
            });
            let y0Slider = guiControls.presetControlsFolder.add(
                stepUniforms, 'y0', 0.25, 0.75
            );
            y0Slider.onChange(val => {
                stepUniforms['y0'] = val;
                sim.presetPotential(4, guiData.dissipation, stepUniforms);
            });
            guiControls.presetControlsFolder.controls.push(y0Slider);
            guiControls.presetControlsFolder.controls.push(aSlider);
            guiData.bx = canvas.width/2;
            guiData.by = canvas.height*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'New Ψ(x, y)';
            guiControls.mouseMode.updateDisplay();
        } else if (type === 'Circle'){
            let circleUniforms = {a: 20.0, spacing: 0.45};
            sim.presetPotential(8, guiData.dissipation, {});
            for (let e of Object.keys(circleUniforms)) {
                let name = (e == 'a')? 'a': 'radius';
                let minVal = (e == 'a')? 0.0: 0.27;
                let maxVal = (e == 'a')? 20.0: 0.48;
                let slider = guiControls.presetControlsFolder.add(
                    circleUniforms, e,
                    minVal,
                    maxVal
                ).name(name);
                slider.onChange(val => {
                    circleUniforms[e] = val;
                    sim.presetPotential(8, guiData.dissipation,
                                         circleUniforms);
                });
                slider.setValue(circleUniforms[e]);
                guiControls.presetControlsFolder.controls.push(slider);
            }
            guiData.bx = canvas.width/2;
            guiData.by = canvas.height*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'New Ψ(x, y)';
            guiControls.mouseMode.updateDisplay();
        }  else if (type === 'Coulomb') {
            let coulombUniforms = {a: 0.05};
            sim.presetPotential(7, guiData.dissipation, {});
            for (let e of Object.keys(coulombUniforms)) {
                let name = 'strength';
                let minVal = 0.0;
                let maxVal = 0.15;
                let slider = guiControls.presetControlsFolder.add(
                    coulombUniforms, e,
                    minVal,
                    maxVal
                ).name(name);
                slider.onChange(val => {
                    coulombUniforms[e] = val;
                    sim.presetPotential(7, guiData.dissipation,
                        coulombUniforms);
                });
                slider.setValue(coulombUniforms[e]);
                guiControls.presetControlsFolder.controls.push(slider);
            }
            guiData.bx = canvas.width/2;
            guiData.by = canvas.height*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'New Ψ(x, y)';
            guiControls.mouseMode.updateDisplay();
        } else {
            guiData.bx = canvas.width/2;
            guiData.by = canvas.height*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            if (type == 'Spike') {
                sim.presetPotential(5, guiData.dissipation, {});
            } else if (type == 'Triple Slit') {
                sim.presetPotential(6, guiData.dissipation, {});
            } else if (type == 'Log') {
                sim.presetPotential(9, guiData.dissipation, {});
            } else if (type == 'Cone') {
                sim.presetPotential(10, guiData.dissipation, {});
            } /*else if (type == 'Coulomb') {
                sim.presetPotential(7, guiData.dissipation, {});
            }*/ else {
                sim.presetPotential(11, guiData.dissipation, {});
                guiData.bx = canvas.width/3;
                guiData.by = canvas.height*0.75;
                guiData.py = (0.75*pyMax)/guiData.scaleP;
                guiData.px = -((Math.random() > 0.5)? -1.0: 1.0)*
                                (0.75*pxMax)/guiData.scaleP;
            }
            guiData.mouseMode = 'New Ψ(x, y)';
            guiControls.mouseMode.updateDisplay();
        }
        guiControls.mouseControls.close();
        mouseControlsCallback('New Ψ(x, y)');
        // guiControls.mouseControls.updateDisplay();
    }

    let reshapePotentialRecLevel = 0;
    function reshapePotential(guiData) {
        let drawWidth = guiData.mouseData.width*canvas.width;
        if (guiData.mouseData.mouseCount > 1 && 
            guiData.mouseData.width > 0.0 && 
            (Math.abs(guiData.px) > drawWidth ||
             Math.abs(guiData.py) > drawWidth)) {
            reshapePotentialRecLevel += 1;
            // console.log(reshapePotentialRecLevel);
            if (reshapePotentialRecLevel > 100) {
                reshapePotentialRecLevel = 0;
            } else {
                let newControls = Object.create(guiData);
                let dist = Math.sqrt(guiData.px**2 + guiData.py**2);
                let dx = drawWidth*guiData.px/dist;
                let dy = drawWidth*guiData.py/dist;
                newControls.px -= dx;
                newControls.py -= dy;
                newControls.bx -= dx;
                newControls.by += dy;
                reshapePotential(newControls);
            }
        }
        sim.reshapePotential(bx=guiData.bx/canvas.width,
                              by=1.0 - guiData.by/canvas.height,
                              v2=guiData.mouseData.v2,
                              drawWidth=guiData.mouseData.width,
                              drawHeight=guiData.mouseData.width*
                                         (width/height),
                              stencilType=guiData.mouseData.stencilType,
                              eraseMode=guiData.mouseData.erase);
        guiData.rScaleV = 0.5;
    }

    function createNewWave() {
        let px = (!guiData.mouseData.fixInitialP)?
                  guiData.scaleP*guiData.px: guiData.mouseData.px0;
        let py = (!guiData.mouseData.fixInitialP)?
                  guiData.scaleP*guiData.py: guiData.mouseData.py0;
        let sigma = guiData.mouseData.sigma;
        let params = {dx: width/canvas.width, dy: height/canvas.height, 
                      dt: guiData.dt,
                      m: guiData.m, hbar: 1.0,
                      borderAlpha: guiData.borderAlpha,
                      laplaceVal: guiData.laplaceVal,
                      width: width, height: height};
        let wavefuncParams = {amp: 5.0*30.0/(sigma*512.0),
                              sx: (canvas.width > canvas.height)? 
                                   sigma*canvas.height/canvas.width: sigma,
                              sy: (canvas.width > canvas.height)?
                                   sigma: sigma*canvas.width/canvas.height,
                              bx: guiData.bx/canvas.width,
                              by: 1.0 - guiData.by/canvas.height,
                              px: px, py: py};
        sim.initWavefunc(params, wavefuncParams);
    }

    guiData.serializeWavefunc = () => serializeWavefunc(sim);

    guiData.serializePotential = () => serializePotential(sim);

    guiData.serializePotentialAndWavefunction = () => {
        serializePotentialAndWavefunction(sim);
    }

    function onLoadBinaryData() {
        let file = this.files[0];
        // TODO: Handle loading of arrays for methods
        // that only have power of two dimensions.
        if (disableNonPowerTwo) return;
        let sims = [sim];
        loadBinaryDataToSim({sims: sims, file: file,
                             setFrameDimensions: setFrameDimensions,
                             boundaryType: guiData.boundaryType});
    }
    guiControls.loadBinaryData.addEventListener(
        "change", onLoadBinaryData, false);

    function timeStepWave() {
        let dt = guiData.dt;
        if (guiData.potChanged) {
            dt = guiData.dt/2.0;
            guiData.potChanged = false;
        }
        params = {dx: width/canvas.width, dy: height/canvas.height, 
                  dt: guiData.dt,
                  m: guiData.m, hbar: 1.0, 
                  laplaceVal: guiData.laplaceVal, rScaleV: guiData.rScaleV,
                  width: width, height: height, 
                  iterations: guiData.iterations, 
                  tolerance: guiData.tolerance,
                  assessConvergence: guiData.assessConvergence};
        sim.step(params);
        guiData.rScaleV = 0.0;
    }

    function display() {
        const MOUSE_MODE_PROB_IN_BOX = 'P';
        const DISPLAY_ONLY_PROB_DENSITY = 0;
        const DISPLAY_PHASE = 1;
        const DISPLAY_PROB_DENSITY_HEIGHT_MAP = 2;
        const DISPLAY_NO_VECTOR = 0;
        const DISPLAY_VECTOR = 1;
        const DISPLAY_POTENTIAL_SINGLE_COLOUR = 0;
        const DISPLAY_POTENTIAL_COLOUR_MAP = 1;
        const DISPLAY_NO_BACKGROUND = 0;
        const DISPLAY_BACKGROUND = 1;
        let wavefuncDisplayMode = DISPLAY_ONLY_PROB_DENSITY;
        let potentialDisplayMode = DISPLAY_POTENTIAL_SINGLE_COLOUR;
        if (guiData.colourPhase) {
            wavefuncDisplayMode = DISPLAY_PHASE;
        } else if (guiData.showProbHeightMap) {
            wavefuncDisplayMode = DISPLAY_PROB_DENSITY_HEIGHT_MAP;
        }
        if (guiData.showPotHeightMap) {
            potentialDisplayMode = DISPLAY_POTENTIAL_COLOUR_MAP;
        }
        let intUniforms = {wavefunctionDisplayMode: wavefuncDisplayMode,
                           potentialDisplayMode: potentialDisplayMode,
                           vectorDisplayMode: DISPLAY_NO_VECTOR,
                           backgroundDisplayMode: 
                           (guiData.displayBGImage)?
                            DISPLAY_BACKGROUND: DISPLAY_NO_BACKGROUND};
        if (guiData.viewProbCurrent) {
            sim.probCurrent({width: width, height: height,
                              hbar: 1.0, m: guiData.m});
            intUniforms.vectorDisplayMode = DISPLAY_VECTOR;
        }
        let vec3Uniforms = {probColour: guiData.probColour,
                            potColour: guiData.potColour};
        let floatUniforms;
        if (guiData.mouseMode[0] === MOUSE_MODE_PROB_IN_BOX) {
            floatUniforms = {x0: guiData.drawRect.x/canvas.width,
                             y0: (canvas.height 
                                   - guiData.drawRect.y)/canvas.height,
                             w: guiData.drawRect.w/canvas.width,
                             h: -guiData.drawRect.h/canvas.height,
                             lineWidth: 0.002,
                             brightness: guiData.brightness,
                             brightness2: guiData.brightness2};
        } else {
            floatUniforms = {lineWidth: 0.0,
                             brightness: guiData.brightness,
                             brightness2: guiData.brightness2};
        }
        sim.display(floatUniforms, intUniforms, vec3Uniforms);
        if (guiData.mouseMode[0] == MOUSE_MODE_PROB_IN_BOX) {
            let prob = sim.getUnnormalizedProbDist();
            let j0 = pixelHeight - guiData.drawRect.y;
            let h = -guiData.drawRect.h;
            let i0 = ((guiData.drawRect.w < 0.0)? 
                      guiData.drawRect.x + guiData.drawRect.w:
                      guiData.drawRect.x);
            j0 = (h < 0.0)? j0 + h: j0;
            let w = ((guiData.drawRect.w < 0.0)? 
                     -guiData.drawRect.w: guiData.drawRect.w);
            h = (h < 0.0)? -h: h;
            // let reg = 
            getProbInRegion(prob, i0, j0, w, h);
            // console.log(reg);
        }
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    let requestInitializePotential = false;
    guiControls.presetPotentialSelect.onChange(() => {
        requestInitializePotential = true;
    });
    let requestTextEditPotential = false;
    guiControls.textEditPotentialEntry.onChange(e => {
        requestTextEditPotential = true;
    });
    guiControls.useTex.onChange(() => {
        requestTextEditPotential = true;
    });
    function onPotentialChange() {
        if (requestInitializePotential) {
            initializePotential(guiData.presetPotential);
            potChange = true;
            requestInitializePotential = false;
        }
        if (requestTextEditPotential) {
            textEditPotentialFunc();
            requestTextEditPotential = false;
        }
    }
    function textEditPotentialFunc() {
        if (guiControls.textEditSubFolder.closed) {
            guiControls.textEditSubFolder.open();
        }
        let expr = guiData.enterPotential;
        if (expr.includes('^') || expr.includes('**')) {
            expr = powerOpsToCallables(expr, false);
        }
        expr = replaceIntsToFloats(expr);
        if (expr === guiData.enterPotentialExpr) return;
        guiData.enterPotentialExpr = expr;
        for (let e of guiControls.textEditSubFolder.controls) {
            console.log(e);
            e.remove();
        }
        guiControls.textEditSubFolder.controls = [];
        guiData.enterPotentialExpr = expr;
        let uniforms = getVariables(expr);
        uniforms.delete('x');
        uniforms.delete('y');
        let shader = createPotentialShader(expr, uniforms);
        if (shader === null) {
            return;
        }
        let program = makeProgram(vShader, shader);

        let f = (uniforms) => {
            xyScales = {};
            if (guiData.useTextureCoordinates) {
                xyScales = {xScale: 1.0, yScale: 1.0};
            } else {
                xyScales = {xScale: width, yScale: height};
            }
            for (let e of Object.keys(xyScales)) {
                uniforms[e] = xyScales[e];
            }
            sim.textPotential(program, uniforms);
            guiData.potChanged = true;
            guiData.rScaleV = 0.5;
        };
        let newUniformVals = {};
        for (let u of uniforms) {
            newUniformVals[u] = 1.0;
        }
        f(newUniformVals);
        for (let e of uniforms) {
            let slider = guiControls.textEditSubFolder.add(
                newUniformVals, e,
                0.0, 10.0
            );
            slider.onChange(val => {
                newUniformVals[e] = val;
                f(newUniformVals);
            });
            guiControls.textEditSubFolder.controls.push(slider);
        }
    }
    function textEditWavefuncFunction() {
        params = {px: guiData.px, py: guiData.py, 
                  dx: 1.0/canvas.width, dy: 1.0/canvas.height,
                  borderAlpha: guiData.borderAlpha,
                  };
        let expr = guiData.enterWavefunc;
        if (expr.includes('^') || expr.includes('**')) {
            expr = powerOpsToCallables(expr, false);
        }
        expr = replaceIntsToFloats(expr);
        if (expr === guiData.enterWavefuncExpr) return;
        guiData.enterWavefuncExpr = expr;
        for (let e of guiControls.textEditWavefuncSubFolder.controls) {
            console.log(e);
            e.remove();
        }
        guiControls.textEditWavefuncSubFolder.controls = [];
        guiData.enterWavefuncExpr = expr;
        let uniforms = getVariables(expr);
        uniforms.delete('x');
        uniforms.delete('y');
        let shader = createWavefunctionShader(expr, uniforms);
        if (shader === null) {
            return;
        }
        let program = makeProgram(vShader, shader);

        let f = (uniforms) => {
            xyScales = {};
            if (guiData.useTextureCoordinates) {
                xyScales = {xScale: 1.0, yScale: 1.0};
            } else {
                xyScales = {xScale: width, yScale: height};
            }
            for (let e of Object.keys(xyScales)) {
                uniforms[e] = xyScales[e];
            }
            sim.textWavefunction(program, params, uniforms);
        };
        let newUniformVals = {};
        for (let u of uniforms) {
            newUniformVals[u] = 1.0;
        }
        f(newUniformVals);
        for (let e of uniforms) {
            let slider = guiControls.textEditWavefuncSubFolder.add(
                newUniformVals, e,
                0.0, 10.0
            );
            slider.onChange(val => {
                newUniformVals[e] = val;
                f(newUniformVals);
            });
            guiControls.textEditWavefuncSubFolder.controls.push(slider);
        }
    }
    // guiControls.textEditWavefuncEntry.onChange(
    //    () => textEditWavefuncFunction());

    function animate() {
        if (stats) stats.begin();
        onPotentialChange();
        if (guiData.mouseData.mouseAction) {
            if (guiData.mouseMode[0] === 'N') {
                createNewWave();
            } else if ((guiData.mouseMode[0]
                         === guiData.mouseData.SKETCH_BARRIER ||
                        guiData.mouseMode[0]
                         === guiData.mouseData.ERASE_BARRIER) ){
                reshapePotential(guiData);
            } else {
                guiData.drawRect.w = guiData.bx - guiData.drawRect.x;
                guiData.drawRect.h = guiData.by - guiData.drawRect.y;
            }
            guiData.mouseData.mouseAction = false;
        }
        for (let i = 0; i < guiData.speed; i++) {
            timeStepWave();
            sim.swap();
        }
        if (guiData.normalizeEachFrame) {
            let normFact2 = 0.920345*(pixelWidth > pixelHeight? 
                                      pixelHeight: pixelWidth)**2
                                      *(5.0*30.0/512.0);
            sim.normalizeScaleWavefunction(Math.sqrt(normFact2));
        }
        display();
        measurePosition();
        if (stats) stats.end();
        handleRecording(canvas).then(() => {
            requestAnimationFrame(animate);
        })
    }
    setMouseInput();
    window.addEventListener("orientationchange", () => {
        canvasStyleWidth = parseInt(canvas.style.width);
        canvasStyleHeight = parseInt(canvas.style.height);
        if (window.innerHeight < window.innerWidth) {
            canvasStyleWidth = parseInt(window.innerHeight*0.95);
            canvasStyleHeight = parseInt(window.innerHeight*0.95);
        } else {
            canvasStyleWidth = parseInt(window.innerWidth*0.95);
            canvasStyleHeight = parseInt(window.innerWidth*0.95);
        }
        canvas.style.width = `${canvasStyleWidth}px`;
        canvas.style.height = `${canvasStyleHeight}px`;
        scale = {w: canvasStyleWidth/canvas.width,
                 h: canvasStyleHeight/canvas.height};
    });

    mouseControlsCallback(guiData.mouseMode);
    animate();
}
