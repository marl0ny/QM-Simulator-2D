

class SplitStepSimulationManager {
    constructor() {
        this.viewFrame = new Frame(pixelWidth, pixelHeight, 0);
        this.uFrames = [1, 2].map(e => new Frame(pixelWidth, pixelHeight, e));
        this.uSwap = () => this.uFrames = [this.uFrames[1], this.uFrames[0]];
        this.vFrames = [3, 4].map(e => new Frame(pixelWidth, pixelHeight, e));
        this.vSwap = () => this.vFrames = [this.vFrames[1], this.vFrames[0]];
        this.potFrame = new Frame(pixelWidth, pixelHeight, 5); //
        this.guiFrame = new Frame(pixelWidth, pixelHeight, 6);
        this.expPotentialFrameU = new Frame(pixelWidth, pixelHeight, 7); //
        this.expPotentialFrameV = new Frame(pixelWidth, pixelHeight, 8); //
        this.momentumFrame = new Frame(pixelWidth, pixelHeight, 9); //
        this.expKineticFrame = new Frame(pixelWidth, pixelHeight, 10); //
        this.revBitSort2LookupFrame = new Frame(pixelWidth, pixelHeight, 11);
        this.vectorFieldFrame = new VectorFieldFrame(pixelWidth, pixelHeight, 12);
        this.vectorPotentialFrame = new Frame(pixelWidth, pixelHeight, 13);
        this.extraFrame = new Frame(pixelWidth, pixelHeight, 14); //
        this.extraFrame2 = new Frame(pixelWidth, pixelHeight, 15); //
        // this.storeFrame1 = new Frame(pixelWidth, pixelHeight, 14);
        // this.storeFrame2 = new Frame(pixelWidth, pixelHeight, 15);
        this.nullTex = 16;
        let frames = [];
        frames.push(this.viewFrame);
        this.uFrames.forEach(e => frames.push(e));
        this.vFrames.forEach(e => frames.push(e));
        frames.push(this.potFrame);
        frames.push(this.momentumFrame);
        frames.push(this.expPotentialFrameU);
        frames.push(this.expPotentialFrameV);
        frames.push(this.expKineticFrame);
        frames.push(this.extraFrame);
        frames.push(this.extraFrame2);
        for (let f of frames) {
            f.setTexture(canvas.width, canvas.height, {s: gl.REPEAT, t: gl.REPEAT});
            f.activateFramebuffer();
        }
        this._frames = frames;
        for (let f of [this.guiFrame, this.revBitSort2LookupFrame,
                       this.vectorFieldFrame,  
                       this.vectorPotentialFrame]) {
            this._frames.push(f);
        }
        this._w = 1.0;
        this._h = 1.0;
        this._m = 1.0;
        this._dt = 100.0;
        this._hbar = 1.0;
        this._c = 0.0;
        // this.initMomentumFrame();
        this.initRevBitSort2LookupFrame();
    }
    setFrameDimensions(newWidth, newHeight) {
        gl.viewport(0, 0, newWidth, newHeight);
        for (let f of this._frames) {
            f.setTexture(newWidth, newHeight, {s: gl.REPEAT, t: gl.REPEAT});
            f.activateFramebuffer();
            unbind();
        }
        this.initRevBitSort2LookupFrame();
        this.initMomentumFrame();
        this.makeExpPotential();
    }
    initRevBitSort2LookupFrame() {
        let revBitSort2Table = new Float32Array(pixelWidth*pixelHeight*4);
        for (let i = 0; i < pixelHeight; i++) {
            for (let j = 0; j < pixelWidth; j++) {
                revBitSort2Table[4*(i*pixelWidth + j) + 1] = i/pixelHeight;
                revBitSort2Table[4*(i*pixelWidth + j)] = j/pixelWidth;
            }
        }
        for (let offset = 0; offset < pixelWidth*pixelHeight; 
            offset+=pixelWidth) {
            bitReverse2(revBitSort2Table, offset, offset+pixelWidth, 4);
        }
        let arrTranspose = new Float32Array(pixelWidth*pixelHeight*4);
        let transposeHeight = pixelWidth, transposeWidth = pixelHeight;
        transpose(arrTranspose, revBitSort2Table, pixelWidth, pixelHeight, 4);
        for (let offset = 0; offset < transposeWidth*transposeHeight; 
            offset+=transposeWidth) {
            bitReverse2(arrTranspose, offset, offset+transposeWidth, 4);
        } 
        transpose(revBitSort2Table, arrTranspose, 
                transposeWidth, transposeHeight, 4);
        this.revBitSort2LookupFrame.substituteTextureArray(
            pixelWidth, pixelHeight, gl.FLOAT, revBitSort2Table);

    }
    fftFreq2(freqW, freqH) {
        for (let offset = 0; offset < pixelWidth*pixelHeight; 
             offset+=pixelWidth) {
            freqW[offset] += 1e-19;
            fftFreq(freqW, offset, offset+pixelWidth);
        }
        let freqTranspose = new Float32Array(pixelWidth*pixelHeight);
        let transposeWidth = pixelHeight, transposeHeight = pixelWidth;
        transpose(freqTranspose, freqH, pixelWidth, pixelHeight, 1);
        for (let offset = 0; offset < transposeWidth*transposeHeight; 
             offset+=transposeWidth) {
            fftFreq(freqTranspose, offset, offset+transposeWidth);
            freqTranspose[offset] += 1e-19;
        }
        transpose(freqH, freqTranspose, transposeWidth, transposeHeight, 1);
        // flip_vert(freqH, pixelWidth, pixelHeight, 1);
    }
    initMomentumFrame() {
        let width = this._w;
        let height = this._h;
        console.log(width, height);
        let freqH = new Float32Array(pixelWidth*pixelHeight);
        let freqW = new Float32Array(pixelWidth*pixelHeight);
        let momentumArr = new Float32Array(pixelWidth*pixelHeight*4);
        this.fftFreq2(freqW, freqH);
        for (let i = 0; i < pixelHeight; i++) {
            for (let j = 0; j < pixelWidth; j++) {
                let index = 4*(i*pixelWidth + j);
                let px = 2.0*Math.PI*freqW[i*pixelWidth + j]/width;
                let py = 2.0*Math.PI*freqH[i*pixelWidth + j]/height;
                let pz = 0.0;
                let p2 = px*px + py*py + pz*pz;
                momentumArr[index] = px;
                momentumArr[index + 1] = py;
                momentumArr[index + 2] = pz;
                momentumArr[index + 3] = p2;

            }
        }
        // flip_vert(momentumArr, pixelWidth, pixelHeight, 4);
        this.momentumFrame.substituteTextureArray(pixelWidth, pixelHeight,
                                                  gl.FLOAT, momentumArr);
    }
    makeExpPotential() {
        /*console.log({
            dt: this._dt, m: this._m, c: this._c, hbar: this._hbar
        });*/
        let potentialFrame = this.potFrame;
        let frames = [this.expPotentialFrameU, this.expPotentialFrameV];
        for (let expPotentialFrame of frames) {
            expPotentialFrame.useProgram(expPotentialProgram);
            expPotentialFrame.bind();
            expPotentialFrame.setFloatUniforms({
                dt: this._dt, m: this._m, c: this._c, hbar: this._hbar
            });
            expPotentialFrame.setIntUniforms({
                potTex: potentialFrame.frameNumber, 
                useVecPot: 0, vecPotTex: this.nullTex,
                topOrBottom: 0
            });
            draw();
            unbind();
        }
    }
    revBitSort2(dest, src, revBitSortFrame) {
        dest.useProgram(rearrangeProgram);
        dest.bind();
        dest.setFloatUniforms({width: pixelWidth, height: pixelHeight});
        dest.setIntUniforms({tex: src.frameNumber, 
                             lookupTex: revBitSortFrame.frameNumber});
        draw();
        unbind();
    }
    fftIters(frames, size, isVert, isInv) {
        let prev = frames[0], next = frames[1];
        for (let blockSize = 2; blockSize <= pixelWidth; blockSize *= 2) {
            let scale = (isInv && blockSize === size)? 1.0/size: 1.0;
            next.useProgram(fftIterProgram);
            next.bind();
            next.setIntUniforms({tex: prev.frameNumber, isVertical: isVert});
            next.setFloatUniforms({blockSize: blockSize/size,
                                   angleSign: (isInv)? 1.0: -1.0, 
                                   size: size, scale: scale});
            draw();
            unbind();
            let tmp = prev;
            prev = next;
            next = tmp;
        }
        return [prev, next];
    }
    momentumStep(uvFrames) {
        let uFrame = uvFrames[0];
        let vFrame = uvFrames[1];
        let revBitSort2LookupFrame = this.revBitSort2LookupFrame;
         let frames2 = [[this.extraFrame, uFrame], 
                        [this.extraFrame2, vFrame]];
        let isVert = true, isInv = true;
        for (let i in [0, 1]) {
            let frames = frames2[i];
            this.revBitSort2(frames[0], frames[1], 
                             revBitSort2LookupFrame);
            frames = this.fftIters(frames, pixelWidth, !isVert, !isInv);
            frames = this.fftIters(frames, pixelHeight, isVert, !isInv);
            frames2[i] = frames;
        }
        // frames2 = [[uFrame, this.extraFrame], 
        //           [vFrame, this.extraFrame2]];
        for (let i in [0, 1]) {
            let frames = frames2[i];
            frames[1].useProgram(expKineticProgram);
            frames[1].bind();
            frames[1].setIntUniforms({
                uTex: frames2[0][0].frameNumber, 
                vTex: frames2[1][0].frameNumber,
                momentumTex: this.momentumFrame.frameNumber,
                topOrBottom: i
            });
            frames[1].setFloatUniforms({
                dt: this._dt, m: this._m, c: this._c, hbar: this._hbar
            });
            draw();
            unbind();
        }
        // return [frames2[0][1], frames2[1][1]];
        for (let i in [0, 1]) {
            let frames = frames2[i];
            let isVert = true, isInv = true;
            this.revBitSort2(frames[0], frames[1], revBitSort2LookupFrame);
            frames = this.fftIters(frames, pixelWidth, !isVert, isInv);
            frames = this.fftIters(frames, pixelHeight, isVert, isInv);
            frames2[i] = frames;
        }
        return [frames2[0][0], frames2[1][0]];
    }
    potentialStep(uFrames, vFrames, params) {
        if (params.useVectorPotential === true) {
            let i = 0;
            for (let frames of [uFrames, vFrames]) {
                frames[1].useProgram(expPotentialProgram);
                frames[1].bind();
                frames[1].setIntUniforms({
                    uTex: uFrames[0].frameNumber, 
                    vTex: vFrames[0].frameNumber, 
                    potTex: this.potFrame.frameNumber,
                    useVecPot: 1,
                    vecPotTex: this.vectorPotentialFrame.frameNumber,
                    topOrBottom: i,
                });
                // console.log(params.dt, params.m, params.c, params.hbar);
                frames[1].setFloatUniforms({
                    dt: this._dt, m: this._m, c: this._c, hbar: this._hbar
                    // dt: params.dt, m: params.m,
                    // c: params.c, hbar: params.hbar
                });
                draw();
                unbind();
                i++;
            }
        } else {
            let i = 0;
            for (let frames of [uFrames, vFrames]) {
                let expPotentialFrame;
                if (i === 0) {
                    expPotentialFrame = this.expPotentialFrameU;
                } else {
                    expPotentialFrame = this.expPotentialFrameV;
                }
                frames[1].useProgram(complexMultiplyProgram);
                frames[1].bind();
                frames[1].setIntUniforms({
                    tex1: frames[0].frameNumber, 
                    tex2: expPotentialFrame.frameNumber, 
                    layoutType: 2,
                });
                draw();
                unbind();
                i++;
            }
        }
        let tmp = uFrames[0];
        uFrames[0] = uFrames[1];
        uFrames[1] = tmp;
        let tmp2 = vFrames[0];
        vFrames[0] = vFrames[1];
        vFrames[1] = tmp2;
    }
    step(params) {
        let t = this.t;
        if (this._dt !== params.dt || this._m !== params.m ||
            this._hbar !== params.hbar || this._c !== params.c) {
            let dt, m, hbar, w, h, c;
            ({dt, m, hbar, w, h, c} = params);
            this._dt = dt;
            this._hbar = hbar;
            this._m = m;
            this._w = w;
            this._h = h;
            this._c = c
            this.initMomentumFrame();
            this.makeExpPotential();

        }
        this.potentialStep(this.uFrames, this.vFrames, params);
        let uFrames = this.uFrames;
        let vFrames = this.vFrames;
        let uvFrames = this.momentumStep([uFrames[0], vFrames[0]]);
        let uFrame0 = uvFrames[0];
        let vFrame0 = uvFrames[1];
        uFrames[1].useProgram(copyScaleProgram);
        uFrames[1].bind();
        uFrames[1].setIntUniforms({tex1: uFrame0.frameNumber, 
                                   tex2: this.nullTex
                                });
        uFrames[1].setFloatUniforms({scale1: 1.0, scale2: 0.0});
        draw();
        unbind();
        vFrames[1].useProgram(copyScaleProgram);
        vFrames[1].bind();
        vFrames[1].setIntUniforms({tex1: vFrame0.frameNumber, 
                                   tex2: this.nullTex
                                });
        vFrames[1].setFloatUniforms({scale1: 1.0, scale2: 0.0});
        draw();
        unbind();
        this.uFrames = [uFrames[1], uFrames[0]];
        this.vFrames = [vFrames[1], vFrames[0]];
        this.potentialStep(this.uFrames, this.vFrames, params);
    }
    getUnnormalizedProbDist() {
        this.extraFrame.useProgram(probDensityProgram);
        this.extraFrame.bind();
        this.extraFrame.setIntUniforms({uTex: this.uFrames[0].frameNumber,
                                        vTex1: this.vFrames[0].frameNumber,
                                        vTex2: this.vFrames[0].frameNumber});
        this.extraFrame.setFloatUniforms({pixelW: pixelWidth, pixelH: pixelHeight});
        draw();
        let probDensity = this.extraFrame.getTextureArray({x: 0, y: 0, 
                                                          w: pixelWidth, 
                                                          h: pixelHeight});
        unbind();
        return probDensity;
    }
    probCurrent(params) {
        this.extraFrame.useProgram(currentProgram);
        this.extraFrame.bind();
        this.extraFrame.setIntUniforms({uTex: this.uFrames[0].frameNumber,
                                        vTex1: this.vFrames[0].frameNumber, 
                                        vTex2: this.vFrames[0].frameNumber});
        this.extraFrame.setFloatUniforms({pixelW: pixelWidth,
                                          pixelH: pixelHeight});
        draw();
        let current = this.extraFrame.getTextureArray({x: 0,y: 0,
                                                      w: pixelWidth,
                                                      h: pixelHeight});
        unbind();
        let vecs = [];
        let dst = 32;
        let wSpacing = pixelWidth/dst, hSpacing = pixelHeight/dst;
        let hEnd = pixelHeight;
        let wEnd = pixelWidth;
        let count = 0;
        for (let i = hSpacing; i < hEnd; i += hSpacing) {
            for (let j = wSpacing; j < wEnd; j += wSpacing) {
                let vy = current[4*i*pixelHeight + 4*j + 1];
                let vx = current[4*i*pixelHeight + 4*j + 2];
                if (vx*vx + vy*vy > 1e-9) {
                    let x = 2.0*i/pixelHeight - 1.0;
                    let y = 2.0*j/pixelWidth - 1.0;
                    let maxSize = 0.05;
                    if (vx*vx + vy*vy > maxSize*maxSize) {
                        let norm = 1.0/Math.sqrt(vx*vx + vy*vy);
                        vx = vx*norm*maxSize;
                        vy = vy*norm*maxSize; 
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
        this.vectorFieldFrame.useProgram(onesProgram);
        this.vectorFieldFrame.bind(vertices);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawLines(count);
        unbind();
    }
    initWavefunc(simData, wavefuncData) {
        let frames = [];
        this.uFrames.forEach(e => frames.push(e));
        this.vFrames.forEach(e => frames.push(e));
        let sigma = wavefuncData.sigma;
        let rePsi1 = wavefuncData.initSpinor.rePsi1;
        let imPsi1 = wavefuncData.initSpinor.imPsi1; 
        let rePsi2 = wavefuncData.initSpinor.rePsi2; 
        let imPsi2 = wavefuncData.initSpinor.imPsi2; 
        let rePsi3 = wavefuncData.initSpinor.rePsi3; 
        let imPsi3 = wavefuncData.initSpinor.imPsi3; 
        let rePsi4 = wavefuncData.initSpinor.rePsi4; 
        let imPsi4 = wavefuncData.initSpinor.imPsi4;
        let rePosE1 = wavefuncData.initSpinorEnergySolutions.rePosE1;
        let imPosE1 = wavefuncData.initSpinorEnergySolutions.imPosE1;
        let rePosE2 = wavefuncData.initSpinorEnergySolutions.rePosE2;
        let imPosE2 = wavefuncData.initSpinorEnergySolutions.imPosE2;
        let reNegE1 = wavefuncData.initSpinorEnergySolutions.reNegE1;
        let imNegE1 = wavefuncData.initSpinorEnergySolutions.imNegE1;
        let reNegE2 = wavefuncData.initSpinorEnergySolutions.reNegE2;
        let imNegE2 = wavefuncData.initSpinorEnergySolutions.imNegE2;
        let u1, u2, v1, v2;
        let init4Spinor;
        if (!wavefuncData.useInitSpinorByEnergySolutions) {
            v2 = {x: rePsi4, y: imPsi4};
            v1 = {x: rePsi3, y: imPsi3};
            u2 = {x: rePsi2, y: imPsi2};
            u1 = {x: rePsi1, y: imPsi1};
            normalize([u1, u2, v1, v2]);
            init4Spinor = {u: [u1, u2], v: [v1, v2]};
        } else {
            v2 = {x: reNegE2, y: imNegE2};
            v1 = {x: reNegE1, y: imNegE1};
            u2 = {x: rePosE2, y: imPosE2};
            u1 = {x: rePosE1, y: imPosE1};
            init4Spinor = init4SpinorWavefunc(v2, v1, u2, u1,
                                              false, wavefuncData); 
        }
        let init2Spinor;
        for (let f of frames) {
            if (f.frameNumber === this.vFrames[0].frameNumber || 
                f.frameNumber === this.vFrames[1].frameNumber
                ) {
                f.useProgram(initWave2Program);
                init2Spinor = init4Spinor.v;
            } else {
                f.useProgram(initWaveProgram);
                init2Spinor = init4Spinor.u;
            }
            f.bind();
            let t = 0.0;
            console.log(wavefuncData.w, wavefuncData.h);
            f.setFloatUniforms(
                {bx: wavefuncData.bx, by: wavefuncData.by, 
                sx: sigma, sy: sigma, 
                amp: 2.0*30.0/(sigma*512.0),
                pixelW: pixelWidth, pixelH: pixelHeight,
                kx: wavefuncData.px, ky: wavefuncData.py,
                t: t, hbar: wavefuncData.hbar}
            );
            f.setVec4Uniforms({
                initSpinor: [init2Spinor[0].x, init2Spinor[0].y,
                             init2Spinor[1].x, init2Spinor[1].y]
            });
            draw();
            unbind();
        }
    }
    reshapePotential(drawMode, mode, data) {
        this.extraFrame.useProgram(copyOverProgram);
        this.extraFrame.bind();
        this.extraFrame.setIntUniforms({tex1: this.potFrame.frameNumber});
        draw();
        unbind();
        this.potFrame.useProgram(reshapePotProgram);
        this.potFrame.bind();
        this.potFrame.setIntUniforms({tex1: this.extraFrame.frameNumber, 
                                      eraseMode: mode,
                                      drawMode: drawMode});
        // console.log(data.bx, data.by);
        this.potFrame.setFloatUniforms({
            drawWidth: data.drawSize,
            drawHeight: data.drawSize,
            bx: data.bx,  by: data.by, 
            v2: (mode === 0)? data.drawValue: 0.0
        });
        draw();
        unbind();
        this.makeExpPotential();
    }
    imagePotential(imageData, invert=0) {
        this.extraFrame.substituteTextureArray(pixelWidth, pixelHeight, 
                                               gl.FLOAT, imageData);
        this.potFrame.useProgram(imagePotentialProgram);
        this.potFrame.bind();
        this.potFrame.setIntUniforms({tex: this.extraFrame.frameNumber,
                                      invert: invert});
        draw();
        unbind();
        this.makeExpPotential();
    }
    presetPotential(potentialType, dissipativePotentialType,
                    potentialUniforms) {
        this.potFrame.useProgram(potProgram);
        this.potFrame.bind();
        this.potFrame.setFloatUniforms(potentialUniforms);
        this.potFrame.setIntUniforms({
            potentialType: potentialType,
            dissipativePotentialType, dissipativePotentialType
        });
        draw();
        unbind();
        this.makeExpPotential();
    }
    presetVectorPotential() {
        this.vectorPotentialFrame.useProgram(initVectorPotentialProgram);
        this.vectorPotentialFrame.bind()
        this.vectorPotentialFrame.setIntUniforms({potentialType: 1});
        this.vectorPotentialFrame.setFloatUniforms({cx: 50.0, cy: 50.0});
        draw();
        unbind();
    }
    textVectorPotential(program, uniforms) {
        this.vectorPotentialFrame.useProgram(program);
        this.vectorPotentialFrame.bind();
        this.vectorPotentialFrame.setFloatUniforms(uniforms);
        draw();
        unbind();
    }
    probBoxDisplay(guiData) {
        this.guiFrame.useProgram(guiRectProgram);
        this.guiFrame.bind();
        this.guiFrame.setFloatUniforms({
            x0: guiData.drawRect.x, y0: guiData.drawRect.y,
            w: guiData.drawRect.w, h: guiData.drawRect.h,
            lineWidth: 0.003
        });
        draw();
        unbind();
    }
    display(guiData) {
        this.viewFrame.useProgram(viewProgram);
        this.viewFrame.bind();
        this.viewFrame.setIntUniforms(
            {uTex: this.uFrames[0].frameNumber,
             vTex1: this.vFrames[0].frameNumber,
             vTex2: this.vFrames[0].frameNumber, 
             potTex: this.potFrame.frameNumber,
             guiTex: (guiData.showBox)? this.guiFrame.frameNumber: this.nullTex,
             wavefuncDisplayMode: (guiData.showWavefuncHeightMap)? 
                                    6: guiData.phaseMode,
             potentialDisplayMode: guiData.potentialDisplayMode,
             vecTex: (guiData.viewProbCurrent)? 
                        this.vectorFieldFrame.frameNumber: this.nullTex}
        );
        // guiData.applyPhaseShift = false;
        this.viewFrame.setFloatUniforms(
            {constPhase: (guiData.applyPhaseShift)? 
                          guiData.t*guiData.m*guiData.c**2: 0.0,
            pixelW: pixelWidth, pixelH: pixelHeight,
            psiBrightness: guiData.brightness,
            potBrightness: guiData.potBrightness,
            showPsi1: (guiData.showPsi1)? 1.0: 0.0, 
            showPsi2: (guiData.showPsi2)? 1.0: 0.0,
            showPsi3: (guiData.showPsi3)? 1.0: 0.0, 
            showPsi4: (guiData.showPsi4)? 1.0: 0.0}
        );
        this.viewFrame.setVec3Uniforms(
            {probColour: guiData.probColour, 
             potColour: guiData.potColour}
        );
        draw();
        unbind();
    }
}