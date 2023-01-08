
function mouseControlsCallback(e) {
    let mouseControls = guiControls.mouseControls;
    if (e[0] === guiData.mouseData.NEW_PSI) {
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
        let pxVal = parseInt(40.0*canvas.width/512.0);
        let pyVal = parseInt(40.0*canvas.height/512.0);
        let px0 = mouseControls.add(items, 'px0', -pxVal, pxVal).name('kx');
        let py0 = mouseControls.add(items, 'py0', -pyVal, pyVal).name('ky');
        mouseControls.widgets.push(name);
        mouseControls.widgets.push(fixInitialP);
        mouseControls.widgets.push(sigma);
        mouseControls.widgets.push(px0);
        mouseControls.widgets.push(py0);

    } else if (e[0] === guiData.mouseData.SKETCH_BARRIER || 
              e[0] === guiData.mouseData.ERASE_BARRIER) {
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
        if (e[0] === guiData.mouseData.SKETCH_BARRIER) {
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
        if (e[0] === guiData.mouseData.SKETCH_BARRIER) 
            mouseControls.widgets.push(vControl);
    } else if (e[0] === guiData.mouseData.PROB_IN_BOX) {
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
guiControls.mouseMode.onChange(mouseControlsCallback);


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
guiControls.recordVideoFolder.add(
    {'func': finishRecordingVideo}, 'func').name('Finish');

function textEditNonlinearFuncSplitOperator(view) {
    textEditNonlinearFunc(view, 0);    
}

function textEditNonlinearFuncLeapfrog(view) {
    textEditNonlinearFunc(view, 1);    
}

function textEditNonlinearFunc(view, simType) {
    let expr = guiData.enterNonlinear;
    if (expr.includes('^') || expr.includes('**')) {
        expr = powerOpsToCallables(expr, false);
    }
    expr = replaceIntsToFloats(expr);
    if (expr === guiData.enterNonlinearExpr) return;
    guiData.enterNonlinearExpr = expr;
    for (let e of guiControls.textEditSubFolder.controls) {
        console.log(e);
        e.remove();
    }
    guiControls.textEditSubFolder.controls = [];
    let uniforms = getVariables(expr);
    uniforms.delete('u');
    let shader;
    if (simType === 0) {
        shader = createNonlinearExpPotentialShader(expr, uniforms);
    } else {
        shader = createNonlinearLeapfrogShader(expr, uniforms); 
    }
    if (shader === null) {
        console.log('Failed to create shader.');
        return;
    }
    let program = makeProgram(vShader, shader);

    let f = (uniforms) => {
        try {
            view.nonlinear(program, uniforms);
        } catch (e) {
            return;
        }
        guiData.potChanged = true;
    };
    let newUniformVals = {};
    for (let u of uniforms) {
        newUniformVals[u] = 1.0;
    }
    f(newUniformVals);
    for (let e of uniforms) {
        let slider = guiControls.textEditNonlinearSubFolder.add(
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

function onUploadImage() {
    let im = document.getElementById("image");
    im.file = this.files[0];
    guiData.imageName = im.file.name;
    guiControls.imageNameWidget.updateDisplay();
    const reader = new FileReader();
    reader.onload = e => im.src = e.target.result;
    reader.readAsDataURL(this.files[0]);
}
guiControls.uploadImage.addEventListener("change", onUploadImage, false);

function makeImageFilename(userDefinedImageName, num, total) {
    // let time = Date.now();
    let numStr = `${num + 1}`, totalStr = `${total}`;
    let numZeros = totalStr.length - numStr.length;
    for (let i = 0; i < numZeros; i++) {
        numStr = '0' + numStr;
    }
    console.log(userDefinedImageName);
    return `${userDefinedImageName}${numStr}.png`;
}


function handleRecording(canvas) {
    if (guiData.takeScreenshot) {
        let zipSize = Math.floor(guiData.nScreenshots/15);
        if (zipSize <= 50) zipSize = 50;
        guiData.screenshots.push(canvas.toDataURL('image/png', 1));
        let name = makeImageFilename(guiData.userDefinedImageName,
                                     guiData.screenshotCount, 
                                     guiData.nScreenshots);
        guiData.screenshotNames.push(name);
        guiData.screenshotCount++;
        guiControls.screenshotProgress.setValue(
            `Recording: ${guiData.screenshotCount}/${guiData.nScreenshots}`);
        if (guiData.screenshotCount === guiData.nScreenshots) {
            // guiControls.screenshotProgress.setValue(
            //      `Handling zip file(s)...`);
            let p = downloadScreenshotsZip(guiData.screenshots, 
                guiData.screenshotNames).then(() => {
                    // div.innerHTML = '';
                    guiControls.screenshotProgress.setValue('');
                });
            if (guiData.pauseOnFinish) {
                guiData.speed = 0;
                guiControls.iter.updateDisplay();
            }
            guiData.screenshotCount = 0;
            guiData.takeScreenshot = false;
            return p;
        }
        if (guiData.screenshotCount > 0 && 
            guiData.screenshotCount % zipSize === 0) {
            let screenshots = [];
            let screenshotNames = [];
            for (let i = 0; i < zipSize ; i++) {
                screenshots.push(guiData.screenshots.pop());
                screenshotNames.push(guiData.screenshotNames.pop());
            }
            return downloadScreenshotsZip(screenshots, screenshotNames);
        }
    }
    if (guiData.recordVideo) {
        if (guiData.mediaRecorder === null || 
            guiData.mediaRecorder.state === 'inactive') {
            let stream = canvas.captureStream();
            let dimensions = guiData.changeDimensions.split('x');
            let width = parseInt(dimensions[0]);
            let height = parseInt(dimensions[1]);
            let options = {bitsPerSecond: parseInt(60*width*height*8/4.0)};
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
    return Promise.resolve();
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

function addLaplacianControls(options) {
    guiControls.laplaceFolder
        = guiControls.intMethod.addFolder('Discrete Laplacian');
    guiControls.laplaceSelect
         = guiControls.laplaceFolder.add(guiData, 'laplace', 
                                     options).name('Stencil');
    guiControls.laplaceSelect.onChange(e => {
        let val = parseInt(e.split(' ')[0]);
        if (e == '9 pt. 4th or.') val++;
        guiData.laplaceVal = val;
    });
    guiControls.laplaceSelect.setValue(options[0]);
    guiControls.laplaceSelect.updateDisplay();
}

function removeLaplacianControls() {
    if (guiControls.laplaceFolder !== null && 
        guiControls.laplaceSelect !== null) {
        guiControls.laplaceFolder.remove(guiControls.laplaceSelect);
        guiControls.intMethod.removeFolder(guiControls.laplaceFolder);
        guiControls.laplaceSelect = null;
        guiControls.laplaceFolder = null;
    }
}

function addIterationsControls() {
    guiControls.iterations
        = guiControls.intMethod.add(
            guiData, 'iterations', 3, 20, 1).name('Min. Iter.');
    guiControls.assessConvergence = guiControls.intMethod.add(
        guiData, 'assessConvergence'
    ).name('Check Conv.');
    guiControls.setTol = guiControls.intMethod.add(
        guiData, 'toleranceString').name('Tolerance');
    guiControls.setTol.onChange(e => {
        num = parseFloat(e);
        if (num >= 5e-8) {
            guiData.tolerance = parseFloat(e);
        }
    });
}

function removeIterationControls() {
    if (guiControls.iterations !== null &&
        guiControls.assessConvergence !== null) {
        guiControls.intMethod.remove(guiControls.iterations);
        guiControls.intMethod.remove(guiControls.assessConvergence);
        guiControls.intMethod.remove(guiControls.setTol);
        guiControls.iterations = null;
        guiControls.assessConvergence = null;
        guiControls.setTol = null;
    }
}

function addNonlinearControls() {
    guiControls.textEditNonlinear
            = guiControls.intMethod.addFolder('Nonlinear Terms');
    // guiControls.textEditNonlinear
    //     = guiControls.moreControlsFolder.addFolder('Nonlinear Terms');
    guiControls.textEditNonlinearEntry
        = guiControls.textEditNonlinear.add(guiData, 'enterNonlinear'
                                            ).name('Enter terms');
    guiControls.textEditNonlinearSubFolder
        = guiControls.textEditNonlinear.addFolder('Edit Variables');
    guiControls.textEditNonlinearSubFolder.controls = [];
}
// guiControls.addNonlinearControls = addNonlinearControls;

function addNonlinearNonlocalControls(sim) {
    guiControls.textEditNonlocal
        = guiControls.intMethod.addFolder('Nonlocal Int.');
    guiControls.useNonlocal
        = guiControls.textEditNonlocal.add(
            guiData, 'useNonlocal').name('Use nonlocal');
    guiControls.useNonlocal.onChange(e => {
        sim.nonlinearNonlocal({
            strength: guiData.nonlocalInteractionStrength,
            nIter: guiData.nonlocalPoissonJacobiIterations,
            use: e
        });
    });
    guiControls.nonlocalStrength
        = guiControls.textEditNonlocal.add(
            guiData, 'nonlocalInteractionStrength', -1.0, 1.0
        ).name('Strength');
    guiControls.nonlocalStrength.onChange(val => {
        sim.nonlinearNonlocal({
            strength: val,
            nIter: guiData.nonlocalPoissonJacobiIterations,
            use: guiData.useNonlocal
        });
    });
}


function removeNonlinearControls() {
    if (guiControls.textEditNonlinear !== null &&
        guiControls.textEditNonlinearEntry !== null &&
        guiControls.textEditNonlinearSubFolder !== null) {
        for (let e of guiControls.textEditNonlinearSubFolder.controls) {
            e.remove();
        }
        guiControls.textEditNonlinear.removeFolder(
            guiControls.textEditNonlinearSubFolder);
        guiControls.textEditNonlinear.remove(
            guiControls.textEditNonlinearEntry);
        guiControls.intMethod.removeFolder(guiControls.textEditNonlinear);
        guiControls.textEditNonlinearSubFolder = null;
        guiControls.textEditNonlinearEntry = null;
        guiControls.textEditNonlinear = null;
    }
}

// guiControls.removeNonlinearControls = removeNonlinearControls;

function removeNonlinearNonlocalControls() {
    if (guiControls.textEditNonlocal !== null && 
        guiControls.useNonlocal !== null &&
        guiControls.nonlocalStrength !== null) {
        guiControls.textEditNonlocal.remove(
            guiControls.useNonlocal
        );
        guiControls.textEditNonlocal.remove(
            guiControls.nonlocalStrength
        );
        guiControls.intMethod.removeFolder(
            guiControls.textEditNonlocal
        );
        guiControls.textEditNonlocal = null; 
        guiControls.useNonlocal = null;
        guiControls.nonlocalStrength = null; 
    }
}

function isSmallEndian() {
    let val = 23424;
    let a = new ArrayBuffer(4);
    let view = new DataView(a);
    view.setInt32(0, val);
    return !(a[0] === val)
}

function serializeWavefunc(sim) {
    let wavefuncArrays = sim.getWavefunctionArrays();
    let n = wavefuncArrays.length;
    let time = Date.now();
    let aTag = document.createElement('a');
    aTag.hidden = true;
    let endian = isSmallEndian(); 
    let headerLength = 32; 
    let headerBuf = new ArrayBuffer(headerLength);
    let headerView = new DataView(headerBuf);
    let headerTxt = `QMSim2D w${n}`;
    for (let i = 0; i < headerLength; i++) {
        if (i < headerTxt.length) 
            headerView.setUint8(i, headerTxt[i].charCodeAt(0), endian);
    }
    headerView.setUint32(12, pixelWidth, endian);
    headerView.setUint32(16, pixelHeight, endian);
    headerView.setFloat32(20, guiData.dt, endian);
    headerView.setFloat32(24, guiData.m, endian);
    headerView.setFloat32(28, guiData.hbar, endian);
    let sizeofFloat = 4;
    let wh = pixelWidth*pixelHeight;
    let buf = new ArrayBuffer(n*2*sizeofFloat*wh);
    let view = new DataView(buf);
    for (let k = 0; k < n; k++) {
        for (let i = 0; i < wh; i++) {
            let re = wavefuncArrays[k][4*i];
            let im = wavefuncArrays[k][4*i + 1];
            view.setFloat32(2*sizeofFloat*i + 2*k*sizeofFloat*wh,
                            re, endian);
            view.setFloat32(sizeofFloat*(2*i + 1) + 2*k*sizeofFloat*wh,
                            im, endian);                
        }
    }
    let blob = new Blob([headerBuf, buf], {type: "octet/stream"});
    let url = URL.createObjectURL(blob);
    aTag.href = url;
    aTag.download = `wavefunc_${time}.dat`;
    aTag.click();
}

function serializePotential(sim) {
    let potential = sim.getPotentialArray();
    let time = Date.now();
    let aTag = document.createElement('a');
    aTag.hidden = true;
    let endian = isSmallEndian(); 
    let headerLength = 32; 
    let headerBuf = new ArrayBuffer(headerLength);
    let headerView = new DataView(headerBuf);
    let n = 0;
    let headerTxt = `QMSim2D p${n}`;
    for (let i = 0; i < headerLength; i++) {
        if (i < headerTxt.length) 
            headerView.setUint8(i, headerTxt[i].charCodeAt(0), endian);
    }
    headerView.setUint32(12, pixelWidth, endian);
    headerView.setUint32(16, pixelHeight, endian);
    headerView.setFloat32(20, guiData.dt, endian);
    headerView.setFloat32(24, guiData.m, endian);
    headerView.setFloat32(28, guiData.hbar, endian);
    let buf = new ArrayBuffer(pixelHeight*pixelWidth*4);
    let view = new DataView(buf);
    for (let i = 0; i < pixelWidth*pixelHeight; i++) {
        view.setFloat32(i*4, potential[4*i], endian);
    }
    let blob = new Blob([headerBuf, buf], {type: "octet/stream"});
    let url = URL.createObjectURL(blob);
    aTag.href = url;
    aTag.download = `potential_${time}.dat`;
    aTag.click();
}

function serializePotentialAndWavefunction(sim) {
    let wavefuncArrays = sim.getWavefunctionArrays();
    let potential = sim.getPotentialArray();
    let n = wavefuncArrays.length;
    let time = Date.now();
    let aTag = document.createElement('a');
    aTag.hidden = true;
    let endian = isSmallEndian(); 
    let headerLength = 32; 
    let headerBuf = new ArrayBuffer(headerLength);
    let headerView = new DataView(headerBuf);
    let headerTxt = `QMSim2D b${n}`;
    for (let i = 0; i < headerLength; i++) {
        if (i < headerTxt.length) 
            headerView.setUint8(i, headerTxt[i].charCodeAt(0), endian);
    }
    headerView.setUint32(12, pixelWidth, endian);
    headerView.setUint32(16, pixelHeight, endian);
    headerView.setFloat32(20, guiData.dt, endian);
    headerView.setFloat32(24, guiData.m, endian);
    headerView.setFloat32(28, guiData.hbar, endian);
    let sizeofFloat = 4;
    let wh = pixelWidth*pixelHeight;
    let buf = new ArrayBuffer((1 + 2*n)*sizeofFloat*wh);
    let view = new DataView(buf);
    for (let i = 0; i < wh; i++) {
        view.setFloat32(i*sizeofFloat, potential[4*i], endian);
    }
    for (let k = 0; k < n; k++) {
        for (let i = 0; i < wh; i++) {
            let re = wavefuncArrays[k][4*i];
            let im = wavefuncArrays[k][4*i + 1];
            view.setFloat32(sizeofFloat*(2*i + 2*k*wh + wh),
                            re, endian);
            view.setFloat32(sizeofFloat*(1 + 2*i + 2*k*wh + wh),
                            im, endian);                
        }
    }
    let blob = new Blob([headerBuf, buf], {type: "octet/stream"});
    let url = URL.createObjectURL(blob);
    aTag.href = url;
    aTag.download = `wavefunc_potential_${time}.dat`;
    aTag.click();
}

function readDataHeader(view, endian) {
    let headerString = '';
    let headerLength = 12;
    for (let i = 0; i < headerLength; i++) {
        if (view.getUint8(i) !== 0) {
            headerString += String.fromCharCode(view.getUint8(i));
        }
    }
    let headerStringSplit = headerString.split(' ');
    if (headerStringSplit.length !== 2) return null;
    if (headerStringSplit[0] !== 'QMSim2D') return null;
    let type = headerStringSplit[1][0];
    let n = parseInt(headerStringSplit[1][1]);
    let width = view.getUint32(12, endian);
    let height = view.getUint32(16, endian);
    let dt = view.getFloat32(20, endian);
    let m = view.getFloat32(24, endian);
    let hbar = view.getFloat32(28, endian);
    return {type: type, n: n, 
            width: width, height: height, 
            dt: dt, m: m, hbar: hbar};
}

function loadBinaryDataToSim(params) {
    let sim = params.sims[0];
    let file = params.file;
    let setFrameDimensions = params.setFrameDimensions;
    const reader = new FileReader();
    let endian = isSmallEndian();
    reader.onload = e => {
        let buf = e.target.result;
        let view = new DataView(buf);
        let headerData = readDataHeader(view, endian);
        let n = headerData.n;
        let w = headerData.width;
        let h = headerData.height;
        let wh = w*h;
        let dt = headerData.dt;
        let m = headerData.m;
        let hbar = headerData.hbar;
        let useTimeout = false;
        let sizeofFloat = 4;
        let headerLength = 32;
        if (w !== pixelWidth || h !== pixelHeight) {
            sim = setFrameDimensions(w, h);
            guiData.changeDimensions = `${w}x${h}`;
            guiControls.gridSelect.updateDisplay();
            useTimeout = true;
        }
        if (dt !== guiData.dt) {
            if (Math.abs(dt) < guiData.dtMax) {
                guiData.dt = dt;
                guiControls.dtSlider.updateDisplay();
            }
        }
        if (m !== guiData.m) {
            guiData.m = m;
            guiControls.massSlider.updateDisplay();
        }
        if (hbar !== guiData.hbar) {
            guiData.hbar = hbar;
        }
        if (headerData.type === 'w') {
            let arrays = [];
            let sizeofFloat = 4;
            let wh = pixelWidth*pixelHeight;
            for (k = 0; k < n; k++) {
                let arr = new Float32Array(4*wh);
                for (let i = 0; i < w*h; i++) {
                    let re = view.getFloat32(headerLength
                                            + sizeofFloat*(2*(k*wh + i)),
                                            endian);
                    let im = view.getFloat32(headerLength
                                            + sizeofFloat*(2*(k*wh + i) + 1),
                                            endian);
                    arr[4*i] = re;
                    arr[4*i + 1] = im;
                    arr[4*i + 2] = 0.0;
                    arr[4*i + 3] = 1.0;
                }
                arrays.push(arr);
            }
            if (useTimeout) {
                Promise.resolve().then(setTimeout(() => {
                    sim.substituteWavefunctionArrays(arrays);
                }, 500));
            } else {
                sim.substituteWavefunctionArrays(arrays);
            }
        } else if (headerData.type === 'p') {
            let arr = new Float32Array(4*pixelHeight*pixelWidth);
            for (let i = 0; i < w*h; i++) {
                arr[4*i] = view.getFloat32(
                    headerLength + i*sizeofFloat, endian);
                arr[4*i + 1] = 0.0;
                arr[4*i + 2] = 0.0;
                arr[4*i + 3] = 1.0;
            }
            sim.substitutePotentialArray(arr);
        } else if (headerData.type === 'b') {
            let potArr = new Float32Array(4*pixelHeight*pixelWidth);
            for (let i = 0; i < wh; i++) {
                potArr[4*i] = view.getFloat32(
                    headerLength + i*sizeofFloat, endian);
                potArr[4*i + 1] = 0.0;
                potArr[4*i + 2] = 0.0;
                potArr[4*i + 3] = 1.0;
            }
            sim.substitutePotentialArray(potArr);
            let arrays = [];
            for (k = 0; k < n; k++) {
                let arr = new Float32Array(4*wh);
                for (let i = 0; i < w*h; i++) {
                    let re = view.getFloat32(headerLength + sizeofFloat*wh
                                            + sizeofFloat*(2*(k*wh + i)),
                                            endian);
                    let im = view.getFloat32(headerLength + sizeofFloat*wh
                                            + sizeofFloat*(2*(k*wh + i) + 1),
                                            endian);
                    arr[4*i] = re;
                    arr[4*i + 1] = im;
                    arr[4*i + 2] = 0.0;
                    arr[4*i + 3] = 1.0;
                }
                arrays.push(arr);
            }
            if (useTimeout) {
                Promise.resolve().then(setTimeout(() => {
                    sim.substituteWavefunctionArrays(arrays);
                }, 500));
            } else {
                sim.substituteWavefunctionArrays(arrays);
            }
        }

    }
    reader.readAsArrayBuffer(file);
}
