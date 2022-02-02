
class TimeSplitWithCNJNonlinearSimulationManager
extends CrankNicolsonSimulationManager {
    constructor(framesManager) {
        super(framesManager);
        this.expPotentialProgram = expPotentialProgram;
        this.vectorPotentialFrame = framesManager.frames[8];
        this.expPotentialFrame = framesManager.frames[9];
        this.vectorPotentialFrame.useProgram(initVectorPotentialProgram);
        this.vectorPotentialFrame.bind();
        this.vectorPotentialFrame.setIntUniforms({potentialType: 1});
        this.vectorPotentialFrame.setFloatUniforms({cx: 0.0, cy: 0.0});
        this.nonlinearParams = {};
        this._dt = 0.0;
        this._hbar = 1.0;
        this._m = 0.0;
        this._w = 0.0;
        this._h = 0.0;
        this.nonlinearParams['dt'] = this._dt;
        this.nonlinearParams['hbar'] = this._hbar;
        draw();
        unbind();
    }
    setFrameDimensions(pixelWidth, pixelHeight) {
        gl.viewport(0, 0, pixelWidth, pixelHeight);
        this.viewFrame.setTexture(pixelWidth, pixelHeight, 
                                  {s: gl.CLAMP_TO_EDGE, t: gl.CLAMP_TO_EDGE});
        unbind();
        let frames = [].concat(this.swapFrames, this.storeFrame, this.storeFrame2,
                               this.potentialFrame, this.vectorFieldFrame,
                               this.expPotentialFrame, this.vectorPotentialFrame);
        for (let frame of frames) {
            frame.setTexture(pixelWidth, pixelHeight, {s: gl.CLAMP_TO_EDGE,
                                                       t: gl.CLAMP_TO_EDGE});
            frame.activateFramebuffer();
            unbind();
        }
    }
    makeNonlinearExpPotential(potentialFrame, expPotentialFrame, psiFrame) {
        expPotentialFrame.useProgram(this.expPotentialProgram);
        expPotentialFrame.bind();
        expPotentialFrame.setFloatUniforms(this.nonlinearParams);
        expPotentialFrame.setIntUniforms({texV: potentialFrame.frameNumber,
                                          texPsi: psiFrame.frameNumber});
        draw();
        unbind();
    }
    nonlinear(program, uniforms) {
        this.expPotentialProgram = program;
        uniforms.dt = this._dt;
        uniforms.hbar = this._hbar;
        this.nonlinearParams = uniforms;
    }
    _resetNonlinearParams() {
        this.nonlinearParams['dt'] = this._dt;
        this.nonlinearParams['hbar'] = this._hbar;
    }
    poissonIter(poissonProgram, params,
                frame1, frame2, bFrame) {
        let dx, dy, dt, width, height;
        ({dx, dy, dt, width, height} = params);
        frame2.useProgram(poissonProgram);
        frame2.bind();
        frame2.setFloatUniforms({
            dx: dx, dy: dy, dt: dt,
            w: w, h: h, bScale: 1.0,
            width: width, height: height
        });
        frame2.setIntUniforms({
            laplacianType: 5, bTex: bFrame.frameNumber,
            prevTex: frame1.frameNumber
        });
        draw();
        unbind();
    }
    jacobiIter(params, frame1, frame2) {
        let vectorPotentialFrame = this.vectorPotentialFrame;
        let storeFrame = this.storeFrame;
        let dx, dy, dt;
        let m, hbar;
        let laplaceVal;
        let rScaleV;
        let width, height;
        ({dx, dy, dt, m, hbar, laplaceVal, 
        width, height, rScaleV} = params);
        frame2.useProgram(jacobiIterProgram);
        frame2.bind();
        frame2.setFloatUniforms({dx: dx, dy: dy, dt: dt,
                                w: width, h: height,
                                m: m, hbar: hbar,
                                rScaleV: rScaleV});
        frame2.setIntUniforms({texPsi: storeFrame.frameNumber,
                            texPsiIter: frame1.frameNumber,
                            texV: this.nullTexNumber,
                            laplacePoints: laplaceVal,
                            useAField: 1,
                            texA: vectorPotentialFrame.frameNumber});
        draw();
        unbind();
    }
    step(params) {
        let vectorPotentialFrame = this.vectorPotentialFrame;
        let t = this.t;
        let swapFrames = this.swapFrames;
        let storeFrame = this.storeFrame;
        let dx, dy, dt;
        let m, hbar;
        let laplaceVal;
        let rScaleV;
        let width, height;
        let iterations;
        let assessConvergence;
        let tolerance;
        this._dt = dt;
        this._hbar = hbar;
        ({dx, dy, dt, m, hbar, laplaceVal, 
            width, height, rScaleV,
            iterations, assessConvergence, tolerance} = params);
        this._dt = dt;
        this._hbar = hbar;
        this._m = m;
        this._w = width;
        this._h = height;
        this.nonlinearParams['dt'] = this._dt;
        this.nonlinearParams['hbar'] = this._hbar;
        this.makeNonlinearExpPotential(this.potentialFrame, this.expPotentialFrame, 
                                        swapFrames[t-2]);
        swapFrames[t-3].useProgram(complexMultiplyProgram);
        swapFrames[t-3].bind();
        swapFrames[t-3].setIntUniforms({tex1: this.expPotentialFrame.frameNumber,
                                        tex2: swapFrames[t-2].frameNumber});
        draw();
        unbind();
        storeFrame.useProgram(cnExplicitPartProgram);
        storeFrame.bind();
        storeFrame.setFloatUniforms({dx: dx, dy: dy, dt: dt,
                                    w: width, h: height,
                                    m: m, hbar: hbar,
                                    rScaleV: rScaleV});
        storeFrame.setIntUniforms({texPsi: swapFrames[t-3].frameNumber,
                                texV: this.nullTexNumber,
                                useAField: 1,
                                laplacePoints: laplaceVal,
                                texA: vectorPotentialFrame.frameNumber});
        draw();
        unbind();
        this.jacobiIterations(params, storeFrame, swapFrames, t, iterations);
        if (assessConvergence) {
            let totalSteps = iterations;
            let err = 0.0;
            while ((err = this.computeDistOfLastTwoFrames()) > tolerance) {
                this.jacobiIterations(params, swapFrames[t], swapFrames, t, 4);
                totalSteps += 4;
            }
            console.log('iterations: ', totalSteps, '\nerr: ', err);
        }
        this.makeNonlinearExpPotential(this.potentialFrame, this.expPotentialFrame, 
                                       swapFrames[t]);
        swapFrames[t-1].useProgram(complexMultiplyProgram);
        swapFrames[t-1].bind();
        swapFrames[t-1].setIntUniforms({tex1: this.expPotentialFrame.frameNumber,
                                        tex2: swapFrames[t].frameNumber});
        draw();
        unbind();
        let tmp = swapFrames[t];
        swapFrames[t] = swapFrames[t-1];
        swapFrames[t-1] = tmp;
    }
}
