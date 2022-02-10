class LeapfrogNonlinearSimulationManager 
extends SimulationManager {

    constructor(framesManager) {
        super(framesManager);
        this.nonlinearLeapfrogProgram = realImagTimeStepProgram;
        this.poissonIterFrame1 = null;
        this.poissonIterFrame2 = null;
        this.potentialNonlocalFrame = null;
        if (framesManager.frames.length > 8) {
            this.poissonIterFrame1 = framesManager.frames[8];
            this.poissonIterFrame2 = framesManager.frames[9];
            this.potentialNonlocalFrame = framesManager.frames[10];
        }
        this.nonlinearParams = {};
        this.nonlinearNonlocalParams = {
            strength: 0.001,
            nIter: 10,
            use: false
        };
    }

    nonlinear(program, uniforms) {
        this.nonlinearLeapfrogProgram = program;
        this.nonlinearParams = uniforms;
    }

    nonlinearNonlocal(params) {
        this.nonlinearNonlocalParams = params;
    }

    poissonIter(poissonProgram, params, 
                frame1, frame2, bFrame) {
        let bScale = this.nonlinearNonlocalParams.strength;
        let dx, dy, dt, width, height;
        ({dx, dy, dt, width, height} = params);
        frame2.useProgram(poissonProgram);
        frame2.bind();
        frame2.setFloatUniforms({
            dx: dx, dy: dy, dt: dt,
            w: w, h: h, bScale: bScale,
            width: width, height: height
        });
        frame2.setIntUniforms({
            laplacianType: 5, bTex: bFrame.frameNumber,
            prevTex: frame1.frameNumber
        });
        draw();
        unbind();
    }

    nonlocalCoulomb(psiFrame, params) {
        let nIter = this.nonlinearNonlocalParams.nIter;
        let iterFrames = [this.poissonIterFrame1, 
                          this.poissonIterFrame2];
        this.storeFrame.useProgram(probDensityProgram);
        this.storeFrame.bind();
        this.storeFrame.setIntUniforms(
            {tex: psiFrame.frameNumber});
        draw();
        unbind();
        for (let i = 0; i < nIter; i++) {
            if (i == 0) {
                this.poissonIter(poissonJacobiIterProgram, params,
                                 this.nullTexNumber, iterFrames[0],
                                 this.storeFrame);
            } else {
                this.poissonIter(poissonJacobiIterProgram, params,
                                 iterFrames[0], iterFrames[1],
                                 this.storeFrame);
                iterFrames = [iterFrames[1], iterFrames[0]];
            }
        }
        this.potentialNonlocalFrame.useProgram(copyScaleProgram);
        this.potentialNonlocalFrame.bind();
        this.potentialNonlocalFrame.setFloatUniforms(
            {scale1: 1.0, scale2: 1.0}
        );
        this.potentialNonlocalFrame.setIntUniforms(
            {tex1: this.potentialFrame.frameNumber, 
             tex2: iterFrames[0].frameNumber}
        );
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
        let floatUniforms = {dx: dx, dy: dy, dt: dt, 
                             w: width, h: height,
                             m: m, hbar: hbar, rScaleV: rScaleV};
        for (let p of Object.keys(this.nonlinearParams)) {
            floatUniforms[p] = this.nonlinearParams[p];
        }
        var useNonlocal = this.nonlinearNonlocalParams.use;
        if (useNonlocal) {
            this.nonlocalCoulomb(swapFrames[t-2], params);
            potentialFrame = this.potentialNonlocalFrame;
        }
        swapFrames[t-1].useProgram(this.nonlinearLeapfrogProgram);
        swapFrames[t-1].bind();
        swapFrames[t-1].setFloatUniforms(floatUniforms);
        swapFrames[t-1].setIntUniforms({texPsi1: swapFrames[t-3].frameNumber,
                                        texPsi2: swapFrames[t-2].frameNumber,
                                        texV: potentialFrame.frameNumber,
                                        laplacePoints: laplaceVal});
        draw();
        unbind();
        floatUniforms['rScaleV'] = 0.0;
        if (useNonlocal) {
            this.nonlocalCoulomb(swapFrames[t-1], params);
            potentialFrame = this.potentialNonlocalFrame;
        }
        swapFrames[t].useProgram(this.nonlinearLeapfrogProgram);
        swapFrames[t].bind();
        swapFrames[t].setFloatUniforms(floatUniforms);
        swapFrames[t].setIntUniforms({texPsi1: swapFrames[t-2].frameNumber,
                                      texPsi2: swapFrames[t-1].frameNumber,
                                      texV: potentialFrame.frameNumber,
                                      laplacePoints: laplaceVal});
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
        swapFrames[t-2].useProgram(this.nonlinearLeapfrogProgram);
        swapFrames[t-2].bind();
        swapFrames[t-2].setFloatUniforms({dx: dx,
                                          dy: dy,
                                          dt: dt/2.0,
                                          w: width, h: height, m: m,
                                          hbar: hbar});
        swapFrames[t-2].setIntUniforms({texPsi1: swapFrames[t-3].frameNumber,
                                        texPsi2: swapFrames[t-3].frameNumber,
                                        texV: potentialFrame.frameNumber, 
                                        laplacePoints: laplaceVal});
        draw();
        unbind();
    }
}