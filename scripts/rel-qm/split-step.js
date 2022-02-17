

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
        this.initMomentumFrame();
        this.initRevBitSort2LookupFrame();
    }
    setFrameDimensions(newWidth, newHeight) {
        gl.viewport(0, 0, newWidth, newHeight);
        for (let f of this._frames) {
            f.setTexture(newWidth, newHeight, {s: gl.REPEAT, t: gl.REPEAT});
            f.activateFramebuffer();
            unbind();
        }
        /*let params = {
            m: this._m, dt: this._dt, 
            hbar: this._hbar, width: width, height: height,
            width: this._w, height: this._h
        };*/
        this.initRevBitSort2LookupFrame();
        this.initMomentumFrame();
        this.expPotentialFrame();
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
        transpose(arrTranspose, revBitSort2Table, pixelWidth, pixelHeight);
        for (let offset = 0; offset < transposeWidth*transposeHeight;
             offset += transposeWidth) {
            bitReverse2(arrTranspose, offset, offset+transposeWidth, 4);
        }
        transpose(revBitSort2Table, arrTranspose, 
                  transposeWidth, transposeHeight, 4);
        this.revBitSort2LookupFrame.substituteTextureArray(
            pixelWidth, pixelHeight, gl.FLOAT, revBitSort2Table
        );

    }
    fftFreq2(freqW, freqH) {
        for (let offset = 0; offset < pixelWidth*pixelHeight; 
             offset+=pixelWidth) {
            fftFreq(freqW, offset, offset+pixelWidth);
        }
        let freqTranspose = new Float32Array(pixelWidth*pixelHeight);
        let transposeWidth = pixelHeight, transposeHeight = pixelWidth;
        transpose(freqTranspose, freqH, pixelWidth, pixelHeight, 1);
        for (let offset = 0; offset < transposeWidth*transposeHeight; 
             offset+=transposeWidth) {
            fftFreq(freqTranspose, offset, offset+transposeWidth);
        } 
        transpose(freqH, freqTranspose, transposeWidth, transposeHeight, 1);
    }
    initMomentumFrame() {
        let width = this._w;
        let height = this._h;
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
        this.momentumFrame.substituteTextureArray(pixelWidth, pixelHeight,
                                                  gl.FLOAT, momentumArr);
    }
    makeExpPotential() {
        console.log({
            dt: this._dt, m: this._m, c: this._c, hbar: this._hbar
        });
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
            let scale = (isInv && blockSize == size)? 1.0/size: 1.0;
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
        for (let i in [0, 1]) {
            let frames = frames2[i];
            frames[1].useProgram(expKineticProgram);
            frames[1].bind();
            frames[1].setIntUniforms({
                uTex: frames2[0][0], vTex: frames2[1][0],
                momentumTex: this.momentumFrame.frameNumber,
                topOrBottom: i
            });
            frames[1].setFloatUniforms({
                dt: this._dt, m: this._m, c: this._c, hbar: this._hbar
            });
            draw();
            unbind();
        }
        for (let i in [0, 1]) {
            let frames = frames2[i];
            this.revBitSort2(frames[0], frames[1], 
                                revBitSort2LookupFrame);
            let isVert = true, isInv = true;
            /* frames[1].useProgram(complexMultiplyProgram);
            frames[1].bind();
            frames[1].setIntUniforms({
                tex1: expKineticFrame.frameNumber, 
                tex2: frame[0].frameNumber,
                layoutType: 2
            });
            draw();
            unbind();*/
            this.revBitSort2(frames[0], frames[1], revBitSort2LookupFrame);
            frames = this.fftIters(frames, pixelWidth, !isVert, isInv);
            frames = this.fftIters(frames, pixelWidth, isVert, isInv);
            frames2[i] = frames;
        }
        return [frames2[0][0], frames2[1][0]];
    }
    potentialStep(uFrames, vFrames) {
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
        // uFrames = [uFrames[1], uFrames[0]];
        // vFrames = [vFrames[1], vFrames[0]];
        // return [uFrames, vFrames];
    }
    step(params) {
        let t = this.t;
        let uFrames = this.uFrames;
        let vFrames = this.vFrames;
        if (this._dt !== params.dt || this._m !== params.m ||
            this._hbar !== params.hbar || this._c !== params.c) {
            let dt, m, hbar, width, height, c;
            ({dt, m, hbar, width, height, c} = params);
            this._dt = dt;
            this._hbar = hbar;
            this._m = m;
            this._w = width;
            this._h = height;
            this._c = c
            this.initMomentumFrame();
            this.makeExpPotential();

        }
        // this.potentialStep(uFrames, vFrames);
        // uFrames = [uFrames[1], uFrames[0]];
        // vFrames = [vFrames[1], vFrames[0]];
        // uvFrames = [uFrames[1], vFrames[1]];
        // uFrames = [uFrames[1], uFrames[0]];
        // vFrames = [vFrames[1], vFrames[0]];
        let uvFrames = this.momentumStep([uFrames[0], vFrames[0]]);
        uFrames[1].useProgram(copyScaleProgram);
        uFrames[1].bind();
        uFrames[1].setIntUniforms({tex1: uvFrames[0].frameNumber, 
                                   tex2: uvFrames[0].frameNumber
                                });
        uFrames[1].setFloatUniforms({scale1: 1.0, scale2: 1.0});
        draw();
        unbind();
        vFrames[1].useProgram(copyScaleProgram);
        vFrames[1].bind();
        vFrames[1].setIntUniforms({tex1: uvFrames[1].frameNumber, 
                                   tex2: uvFrames[1].frameNumber
                                });
        vFrames[1].setFloatUniforms({scale1: 1.0, scale2: 1.0});
        draw();
        unbind();
        // this.uFrames = [uFrames[1], uFrames[0]];
        // this.vFrames = [vFrames[1], vFrames[0]];
        // uvFrames is either [uFrames[1], vFrames[1]]
        // or [this.storeFrame, this.storeFrame2]
        /*let uFramesTmp = [uvFrames[0], uFrames[0]];
        let vFramesTmp = [uvFrames[1], vFrames[0]];
        this.potentialStep(uFramesTmp, vFramesTmp);
        this.uFrames = [uFrames[0], uFrames[1]];
        this.vFrames = [vFrames[0], vFrames[1]];*/
    }
    getUnnormalizedProbDist() {
        this.extraFrame.useProgram(probDensityProgram);
        this.extraFrame.bind();
        this.extraFrame.setIntUniforms({uTex: this.uFrames[0].frameNumber,
                                        vTex1: this.vFrames[0].frameNumber,
                                        vTex2: this.vFrames[1].frameNumber});
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
                                        vTex2: this.vFrames[1].frameNumber});
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
        for (let f of frames) {
            if (f.frameNumber === this.vFrames[0].frameNumber || 
                f.frameNumber === this.vFrames[1].frameNumber) {
                f.useProgram(initWave2Program);
            } else {
                f.useProgram(initWaveProgram);
            }
            f.bind();
            let t = 0.0;
            f.setFloatUniforms(
                {bx: wavefuncData.bx, by: wavefuncData.by, 
                sx: sigma, sy: sigma, 
                amp: 2.0*30.0/(sigma*512.0),
                pixelW: pixelWidth, pixelH: pixelHeight,
                m: wavefuncData.m, c: wavefuncData.c,
                kx: wavefuncData.px, ky: wavefuncData.py,
                w: wavefuncData.w, h: wavefuncData.h,
                t: t, hbar: wavefuncData.hbar}
            );
            draw();
            unbind();
        }/*
        let dt = simData.dt;
        let w = simData.w, h = simData.h;
        let hbar = simData.hbar;
        let m = simData.m;
        let c = simData.c;
        this.vFrames[0].useProgram(stepDownProgram);
        this.vFrames[0].bind();
        this.vFrames[0].setFloatUniforms(
            {dt: dt/2.0, dx: w/pixelWidth, dy: h/pixelHeight,
             w: w, h: h, m: m, 
             hbar: hbar, c: c}
        );
        this.vFrames[0].setIntUniforms(
            {vTex: this.vFrames[1].frameNumber,
             uTex: this.uFrames[1].frameNumber,
             potTex: this.potFrame.frameNumber,
             useVecPot: (simData.useVectorPotential)? 1: 0,
             vecPotTex: this.vectorPotentialFrame.frameNumber}
        );
        draw();
        unbind();*/
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
             vTex2: this.vFrames[1].frameNumber, 
             potTex: this.potFrame.frameNumber,
             guiTex: (guiData.showBox)? this.guiFrame.frameNumber: this.nullTex,
             wavefuncDisplayMode: (guiData.showWavefuncHeightMap)? 
                                    6: guiData.phaseMode,
             potentialDisplayMode: guiData.potentialDisplayMode,
             vecTex: (guiData.viewProbCurrent)? 
                        this.vectorFieldFrame.frameNumber: this.nullTex}
        );
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