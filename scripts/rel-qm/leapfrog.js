

class LeapfrogSimulationManager {
    constructor() {
        this.viewFrame = new Frame(pixelWidth, pixelHeight, 0);
        this.uFrames = [1, 2].map(e => new Frame(pixelWidth, pixelHeight, e));
        this.uSwap = () => this.uFrames = [this.uFrames[1], this.uFrames[0]];
        this.vFrames = [3, 4].map(e => new Frame(pixelWidth, pixelHeight, e));
        this.vSwap = () => this.vFrames = [this.vFrames[1], this.vFrames[0]];
        this.potFrame = new Frame(pixelWidth, pixelHeight, 5);
        this.guiFrame = new Frame(pixelWidth, pixelHeight, 6);
        this.vectorFieldFrame = new VectorFieldFrame(pixelWidth, pixelHeight, 7);
        this.vectorPotentialFrame = new Frame(pixelWidth, pixelHeight, 8);
        this.extraFrame = new Frame(pixelWidth, pixelHeight, 9);
        this.nullTex = 10;
        let frames = [];
        frames.push(this.viewFrame);
        this.uFrames.forEach(e => frames.push(e));
        this.vFrames.forEach(e => frames.push(e));
        frames.push(this.potFrame);
        frames.push(this.extraFrame);
        for (let f of frames) {
            f.setTexture(canvas.width, canvas.height, {s: gl.REPEAT, t: gl.REPEAT});
            f.activateFramebuffer();
        }
        this._frames = frames;
        for (let f of [this.guiFrame, this.vectorFieldFrame, 
                       this.vectorPotentialFrame]) {
            this._frames.push(f);
        }
    }
    setFrameDimensions(newWidth, newHeight) {
        gl.viewport(0, 0, newWidth, newHeight);
        for (let f of this._frames) {
            f.setTexture(newWidth, newHeight, {s: gl.REPEAT, t: gl.REPEAT});
            f.activateFramebuffer();
            unbind();
        }
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
        let rePsi1 = guiData.initSpinor.rePsi1;
        let imPsi1 = guiData.initSpinor.imPsi1; 
        let rePsi2 = guiData.initSpinor.rePsi2; 
        let imPsi2 = guiData.initSpinor.imPsi2; 
        let rePsi3 = guiData.initSpinor.rePsi3; 
        let imPsi3 = guiData.initSpinor.imPsi3; 
        let rePsi4 = guiData.initSpinor.rePsi4; 
        let imPsi4 = guiData.initSpinor.imPsi4; 
        let init4Spinor = init4SpinorWavefunc({x: rePsi4, y: imPsi4},
                                              {x: rePsi3, y: imPsi3},
                                              {x: rePsi2, y: imPsi2},
                                              {x: rePsi1, y: imPsi1},
                                              wavefuncData);
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
                t: t, hbar: wavefuncData.hbar,
                staggeredOffset: 0.5}
            );
            f.setVec4Uniforms({
                initSpinor: [init2Spinor[0].x, init2Spinor[0].y,
                             init2Spinor[1].x, init2Spinor[1].y]
            });
            draw();
            unbind();
        }
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
        unbind();
    }
    step(params) {
        let dt = params.dt;
        let w = params.w, h = params.h;
        let hbar = params.hbar;
        let m = params.m;
        let c = params.c;
        this.uFrames[1].useProgram(stepUpProgram);
        this.uFrames[1].bind();
        this.uFrames[1].setFloatUniforms(
            {dt: dt, dx: w/pixelWidth, dy: h/pixelHeight,
             w: w, h: h, m: m, 
             hbar: hbar, c: c}
        );
        this.uFrames[1].setIntUniforms(
            {vTex: this.vFrames[0].frameNumber,
             uTex: this.uFrames[0].frameNumber,
             potTex: this.potFrame.frameNumber,
             useVecPot: (params.useVectorPotential)? 1: 0,
             vecPotTex: this.vectorPotentialFrame.frameNumber}
        );
        draw();
        unbind();
        this.uSwap();
        this.vFrames[1].useProgram(stepDownProgram);
        this.vFrames[1].bind();
        this.vFrames[1].setFloatUniforms(
            {dt: dt, dx: w/pixelWidth, dy: h/pixelHeight,
             w: w, h: h, m: m, 
             hbar: hbar, c: c}
        );
        this.vFrames[1].setIntUniforms(
            {vTex: this.vFrames[0].frameNumber,
             uTex: this.uFrames[0].frameNumber,
             potTex: this.potFrame.frameNumber,
             useVecPot: (params.useVectorPotential)? 1: 0,
             vecPotTex: this.vectorPotentialFrame.frameNumber}
        );
        draw();
        unbind();
        this.vSwap();
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