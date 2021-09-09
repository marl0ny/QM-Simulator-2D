
main();

function main() {

    let view = new SimulationViewManager(pixelWidth, pixelHeight);
    let potChanged = false;

    initializePotential('SHO');

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
        document.getElementById('sketch-canvas').width = newWidth;
        document.getElementById('sketch-canvas').height = newHeight;
        document.getElementById('image-canvas').width = newWidth;
        document.getElementById('image-canvas').height = newHeight;
        width = (canvas.width/512)*64.0*Math.sqrt(2.0);
        height = (canvas.width/512)*64.0*Math.sqrt(2.0);
        console.log(width, height);
        scale = {w: canvasStyleWidth/canvas.width,
            h: canvasStyleHeight/canvas.height};
        pixelWidth = newWidth;
        pixelHeight = newHeight;
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
            guiData.px = ((Math.random() > 0.5)? -1.0: 1.0)*30.0/guiData.scaleP;
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
            guiData.py = 40.0/guiData.scaleP;
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
            guiData.py = 40.0/guiData.scaleP;
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
            guiData.py = 40.0/guiData.scaleP;
            guiData.px = 0.0;
            guiData.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        } else {
            guiData.bx = pixelWidth/2;
            guiData.by = pixelHeight*0.75;
            guiData.py = 40.0/guiData.scaleP;
            guiData.px = 0.0;
            if (type == 'Spike') {
                view.presetPotential(5, {});
            } else if (type == 'Triple Slit') {
                view.presetPotential(6, {});
            } else {
                view.presetPotential(8, {});
                guiData.bx = pixelWidth/3;
                guiData.by = pixelHeight*0.75;
                guiData.py = 30.0/guiData.scaleP;
                guiData.px = -((Math.random() > 0.5)? -1.0: 1.0)*
                                30.0/guiData.scaleP;
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
        let params = {dx: width/pixelWidth, dy: height/pixelHeight, 
                      dt: guiData.dt,
                      m: guiData.m, hbar: 1.0,
                      borderAlpha: guiData.borderAlpha,
                      laplaceVal: guiData.laplaceVal,
                      width: width, height: height};
        let wavefuncParams = {amp: 5.0*30.0/(sigma*512.0),
                              sx: (sigma*512.0)/pixelWidth,
                              sy: (sigma*512.0)/pixelHeight,
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
        let shader = createFunctionShader(expr, uniforms);
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
        if (guiData.takeScreenshot) {
            guiData.screenshots.push(canvas.toDataURL('image/png', 1));
            if (guiData.screenshots.length === guiData.nScreenshots) {
                guiData.takeScreenshot = false;
                downloadScreenshots();
            }
        }
        requestAnimationFrame(animate);
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
                guiData.px = Math.sign(guiData.px)*50.0/guiData.scaleP;
            }
            guiData.py = -parseInt(guiData.by - prevBy);
            if (Math.abs(guiData.py) > 50.0/guiData.scaleP) {
                guiData.py = Math.sign(guiData.py)*50.0/guiData.scaleP;
            }
        }
        if (guiData.mouseData.mouseUse) {
            if (guiData.bx < canvas.width && guiData.by < canvas.height &&
                guiData.bx >= 0 && 
                guiData.by >= 0) guiData.mouseData.mouseAction = true;
        }
    };
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
