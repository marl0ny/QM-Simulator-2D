class SimulationViewManager {
    constructor(pixelWidth, pixelHeight) {
        this.viewFrame = new Frame(pixelWidth, pixelHeight, 0);
        this.swapFrames = [1, 2, 3, 4].map(i =>
                                           new Frame(pixelWidth, 
                                                     pixelHeight, i));
        this.storeFrame = new Frame(pixelWidth, pixelHeight, 5);
        this.potentialFrame = new Frame(pixelWidth, pixelHeight, 6);
        this.vectorFieldFrame = new VectorFieldFrame(pixelWidth, pixelHeight, 7);
        this.t = 3;
        this.nullTexNumber = 8;
    }
    swap() {
        this.swapFrames = [this.swapFrames[2], this.swapFrames[3],
                           this.swapFrames[0], this.swapFrames[1]];
    }
    changeBoundaries(s, t) {
        this.viewFrame.setTexture(pixelWidth, pixelHeight, {s: s,
            t: t});
        unbind();
        let frames = [].concat(this.swapFrames, this.storeFrame, 
                               this.potentialFrame);
        for (let frame of frames) {
            frame.setTexture(pixelWidth, pixelHeight, {s: s,
                        t: t});
            frame.activateFramebuffer();
            unbind();
        }
    }
    setFrameDimensions(pixelWidth, pixelHeight) {
        gl.viewport(0, 0, pixelWidth, pixelHeight);
        this.viewFrame.setTexture(pixelWidth, pixelHeight, 
                                  {s: gl.CLAMP_TO_EDGE, t: gl.CLAMP_TO_EDGE});
        unbind();
        let frames = [].concat(this.swapFrames, this.storeFrame, 
                               this.potentialFrame, this.vectorFieldFrame);
        for (let frame of frames) {
            frame.setTexture(pixelWidth, pixelHeight, {s: gl.CLAMP_TO_EDGE,
                                                       t: gl.CLAMP_TO_EDGE});
            frame.activateFramebuffer();
            unbind();
        }
    }
    getUnnormalizedProbDist() {
        this.storeFrame.useProgram(probDensityProgram);
        this.storeFrame.bind();
        let swapFrames = this.swapFrames;
        let t = this.t;
        this.storeFrame.setIntUniforms({tex1: swapFrames[t].frameNumber,
                                        tex2: swapFrames[t-3].frameNumber,
                                        tex3: swapFrames[t-2].frameNumber});
        draw();
        let dimensions = {x: 0, y: 0, w: pixelWidth, h: pixelHeight};
        let probDensity = this.storeFrame.getTextureArray(dimensions);
        unbind();
        return probDensity;
    }
    probCurrent(params) {
        let swapFrames = this.swapFrames;
        let t = this.t;
        this.storeFrame.useProgram(probCurrentProgram);
        this.storeFrame.bind();
        this.storeFrame.setFloatUniforms({dx: width/pixelWidth,
                                          dy: height/pixelHeight,
                                          w: params.width,
                                          h: params.height,
                                          hbar: params.hbar,
                                          m: params.m});
        this.storeFrame.setIntUniforms({tex1: swapFrames[t].frameNumber,
                                        tex2: swapFrames[t-3].frameNumber,
                                        tex3: swapFrames[t-2].frameNumber});
        draw();
        let probCurrent = this.storeFrame.getTextureArray({x: 0, y: 0,
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
        this.vectorFieldFrame.useProgram(onesProgram);
        this.vectorFieldFrame.bind(vertices);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawLines(count);
        unbind();
    }
    reshapePotential(bx, by, v2, drawWidth, stencilType, eraseMode) {
        let storeFrame = this.storeFrame;
        let potentialFrame = this.potentialFrame;
        let nullTexNumber = this.nullTexNumber;
        storeFrame.useProgram(shapePotentialProgram);
        storeFrame.bind();
        storeFrame.setFloatUniforms({bx: bx, by: by,
                                     v2: v2,
                                     drawWidth: drawWidth});
        storeFrame.setIntUniforms({tex1: potentialFrame.frameNumber,
                                   drawMode: stencilType,
                                    eraseMode: eraseMode});
        draw();
        unbind();
        potentialFrame.useProgram(copyToProgram);
        potentialFrame.bind();
        potentialFrame.setIntUniforms({tex1: storeFrame.frameNumber,
                                       tex2: nullTexNumber});
        draw();
        unbind();
    }
    initWavefunc(params, wavefuncParams) {
        let t = this.t;
        let swapFrames = this.swapFrames;
        let potentialFrame = this.potentialFrame;
        let dx, dy, dt;
        let m, hbar;
        let borderAlpha, laplaceVal;
        let width, height;
        ({dx, dy, dt, m, hbar, borderAlpha, 
          laplaceVal, width, height} = params);
        let amp, sx, sy, bx, by, px, py;
        ({amp, sx, sy, bx, by, px, py} = wavefuncParams);
        swapFrames[t-3].useProgram(initialWaveProgram);
        swapFrames[t-3].bind();
        swapFrames[t-3].setFloatUniforms({dx: 1.0/pixelWidth, 
                                          dy: 1.0/pixelHeight,
                                          px: px, py: py,
                                          amp: amp,
                                          sx: sx, sy: sy,
                                          bx: bx, by: by,
                                          borderAlpha: borderAlpha});
        draw();
        unbind();
        swapFrames[t-2].useProgram(imagTimeStepProgram);
        swapFrames[t-2].bind();
        swapFrames[t-2].setFloatUniforms({dx: dx,
                                          dy: dy,
                                          dt: dt/2.0,
                                          w: width, h: height, m: m,
                                          hbar: hbar});
        swapFrames[t-2].setIntUniforms({texPsi: swapFrames[t-3].frameNumber,
                                        texV: potentialFrame.frameNumber, 
                                        laplacePoints: laplaceVal});
        draw();
        unbind();
    }
    step(params) {
        let t = this.t;
        let swapFrames = this.swapFrames;
        let potentialFrame = this.potentialFrame;
        let dx, dy, dt;
        let m, hbar;
        let laplaceVal;
        let rScaleV;
        let width, height;
        ({dx, dy, dt, m, hbar, laplaceVal, 
          width, height, rScaleV} = params);
        swapFrames[t-1].useProgram(realTimeStepProgram);
        swapFrames[t-1].bind();
        swapFrames[t-1].setFloatUniforms({dx: dx, dy: dy, dt: dt, 
                                          w: width, h: height,
                                          m: m, hbar: hbar,
                                          rScaleV: rScaleV});
        swapFrames[t-1].setIntUniforms({texPsi: swapFrames[t-2].frameNumber,
                                        texV: potentialFrame.frameNumber,
                                        laplacePoints: laplaceVal});
        draw();
        unbind();
        rScaleV = 0.0;
        swapFrames[t].useProgram(imagTimeStepProgram);
        swapFrames[t].bind();
        swapFrames[t].setFloatUniforms({dx: dx, dy: dy, dt: dt, 
                                        w: width, h: height, 
                                        m: m, hbar: hbar});
        swapFrames[t].setIntUniforms({texPsi: swapFrames[t-1].frameNumber,
                                      texV: potentialFrame.frameNumber,
                                      laplacePoints: laplaceVal});
        draw();
        unbind();
    }
    imagePotential(imageData, invert=0) {
        this.storeFrame.substituteTextureArray(pixelWidth, pixelHeight, 
                                               gl.FLOAT, imageData);
        this.potentialFrame.useProgram(imagePotentialProgram);
        this.potentialFrame.bind();
        this.potentialFrame.setIntUniforms({tex: this.storeFrame.frameNumber,
                                            invert: invert});
        draw();
        unbind();
    }
    presetPotential(potentialType, potentialUniforms) {
        this.potentialFrame.useProgram(initPotentialProgram);
        this.potentialFrame.bind();
        this.potentialFrame.setFloatUniforms(potentialUniforms);
        this.potentialFrame.setIntUniforms({potentialType: potentialType});
        draw();
        unbind();
    }
    textPotential(program, uniforms) {
        let storeFrame = this.storeFrame;
        let potentialFrame = this.potentialFrame;
        let nullTexNumber = this.nullTexNumber;
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
    }
    display(floatUniforms, intUniforms, vec3Uniforms) {
        let tex = this.vectorFieldFrame.frameNumber;
        let potentialFrame = this.potentialFrame;
        let swapFrames = this.swapFrames;
        let t = this.t;
        intUniforms['vecTex'] = tex;
        intUniforms['tex1'] = swapFrames[t].frameNumber,
        intUniforms['tex2'] = swapFrames[t-3].frameNumber,
        intUniforms['tex3'] = swapFrames[t-2].frameNumber,
        intUniforms['texV'] = potentialFrame.frameNumber
        this.viewFrame.useProgram(displayProgram);
        this.viewFrame.bind();
        this.viewFrame.setIntUniforms(intUniforms);
        this.viewFrame.setVec3Uniforms(vec3Uniforms);
        this.viewFrame.setFloatUniforms(floatUniforms);
        draw();
        unbind();
    }
}