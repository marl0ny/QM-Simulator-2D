// new Promise(() => setTimeout(main, 500));
main();
function main() {

    let viewFrame = new Frame(pixelWidth, pixelHeight, 0);

    let swapFrames = [1, 2, 3, 4].map(i =>
                                        new Frame(pixelWidth, pixelHeight, i));
    let t = 3;
    let swap = () => swapFrames = [swapFrames[2], swapFrames[3],
                                   swapFrames[0], swapFrames[1]];

    let storeFrame = new Frame(pixelWidth, pixelHeight, 5);
    let nullTexNumber = 8;

    let potentialFrame = new Frame(pixelWidth, pixelHeight, 6);
    let vectorFieldFrame = new VectorFieldFrame(pixelWidth, pixelHeight, 7);
    potentialFrame.presetPotentials = controls.presetPotentials;
    potentialFrame.enterPotential = controls.enterPotential;
    potentialFrame.useTextureCoordinates = controls.useTextureCoordinates;

    let mouseUse = false;
    let mouseAction = false;
    let mouseCount = 0;

    let potChanged = false;

    initializePotential('SHO');

    function changeBoundaries(s, t) {
        if (s === gl.REPEAT || t === gl.REPEAT) {
            if (pixelWidth !== 512 && pixelHeight !== 512) {
                setFrameDimensions(512, 512);
                controls.changeDimensions = '512x512';
                gridSelect.updateDisplay();
            }
        }
        viewFrame.setTexture(pixelWidth, pixelHeight, {s: s,
            t: t});
        unbind();
        let frames = [].concat(swapFrames, storeFrame, potentialFrame);
        for (let frame of frames) {
        frame.setTexture(pixelWidth, pixelHeight, {s: s,
                    t: t});
        frame.activateFramebuffer();
        unbind();
        initializePotential(controls.presetPotentials);
        }
    }
    boundariesSelect.onChange(e => {
        // List of the names of different boundary conditions:
        // Wikipedia contributors. (2021, March 7). 
        // Boundary value problem
        // https://en.wikipedia.org/wiki/Boundary_value_problem
        // #Types of boundary value problems#Examples
        console.log('update');
        if (e === 'Dirichlet') {
            controls.borderAlpha = 0.0;
            changeBoundaries(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        } else if (e === 'Neumann') {
            controls.borderAlpha = 1.0;
            changeBoundaries(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        } else if (e === 'Periodic') {
            controls.borderAlpha = 1.0;
            changeBoundaries(gl.REPEAT, gl.REPEAT);

        }
    });


    function setFrameDimensions(newWidth, newHeight) {
        document.getElementById('sketch-canvas').width = newWidth;
        document.getElementById('sketch-canvas').height = newHeight;
        width = (canvas.width/512)*64.0*Math.sqrt(2.0);
        height = (canvas.width/512)*64.0*Math.sqrt(2.0);
        scale = {w: canvasStyleWidth/canvas.width,
            h: canvasStyleHeight/canvas.height};
        pixelWidth = newWidth;
        pixelHeight = newHeight;
        showValues.w = width;
        showValues.h = height;
        boxW.updateDisplay();
        boxH.updateDisplay();

        gl.viewport(0, 0, pixelWidth, pixelHeight);
        // TODO if boundary is changed then changing the frame dimensions
        // causes the boundaries to go back to clamp_to_edge.
        // Change this behaviour.
        if (controls.borderAlpha === 0.0) {
            controls.boundaryType = 'Dirichlet';
            boundariesSelect.updateDisplay();
        }
        else if (controls.borderAlpha === 1.0) {
            controls.boundaryType = 'Neumann';
            boundariesSelect.updateDisplay();
        }
        viewFrame.setTexture(pixelWidth, pixelHeight, {s: gl.CLAMP_TO_EDGE,
                                                       t: gl.CLAMP_TO_EDGE});
        unbind();
        let frames = [].concat(swapFrames, storeFrame, 
                               potentialFrame, vectorFieldFrame);
        for (let frame of frames) {
            frame.setTexture(pixelWidth, pixelHeight, {s: gl.CLAMP_TO_EDGE,
                                                       t: gl.CLAMP_TO_EDGE});
            frame.activateFramebuffer();
            unbind();
        }
        initializePotential(controls.presetPotentials);
    }
    gridSelect.onChange(e => {
        xyDims = e.split('x');
        setFrameDimensions(parseInt(xyDims[0]), parseInt(xyDims[1]));

    });


    function getUnnormalizedProbDist() {
        storeFrame.useProgram(probDensityProgram);
        storeFrame.bind();
        storeFrame.setIntUniforms({tex1: swapFrames[t].frameNumber,
                                tex2: swapFrames[t-3].frameNumber,
                                tex3: swapFrames[t-2].frameNumber});
        draw();
        let probDensity = storeFrame.getTextureArray(
            {x: 0, y: 0, w: pixelWidth, h: pixelHeight});
        unbind();
        return probDensity;
    }

    function getProbCurrent() {
        storeFrame.useProgram(probCurrentProgram);
        storeFrame.bind();
        storeFrame.setFloatUniforms({dx: width/pixelWidth,
                                     dy: height/pixelHeight,
                                     w: width,
                                     h: height,
                                     hbar: 1.0,
                                     m: controls.m,
                                    });
        storeFrame.setIntUniforms({tex1: swapFrames[t].frameNumber,
                                   tex2: swapFrames[t-3].frameNumber,
                                   tex3: swapFrames[t-2].frameNumber});
        draw();
        let probCurrent = storeFrame.getTextureArray({x: 0, y: 0,
                                                      w: pixelWidth, 
                                                      h: pixelHeight});
        unbind();
        let vecs = [];
        let dst = 32;
        if (pixelWidth === 400 && pixelHeight === 400) dst = 25;
        let wSpacing = pixelWidth/dst, hSpacing = pixelHeight/dst;
        let hEnd = pixelHeight; // - hSpacing;
        let wEnd = pixelWidth; // - wSpacing;
        let count = 0;
        for (let i = hSpacing; i < hEnd; i += hSpacing) {
            for (let j = wSpacing; j < wEnd; j += wSpacing) {
                let vy = probCurrent[4*i*pixelHeight + 4*j]/60.0;
                let vx = probCurrent[4*i*pixelHeight + 4*j + 1]/60.0;
                if (vx*vx + vy*vy > 1e-9) {
                    let x = 2.0*i/pixelHeight - 1.0;
                    let y = 2.0*j/pixelWidth - 1.0;
                    let max_size = 0.05;
                    if (vx*vx + vy*vy > max_size*max_size) {
                        let norm = 1.0/Math.sqrt(vx*vx + vy*vy);
                        vx = vx*norm*max_size;
                        vy = vy*norm*max_size; 
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
        mouseControls.values.probabilityInBox = 
            `${Math.round(1000.0*reg/tot)/1000.0}`;
        mouseControls.widgets[1].updateDisplay();
        return reg/tot;
    }

    function logFPS() {
        if (showFPS) {
            let date = new Date();
            let time = date.getMilliseconds();
            let interval = (timeMilliseconds > time)?
                            1000 + time - timeMilliseconds:
                            time - timeMilliseconds;
            timeMilliseconds = time;
            console.clear();
            console.log(parseInt(1000/interval));
        }
    }

    function measurePosition() {
        if (controls.measure) {
            let probDensity = getUnnormalizedProbDist();
            notNormalizedTot = 0.0;
            for (let i = 0; i < probDensity.length/4; i++) {
                notNormalizedTot += probDensity[4*i];
            }
            console.log(notNormalizedTot);
            let randNum = Math.random()*notNormalizedTot;
            let j = 0;
            notNormalizedProb = 0;
            for (let i = 0; i < probDensity.length/4; i++) {
                notNormalizedProb += probDensity[4*i];
                if (randNum <= notNormalizedProb) {
                    j = i;
                    break;
                }
            }
            let v = j/pixelHeight;
            let u = j%pixelHeight;
            unbind();
            controls.measure = false;
            swapFrames[t-3].useProgram(initialWaveProgram);
            swapFrames[t-3].bind();
            swapFrames[t-3].setFloatUniforms({dx: 1.0/pixelWidth,
                                              dy: 1.0/pixelHeight,
                                              px: 0.0, py: 0.0,
                                              amp: 37.5,
                                              sx: 4.0/pixelWidth,
                                              sy: 4.0/pixelHeight,
                                              bx: u/canvas.width,
                                              by: v/canvas.height,
                                              borderAlpha: controls.borderAlpha});
            draw();
            unbind();
            swapFrames[t-2].useProgram(imagTimeStepProgram);
            swapFrames[t-2].bind();
            swapFrames[t-2].setFloatUniforms({dx: width/pixelWidth,
                                                dy: height/pixelHeight,
                                                dt: controls.dt/2.0,
                                                w: width, h: height,
                                                m: controls.m, hbar: 1.0});
            swapFrames[t-2].setIntUniforms({texPsi: swapFrames[t-3].frameNumber,
                                            texV: potentialFrame.frameNumber,
                                            laplacePoints: controls.laplaceVal});
            draw();
            unbind();
        }
    }

    function initializePotential(type) {
        // Possible presets:
        // 10 - inversesqrt(4*(x-0.5)*(x-0.5) + 4*(y-0.5)*(y-0.5))
        // -20*(x-0.5) + 20.0*circle(x,y,0.6,0.5,0.01)
        for (let e of presetControlsFolder.controls) {
            e.remove();
        }
        presetControlsFolder.controls = [];
        if (type === 'SHO') {
            let f = (a) => {
                potentialFrame.useProgram(initPotentialProgram);
                potentialFrame.bind();
                potentialFrame.setFloatUniforms({a: a});
                potentialFrame.setIntUniforms({potentialType: 1});
                draw();
                unbind();
            };
            f(20.0);
            let items = {a: 20.0};
            let aVar = presetControlsFolder.add(items,
                                                'a', 0.0, 40.0).name('Strength');
            aVar.onChange(f);
            presetControlsFolder.controls.push(aVar);
            mouseAction = true;
            controls.bx = pixelWidth/2;
            controls.by = pixelHeight*0.75;
            controls.py = 0.0;
            controls.px = ((Math.random() > 0.5)? -1.0: 1.0)*30.0/controls.scaleP;
            controls.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();

        } else if (type == 'Double Slit') {
            let doubleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.46, x2: 0.54,
                                      spacing: 0.02, a: 30.0};
            let f = (doubleSlitUniforms) => {
                potentialFrame.useProgram(initPotentialProgram);
                potentialFrame.bind();
                potentialFrame.setFloatUniforms(doubleSlitUniforms);
                potentialFrame.setIntUniforms({potentialType: 2});
                draw();
                unbind();
            };
            f(doubleSlitUniforms);
            for (let e of Object.keys(doubleSlitUniforms)) {
                let minVal, maxVal, name;
                if (e === 'a') {
                    minVal = 0.0; maxVal = 36.0; name = 'Energy';
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
                    f(doubleSlitUniforms);
                });
                presetControlsFolder.controls.push(slider);
            }
            mouseAction = true;
            controls.bx = pixelWidth/2;
            controls.by = pixelHeight*0.75;
            controls.py = 40.0/controls.scaleP;
            controls.px = 0.0;
            controls.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();

        } else if (type == 'Single Slit') {
            let singleSlitUniforms = {y0: 0.45, w: 0.01, x1: 0.5,
                                      spacing: 0.02, a: 30.0};
            let f = (singleSlitUniforms) => {
                potentialFrame.useProgram(initPotentialProgram);
                potentialFrame.bind();
                potentialFrame.setFloatUniforms(singleSlitUniforms);
                potentialFrame.setIntUniforms({potentialType: 3});
                draw();
                unbind();
            };
            f(singleSlitUniforms);
            for (let e of Object.keys(singleSlitUniforms)) {
                let minVal, maxVal, name;
                if (e === 'a') {
                    minVal = 0.0; maxVal = 36.0; name = 'Energy';
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
                    f(singleSlitUniforms);
                });
                presetControlsFolder.controls.push(slider);
            }
            mouseAction = true;
            controls.bx = pixelWidth/2;
            controls.by = pixelHeight*0.75;
            controls.py = 40.0/controls.scaleP;
            controls.px = 0.0;
            controls.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        } else if (type == 'Step') {
            let stepUniforms = {y0: 0.5, a: 4.0};
            let f = (stepUniforms) => {
                potentialFrame.useProgram(initPotentialProgram);
                potentialFrame.bind();
                potentialFrame.setFloatUniforms(stepUniforms);
                potentialFrame.setIntUniforms({potentialType: 4});
                draw();
                unbind();
            };
            f(stepUniforms);
            let aSlider = presetControlsFolder.add(
                stepUniforms, 'a', 0.0, 10.0
            ).step(0.1).name('Energy');
            aSlider.onChange(val => {
                stepUniforms['a'] = val;
                f(stepUniforms);
            });
            let y0Slider = presetControlsFolder.add(
                stepUniforms, 'y0', 0.25, 0.75
            );
            y0Slider.onChange(val => {
                stepUniforms['y0'] = val;
                f(stepUniforms);
            });
            presetControlsFolder.controls.push(y0Slider);
            mouseAction = true;
            controls.bx = pixelWidth/2;
            controls.by = pixelHeight*0.75;
            controls.py = 40.0/controls.scaleP;
            controls.px = 0.0;
            controls.mouseMode = 'new ψ(x, y)';
            presetControlsFolder.controls.push(aSlider);
            mouseMode.updateDisplay();
        } else {
            potentialFrame.useProgram(initPotentialProgram);
            potentialFrame.bind();
            if (type == 'Spike') {
                potentialFrame.setIntUniforms({potentialType: 5});
                controls.bx = pixelWidth/2;
                controls.by = pixelHeight*0.75;
                controls.py = 40.0/controls.scaleP;
                controls.px = 0.0;
            } else if (type == 'Triple Slit') {
                potentialFrame.setIntUniforms({potentialType: 6});
                controls.bx = pixelWidth/2;
                controls.by = pixelHeight*0.75;
                controls.py = 40.0/controls.scaleP;
                controls.px = 0.0;
            } else {
                potentialFrame.setIntUniforms({potentialType: 8});
                controls.bx = pixelWidth/3;
                controls.by = pixelHeight*0.75;
                controls.py = 30.0/controls.scaleP;
                controls.px = -((Math.random() > 0.5)? -1.0: 1.0)*
                                30.0/controls.scaleP;
            }
            draw();
            unbind();
            mouseAction = true;
            controls.mouseMode = 'new ψ(x, y)';
            mouseMode.updateDisplay();
        }
        mouseControls.close();
        mouseControlsCallback('new ψ(x, y)');
        // mouseControls.updateDisplay();
    }

    let reshapePotentialRecLevel = 0;
    function reshapePotential(controls) {
        let drawWidth = mouseControls.values.width*canvas.width;
        if (mouseCount > 1 && mouseControls.values.width > 0.0 && 
            (Math.abs(controls.px) > drawWidth ||
             Math.abs(controls.py) > drawWidth)) {
            reshapePotentialRecLevel += 1;
            if (reshapePotentialRecLevel > 100) {
                reshapePotentialRecLevel = 0;
            } else {
                let newControls = Object.create(controls);
                let dist = Math.sqrt(controls.px**2 + controls.py**2);
                let dx = drawWidth*controls.px/dist;
                let dy = drawWidth*controls.py/dist;
                newControls.px -= dx;
                newControls.py -= dy;
                console.log('dx', dx);
                console.log('by', newControls.by, 'px', newControls.px);
                newControls.bx -= dx;
                newControls.by += dy;
                reshapePotential(newControls);
            }
        }
        storeFrame.useProgram(shapePotentialProgram);
        storeFrame.bind();
        console.log(mouseControls.values.v2);
        storeFrame.setFloatUniforms({bx: controls.bx/canvas.width,
                                     by: 1.0 - controls.by/canvas.height,
                                     v2: mouseControls.values.v2,
                                     drawWidth:
                                     mouseControls.values.width});
        storeFrame.setIntUniforms({tex1: potentialFrame.frameNumber,
                                   drawMode:
                                   mouseControls.values.stencilType,
                                    eraseMode: mouseControls.values.erase});
        draw();
        unbind();
        potentialFrame.useProgram(copyToProgram);
        potentialFrame.bind();
        potentialFrame.setIntUniforms({tex1: storeFrame.frameNumber,
                                       tex2: nullTexNumber});
        draw();
        unbind();
        rScaleV = 0.5;
    }

    function createNewWave() {
        let px = (!mouseControls.values.fixInitialP)?
                  controls.scaleP*controls.px: mouseControls.values.px0;
        let py = (!mouseControls.values.fixInitialP)?
                  controls.scaleP*controls.py: mouseControls.values.py0;
        let sigma = mouseControls.values.sigma;
        console.log(mouseControls.values.sigma)
        // console.log(px, py);
        swapFrames[t-3].useProgram(initialWaveProgram);
        swapFrames[t-3].bind();
        swapFrames[t-3].setFloatUniforms({dx: 1.0/pixelWidth,
                                            dy: 1.0/pixelHeight,
                                            px: px,
                                            py: py,
                                            amp: 5.0*30.0/(sigma*512.0),
                                            sx: (sigma*512.0)/pixelWidth,
                                            sy: (sigma*512.0)/pixelHeight,
                                            bx: controls.bx/canvas.width,
                                            by: 1.0 - controls.by/canvas.height,
                                            borderAlpha: controls.borderAlpha});
        draw();
        unbind();
        swapFrames[t-2].useProgram(imagTimeStepProgram);
        swapFrames[t-2].bind();
        swapFrames[t-2].setFloatUniforms({dx: width/pixelWidth,
                                          dy: height/pixelHeight,
                                          dt: controls.dt/2.0,
                                          w: width, h: height, m: controls.m,
                                          hbar: 1.0});
        swapFrames[t-2].setIntUniforms({texPsi: swapFrames[t-3].frameNumber,
            texV: potentialFrame.frameNumber, laplacePoints: controls.laplaceVal});
        draw();
        unbind();
    }

    function timeStepWave() {
        let dt = controls.dt;
        if (potChanged) {
            dt = controls.dt/2.0;
            potChanged = false;
        }
        swapFrames[t-1].useProgram(realTimeStepProgram);
        swapFrames[t-1].bind();
        swapFrames[t-1].setFloatUniforms({dx: width/pixelWidth,
                                          dy: height/pixelHeight,
                                          dt: controls.dt, w: width, h: height,
                                          m: controls.m, hbar: 1.0,
                                        rScaleV: rScaleV});
        swapFrames[t-1].setIntUniforms({texPsi: swapFrames[t-2].frameNumber,
                                        texV: potentialFrame.frameNumber,
                                        laplacePoints: controls.laplaceVal});
        draw();
        rScaleV = 0.0;
        unbind();
        swapFrames[t].useProgram(imagTimeStepProgram);
        swapFrames[t].bind();
        swapFrames[t].setFloatUniforms({dx: width/pixelWidth,
                                        dy: height/pixelHeight,
                                        dt: controls.dt, w: width, h: height,
                                        m: controls.m, hbar: 1.0});
        swapFrames[t].setIntUniforms({texPsi: swapFrames[t-1].frameNumber,
                                      texV: potentialFrame.frameNumber,
                                      laplacePoints: controls.laplaceVal});
        draw();
        unbind();
    }

    function display() {
        const DISPLAY_ONLY_PROB_DENSITY = 0;
        const DISPLAY_PHASE = 1;
        const DISPLAY_CURRENT_WITH_PROB = 2
        const DISPLAY_CURRENT_WITH_PHASE = 3;
        let intUniforms = {tex1: swapFrames[t].frameNumber,
                           tex2: swapFrames[t-3].frameNumber,
                           tex3: swapFrames[t-2].frameNumber,
                           texV: potentialFrame.frameNumber,
                           displayMode: DISPLAY_PHASE};
        if (!controls.colourPhase) {
            intUniforms['displayMode'] = DISPLAY_ONLY_PROB_DENSITY;
        }
        if (controls.viewProbCurrent) {
            getProbCurrent(showLines=true);
            let displayMode = (controls.colourPhase)?
                                DISPLAY_CURRENT_WITH_PHASE:
                                DISPLAY_CURRENT_WITH_PROB;
            intUniforms['displayMode'] = displayMode;
            let tex = vectorFieldFrame.frameNumber;
            intUniforms['vecTex'] = tex;
        }
        viewFrame.useProgram(displayProgram);
        viewFrame.bind();
        viewFrame.setIntUniforms(intUniforms);
        viewFrame.setVec3Uniforms({probColour: controls.probColour,
                                   potColour: controls.potColour});
        if (controls.mouseMode[0] == 'p') {
            viewFrame.setFloatUniforms({
                x0: drawRect.x/pixelWidth,
                y0: (pixelHeight - drawRect.y)/pixelHeight,
                w: drawRect.w/pixelWidth,
                h: -drawRect.h/pixelHeight,
                lineWidth: 0.002,
                brightness: controls.brightness,
                brightness2: controls.brightness2
            });
        } else {
            viewFrame.setFloatUniforms({lineWidth: 0.0,
                                         brightness: controls.brightness,
                                         brightness2: controls.brightness2});
        }
        draw();
        unbind();
        if (controls.mouseMode[0] == 'p') {
            let prob = getUnnormalizedProbDist();
            let j0 = pixelHeight - drawRect.y;
            let h = -drawRect.h;
            let i0 = (drawRect.w < 0.0)? drawRect.x + drawRect.w: drawRect.x;
            j0 = (h < 0.0)? j0 + h: j0;
            let w = (drawRect.w < 0.0)? -drawRect.w: drawRect.w;
            h = (h < 0.0)? -h: h;
            let reg = getProbInRegion(prob, i0, j0, w, h);
            // console.log(reg);
        }
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    function onPotentialChange() {
        if (controls.presetPotentials !== potentialFrame.presetPotentials) {
            potentialFrame.presetPotentials = controls.presetPotentials;
            initializePotential(controls.presetPotentials);
            potChanged = true;
            // rScaleV = 0.5;
            return;
        }
        if ((controls.enterPotential !== potentialFrame.enterPotential) ||
           (controls.useTextureCoordinates !==
            potentialFrame.useTextureCoordinates)) {
            for (let e of textEditSubFolder.controls) {
                e.remove();
            }
            textEditSubFolder.controls = [];
            if (textEditSubFolder.closed) {
                textEditSubFolder.open();
            }

            potentialFrame.useTextureCoordinates =
                                                controls.useTextureCoordinates;
            potentialFrame.enterPotential = controls.enterPotential;
            let expr = potentialFrame.enterPotential;
            if (expr.includes('^') || expr.includes('**')) {
                expr = powerOpsToCallables(expr, false);
            }
            expr = replaceIntsToFloats(expr);
            console.log(expr);
            let uniforms = getVariables(expr);
            uniforms.delete('x');
            uniforms.delete('y');
            console.log(uniforms);
            let shader = createFunctionShader(expr, uniforms);
            if (shader === null) {
                return;
            }
            let program = makeProgram(vShader, shader);
            storeFrame.useProgram(program);
            storeFrame.bind();
            if (controls.useTextureCoordinates) {
                floatUniforms = {xScale: 1.0, yScale: 1.0};
            } else {
                floatUniforms = {xScale: width, yScale: height};
            }

            let f = (uniforms) => {
                if (controls.useTextureCoordinates) {
                    floatUniforms = {xScale: 1.0, yScale: 1.0};
                } else {
                    floatUniforms = {xScale: width, yScale: height};
                }
                for (let e of Object.keys(floatUniforms)) {
                    uniforms[e] = floatUniforms[e];
                }
                storeFrame.useProgram(program);
                storeFrame.bind();
                storeFrame.setFloatUniforms(uniforms);
                storeFrame.setIntUniforms({prevV: potentialFrame.frameNumber});
                draw();
                unbind();
                potentialFrame.useProgram(copyToProgram);
                potentialFrame.bind();
                potentialFrame.setIntUniforms({tex1: storeFrame.frameNumber,
                                               tex2: nullTexNumber});
                draw();
                unbind();
                potChanged = true;
                rScaleV = 0.5;
            };
            console.log(uniforms);
            let uniformsObj = {};
            for (let u of uniforms) {
                uniformsObj[u] = 0.0;
            }
            for (let e of uniforms) {
                console.log(e);
                let slider = textEditSubFolder.add(
                    uniformsObj, e,
                    0.0, 10.0
                );
                slider.onChange(val => {
                    uniformsObj[e] = val;
                    f(uniformsObj);
                });
                textEditSubFolder.controls.push(slider);
            }

            for (let u of uniforms) {
                floatUniforms[u] = 1.0;
            }

            storeFrame.setFloatUniforms(floatUniforms);
            storeFrame.setIntUniforms({prevV: potentialFrame.frameNumber});
            draw();
            unbind();
            potentialFrame.useProgram(copyToProgram);
            potentialFrame.bind();
            potentialFrame.setIntUniforms({tex1: storeFrame.frameNumber,
                                           tex2: nullTexNumber});
            draw();
            unbind();
            potChanged = true;
            rScaleV = 0.5;
        }

    }

    function animate() {
        stats.begin();
        onPotentialChange();
        if (mouseAction) {
            if (controls.mouseMode[0] === 'n') {
                createNewWave();
            } else if ((controls.mouseMode[0] === SKETCH_BARRIER ||
                        controls.mouseMode[0] === ERASE_BARRIER) ){
                reshapePotential(controls);
            } else {
                drawRect.w = controls.bx - drawRect.x;
                drawRect.h = controls.by - drawRect.y;
            }
            mouseAction = false;
        }
        for (let i = 0; i < controls.speed; i++) {
            timeStepWave();
            rScaleV = 0.0;
            swap();
        }
        logFPS();
        display();
        measurePosition();
        stats.end();
        requestAnimationFrame(animate);
    }

    let mousePos = function(ev, mode) {
        if (mode == 'move') {
            mouseCount++;
            let prevBx = controls.bx;
            let prevBy = controls.by;
            controls.bx = Math.floor((ev.clientX 
                                      - canvas.offsetLeft))/scale.w;
            controls.by = Math.floor((ev.clientY - canvas.offsetTop))/scale.h;
            controls.px = parseInt(controls.bx - prevBx);
            if (Math.abs(controls.px) > 50.0/controls.scaleP) {
                controls.px = Math.sign(controls.px)*50.0/controls.scaleP;
            }
            controls.py = -parseInt(controls.by - prevBy);
            if (Math.abs(controls.py) > 50.0/controls.scaleP) {
                controls.py = Math.sign(controls.py)*50.0/controls.scaleP;
            }
        }
        if (mouseUse) {
            if (controls.bx < canvas.width && controls.by < canvas.height &&
                controls.bx >= 0 && controls.by >= 0) mouseAction = true;
        }
    };
    canvas.addEventListener("touchstart", ev => {
        mouseUse = true;
        let touches = ev.changedTouches;
        let mouseEv = {clientX: touches[0].pageX, clientY: touches[0].pageY};
        drawRect.w = 0;
        drawRect.h = 0;
        drawRect.x = Math.floor((mouseEv.clientX - canvas.offsetLeft))/scale.w;
        drawRect.y = Math.floor((mouseEv.clientY - canvas.offsetTop))/scale.h;
        mousePos(mouseEv, 'move');
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
        mouseCount = 0;
        mouseUse = false;
    });
    canvas.addEventListener("mouseup", ev => {
        mousePos(ev, 'up');
        mouseCount = 0;
        mouseUse = false;
    });
    canvas.addEventListener("mousedown", ev => {
        mouseUse = true;
        drawRect.w = 0;
        drawRect.h = 0;
        drawRect.x = Math.floor((ev.clientX - canvas.offsetLeft))/scale.w;
        drawRect.y = Math.floor((ev.clientY - canvas.offsetTop))/scale.h;
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

    mouseControlsCallback(controls.mouseMode);
    animate();
}
