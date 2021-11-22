
main();


function main() {

    let framesManager = new FramesManager();
    let numberOfFrames = 7;
    framesManager.addFrames(pixelWidth, pixelHeight, numberOfFrames);
    framesManager.addVectorFieldFrame(pixelWidth, pixelHeight);
    let SimManager = LeapfrogSimulationManager;
    let view = new SimManager(framesManager);
    let potChanged = false;
    let disableNonPowerTwo = false;

    initializePotential('SHO');

    /*let methodGridSizes;
    methodControl.onChange(e => {
        if (e === 'Leapfrog') {
            SimManager = LeapfrogSimulationManager;
            dtSlider.max(0.01);
            if (guiData.dt > 0.01) guiData.dt = 0.01;
            boundaryTypes = ['Dirichlet', 'Neumann', 'Periodic'];
            methodGridSizes = gridSizes;
            numberOfFrames = 7;
            disableNonPowerTwo = false;
        } else if (e === 'CN w/ Jacobi') {
            SimManager = CrankNicolsonSimulationViewManager;
            dtSlider.max(0.025);
            if (guiData.dt > 0.025) guiData.dt = 0.025;
            boundaryTypes = ['Dirichlet', 'Neumann', 'Periodic'];
            methodGridSizes = gridSizes;
            numberOfFrames = 7;
            disableNonPowerTwo = false; 
       } else if (e === 'CNJ w/ B-Field') {
            SimManager = CrankNicolsonWithAFieldSimulationViewManager;
            dtSlider.max(0.025);
            if (guiData.dt > 0.025) guiData.dt = 0.025;
            methodGridSizes = gridSizes;
            numberOfFrames = 8;
            disableNonPowerTwo = false;
        } else if (e === 'Split-Op. (CPU FFT)') {
            SimManager = SplitStepSimulationViewManager;
            dtSlider.max(0.1);
            if (guiData.dt > 0.1) guiData.dt = 0.1;
            boundaryTypes = ['Periodic'];
            methodGridSizes = ['256x256', '512x512', '1024x1024'];
            numberOfFrames = 7;
            disableNonPowerTwo = true;
        } else if (e === 'Split-Op. (GPU FFT)') {
            SimManager = SplitStepGPUSimulationViewManager;
            dtSlider.max(0.1);
            boundaryTypes = ['Periodic'];
            methodGridSizes = ['256x256', '512x512', '1024x1024'];
            dtSlider.setValue(0.03);
            dtSlider.updateDisplay();
            iter.setValue(2);
            iter.updateDisplay();
            if (guiData.dt > 0.1) guiData.dt = 0.1;
            numberOfFrames = 10;
            disableNonPowerTwo = true;
        } else if (e === 'Split-Op. Nonlinear') {
            SimManager = SplitStepNonlinearViewManager;
            dtSlider.max(0.1);
            boundaryTypes = ['Periodic'];
            methodGridSizes = ['256x256', '512x512', '1024x1024'];
            dtSlider.setValue(0.03);
            dtSlider.updateDisplay();
            iter.setValue(2);
            iter.updateDisplay();
            if (guiData.dt > 0.1) guiData.dt = 0.1;
            numberOfFrames = 10;
            disableNonPowerTwo = true;
            textEditNonlinearEntry.onChange(() => {
                textEditNonlinearFunc(view);
            });
        }
        dtSlider.updateDisplay();

        let innerHTML = ``;
        methodGridSizes.map(
            e => innerHTML += `<option value="${e}">${e}</option>`);
        gridSelect.__select.innerHTML = innerHTML;
        innerHTML = ``;
        boundaryTypes.map(
            e => innerHTML += `<option value="${e}">${e}</option>`);
        boundariesSelect.__select.innerHTML = innerHTML;
        if (disableNonPowerTwo) {
            let evenPowers = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
            if (!(evenPowers.some(e => e === pixelWidth) && 
                  evenPowers.some(e => e === pixelHeight)))
                pixelWidth = 512, pixelHeight = 512;
                gridSelect.setValue(`512x512`);
                boundariesSelect.setValue(`Periodic`);
        } else {
            if (guiData.borderAlpha === 0.0) {
                guiData.boundaryType = 'Dirichlet';
                boundariesSelect.updateDisplay();
            }
            else if (guiData.borderAlpha === 1.0) {
                guiData.boundaryType = 'Neumann';
                boundariesSelect.updateDisplay();
            }
        }
        boundariesSelect.updateDisplay();
        gridSelect.updateDisplay();
        resizeCanvas(pixelWidth, pixelHeight);
        let context = (useWebGL2IfAvailable)? "webgl2": "webgl";
        gl = initializeCanvasGL(canvas, context);
        initPrograms();
        setMouseInput();

        framesManager = new FramesManager();
        framesManager.addFrames(pixelWidth, pixelHeight, numberOfFrames);
        framesManager.addVectorFieldFrame(pixelWidth, pixelHeight);
        view = new SimManager(framesManager);
        initializePotential(guiData.presetPotential);
    });*/

    guiData.setToImageDimensions = function () {
        let canvas = document.getElementById('image-canvas');
        let im = document.getElementById('image');
        setFrameDimensions(parseInt(im.width/2.0), 
                           parseInt(im.height/2.0));
    }

    guiData.imageFunc = function () {
        let canvas = document.getElementById('image-canvas');
        console.log(canvas.width, canvas.height);
        let ctx = canvas.getContext("2d");
        ctx.rect(0, 0, pixelWidth, pixelHeight);
        ctx.fill();
        let im = document.getElementById('image');
        let w = pixelWidth, h = pixelHeight;
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
        view.imagePotential(imageData, guiData.invertImage);
        potChanged = true;
    }

    function changeBoundaries(s, t) {
        if (s === gl.REPEAT || t === gl.REPEAT) {
            if (pixelWidth !== 512 && pixelHeight !== 512) {
                setFrameDimensions(512, 512);
                guiData.changeDimensions = '512x512';
                gridSelect.updateDisplay();
            }
        }
        view.changeBoundaries(s, t);
        initializePotential(guiData.presetPotential);
    }
    boundariesSelect.onChange(e => {
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
        let ratioDiff = Math.abs(newWidth/newHeight - pixelWidth/pixelHeight);
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
            view = new SimManager(framesManager);
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
        showValues.w = width;
        showValues.h = height;
        boxW.updateDisplay();
        boxH.updateDisplay();

        // TODO if boundary is changed then changing the frame dimensions
        // causes the boundaries to go back to clamp_to_edge.
        // Change this behaviour.
        if (guiData.borderAlpha === 0.0) {
            guiData.boundaryType = 'Dirichlet';
            boundariesSelect.updateDisplay();
        }
        else if (guiData.borderAlpha === 1.0) {
            guiData.boundaryType = 'Neumann';
            boundariesSelect.updateDisplay();
        }
        view.setFrameDimensions(pixelWidth, pixelHeight);
        initializePotential(guiData.presetPotential);
    }
    gridSelect.onChange(e => {
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
        for (let j = 0; j < pixelHeight; j++) {
            for (let i = 0; i < pixelWidth; i++) {
                let val = probDist[4*j*pixelWidth + 4*i];
                if ((i >= i0) && (j >= j0) &&
                    (i < (w + i0)) && (j < (h + j0))) {
                    reg += val;
                }
                tot += val;
            }
        }
        guiData.mouseData.probabilityInBox = 
            `${Math.round(1000.0*reg/tot)/1000.0}`;
        mouseControls.widgets[1].updateDisplay();
        return reg/tot;
    }

    function measurePosition() {
        if (guiData.measure) {
            let uv = view.selectPositionFromProbDist();
            let u = uv[0], v = uv[1];
            guiData.measure = false;
            let params = {dx: width/pixelWidth, dy: height/pixelHeight, 
                          dt: guiData.dt,
                          m: guiData.m, hbar: 1.0,
                          borderAlpha: guiData.borderAlpha,
                          laplaceVal: guiData.laplaceVal,
                          width: width, height: height};
            let wavefuncParams = {amp: 37.5,
                                  sx: 4.0/pixelWidth, sy: 4.0/pixelHeight,
                                  bx: u/canvas.width, by: v/canvas.height,
                                  px: 0.0, py: 0.0};
            view.initWavefunc(params, wavefuncParams);
        }
    }

    function initializePotential(type) {
        for (let e of presetControlsFolder.controls) {
            e.remove();
        }
        presetControlsFolder.controls = [];
        guiData.mouseData.mouseAction = true;
        let pxMax = pixelWidth/512.0*40.0;
        let pyMax = pixelHeight/512.0*40.0;
        if (type === 'SHO') {
            let items = {a: 20.0};
            view.presetPotential(1, items);
            let aVar = presetControlsFolder.add(items,
                                                'a', 0.0, 40.0).name('Strength');
            aVar.onChange(() => view.presetPotential(1, items));
            presetControlsFolder.controls.push(aVar);
            guiData.bx = pixelWidth/2;
            guiData.by = pixelHeight*0.75;
            guiData.py = 0.0;
            guiData.px = ((Math.random() > 0.5)? -1.0: 1.0)*
                          (pxMax*0.75)/guiData.scaleP;
            guiData.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        } else if (type == 'Double Slit') {
            let doubleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.46, x2: 0.54,
                                      spacing: 0.02, a: 30.0};
            view.presetPotential(2, doubleSlitUniforms);
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
                let slider = presetControlsFolder.add(
                    doubleSlitUniforms, e,
                    minVal,
                    maxVal
                ).name(name);
                slider.onChange(val => {
                    doubleSlitUniforms[e] = val;
                    view.presetPotential(2, doubleSlitUniforms);
                });
                presetControlsFolder.controls.push(slider);
            }
            guiData.bx = pixelWidth/2;
            guiData.by = pixelHeight*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();

        } else if (type == 'Single Slit') {
            let singleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.5,
                                      spacing: 0.02, a: 30.0};
            view.presetPotential(3, singleSlitUniforms);
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
                let slider = presetControlsFolder.add(
                    singleSlitUniforms, e,
                    minVal,
                    maxVal
                ).name(name);
                slider.onChange(val => {
                    singleSlitUniforms[e] = val;
                    view.presetPotential(3, singleSlitUniforms);
                });
                presetControlsFolder.controls.push(slider);
            }
            guiData.bx = pixelWidth/2;
            guiData.by = pixelHeight*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        } else if (type == 'Step') {
            let stepUniforms = {y0: 0.5, a: 4.0};
            view.presetPotential(4, stepUniforms);
            let aSlider = presetControlsFolder.add(
                stepUniforms, 'a', 0.0, 10.0
            ).step(0.1).name('strength');
            aSlider.onChange(val => {
                stepUniforms['a'] = val;
                view.presetPotential(4, stepUniforms);
            });
            let y0Slider = presetControlsFolder.add(
                stepUniforms, 'y0', 0.25, 0.75
            );
            y0Slider.onChange(val => {
                stepUniforms['y0'] = val;
                view.presetPotential(4, stepUniforms);
            });
            presetControlsFolder.controls.push(y0Slider);
            presetControlsFolder.controls.push(aSlider);
            guiData.bx = pixelWidth/2;
            guiData.by = pixelHeight*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        } else {
            guiData.bx = pixelWidth/2;
            guiData.by = pixelHeight*0.75;
            guiData.py = pyMax/guiData.scaleP;
            guiData.px = 0.0;
            if (type == 'Spike') {
                view.presetPotential(5, {});
            } else if (type == 'Triple Slit') {
                view.presetPotential(6, {});
            } else {
                view.presetPotential(8, {});
                guiData.bx = pixelWidth/3;
                guiData.by = pixelHeight*0.75;
                guiData.py = (0.75*pyMax)/guiData.scaleP;
                guiData.px = -((Math.random() > 0.5)? -1.0: 1.0)*
                                (0.75*pxMax)/guiData.scaleP;
            }
            guiData.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        }
        mouseControls.close();
        mouseControlsCallback('new ψ(x, y)');
        // mouseControls.updateDisplay();
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
        view.reshapePotential(bx=guiData.bx/canvas.width,
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
        let dx = width/pixelWidth;
        let dy = height/pixelHeight;
        let params = {dx: width/pixelWidth, dy: height/pixelHeight, 
                      dt: guiData.dt,
                      m: guiData.m, hbar: 1.0,
                      borderAlpha: guiData.borderAlpha,
                      laplaceVal: guiData.laplaceVal,
                      width: width, height: height};
        // let tmp = (pixelWidth > pixelHeight)? pixelHeight: pixelWidth;
        let wavefuncParams = {amp: 5.0*30.0/(sigma*512.0),
                              sx: (pixelWidth > pixelHeight)? 
                                   sigma*pixelHeight/pixelWidth: sigma,
                              sy: (pixelWidth > pixelHeight)?
                                   sigma: sigma*pixelWidth/pixelHeight,
                              bx: guiData.bx/canvas.width,
                              by: 1.0 - guiData.by/canvas.height,
                              px: px, py: py};
        view.initWavefunc(params, wavefuncParams);
    }

    function timeStepWave() {
        let dt = guiData.dt;
        if (potChanged) {
            dt = guiData.dt/2.0;
            potChanged = false;
        }
        params = {dx: width/pixelWidth, dy: height/pixelHeight, 
                  dt: guiData.dt,
                  m: guiData.m, hbar: 1.0, 
                  laplaceVal: guiData.laplaceVal, rScaleV: guiData.rScaleV,
                  width: width, height: height};
        view.step(params);
        guiData.rScaleV = 0.0;
    }

    function display() {
        const DISPLAY_ONLY_PROB_DENSITY = 0;
        const DISPLAY_PHASE = 1;
        const DISPLAY_CURRENT_WITH_PROB = 2
        const DISPLAY_CURRENT_WITH_PHASE = 3;
        let intUniforms = {displayMode: DISPLAY_PHASE};
        if (!guiData.colourPhase) {
            intUniforms['displayMode'] = DISPLAY_ONLY_PROB_DENSITY;
        }
        if (guiData.viewProbCurrent) {
            view.probCurrent({width: width, height: height,
                              hbar: 1.0, m: guiData.m});
            let displayMode = (guiData.colourPhase)?
                                DISPLAY_CURRENT_WITH_PHASE:
                                DISPLAY_CURRENT_WITH_PROB;
            intUniforms['displayMode'] = displayMode;
        }
        let vec3Uniforms = {probColour: guiData.probColour,
                            potColour: guiData.potColour};
        let floatUniforms;
        if (guiData.mouseMode[0] == 'p') {
            floatUniforms = {x0: guiData.drawRect.x/pixelWidth,
                             y0: (pixelHeight 
                                   - guiData.drawRect.y)/pixelHeight,
                             w: guiData.drawRect.w/pixelWidth,
                             h: -guiData.drawRect.h/pixelHeight,
                             lineWidth: 0.002,
                             brightness: guiData.brightness,
                             brightness2: guiData.brightness2};
        } else {
            floatUniforms = {lineWidth: 0.0,
                             brightness: guiData.brightness,
                             brightness2: guiData.brightness2};
        }
        view.display(floatUniforms, intUniforms, vec3Uniforms);
        if (guiData.mouseMode[0] == 'p') {
            let prob = view.getUnnormalizedProbDist();
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
    presetPotentialSelect.onChange(() => {
        requestInitializePotential = true;
    });
    let requestTextEditPotential = false;
    textEditPotentialEntry.onChange(e => {
        requestTextEditPotential = true;
    });
    useTex.onChange(() => {
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
        if (textEditSubFolder.closed) {
            textEditSubFolder.open();
        }
        let expr = guiData.enterPotential;
        if (expr.includes('^') || expr.includes('**')) {
            expr = powerOpsToCallables(expr, false);
        }
        expr = replaceIntsToFloats(expr);
        if (expr === guiData.enterPotentialExpr) return;
        guiData.enterPotentialExpr = expr;
        for (let e of textEditSubFolder.controls) {
            console.log(e);
            e.remove();
        }
        textEditSubFolder.controls = [];
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
            view.textPotential(program, uniforms);
            potChanged = true;
            guiData.rScaleV = 0.5;
        };
        let newUniformVals = {};
        for (let u of uniforms) {
            newUniformVals[u] = 1.0;
        }
        f(newUniformVals);
        for (let e of uniforms) {
            let slider = textEditSubFolder.add(
                newUniformVals, e,
                0.0, 10.0
            );
            slider.onChange(val => {
                newUniformVals[e] = val;
                f(newUniformVals);
            });
            textEditSubFolder.controls.push(slider);
        }
    }
    function textEditWavefuncFunction() {
        params = {px: guiData.px, py: guiData.py, 
                  dx: 1.0/pixelWidth, dy: 1.0/pixelHeight,
                  borderAlpha: guiData.borderAlpha,
                  };
        let expr = guiData.enterWavefunc;
        if (expr.includes('^') || expr.includes('**')) {
            expr = powerOpsToCallables(expr, false);
        }
        expr = replaceIntsToFloats(expr);
        if (expr === guiData.enterWavefuncExpr) return;
        guiData.enterWavefuncExpr = expr;
        for (let e of textEditWavefuncSubFolder.controls) {
            console.log(e);
            e.remove();
        }
        textEditWavefuncSubFolder.controls = [];
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
            view.textWavefunction(program, params, uniforms);
        };
        let newUniformVals = {};
        for (let u of uniforms) {
            newUniformVals[u] = 1.0;
        }
        f(newUniformVals);
        for (let e of uniforms) {
            let slider = textEditWavefuncSubFolder.add(
                newUniformVals, e,
                0.0, 10.0
            );
            slider.onChange(val => {
                newUniformVals[e] = val;
                f(newUniformVals);
            });
            textEditWavefuncSubFolder.controls.push(slider);
        }
    }
    textEditWavefuncEntry.onChange(() => textEditWavefuncFunction());

    function animate() {
        if (stats) stats.begin();
        onPotentialChange();
        if (guiData.mouseData.mouseAction) {
            if (guiData.mouseMode[0] === 'n') {
                createNewWave();
            } else if ((guiData.mouseMode[0] === SKETCH_BARRIER ||
                        guiData.mouseMode[0] === ERASE_BARRIER) ){
                reshapePotential(guiData);
            } else {
                guiData.drawRect.w = guiData.bx - guiData.drawRect.x;
                guiData.drawRect.h = guiData.by - guiData.drawRect.y;
            }
            guiData.mouseData.mouseAction = false;
        }
        for (let i = 0; i < guiData.speed; i++) {
            timeStepWave();
            view.swap();
        }
        display();
        measurePosition();
        if (stats) stats.end();
        handleRecording(canvas);
        requestAnimationFrame(animate);
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
