class LeapfrogNonlinearSimulationManager 
extends SimulationManager {

    constructor(framesManager) {
        super(framesManager);
        this.nonlinearLeapfrogProgram = realImagTimeStepProgram;
        this.nonlinearParams = {};
    }

    nonlinear(program, uniforms) {
        this.nonlinearLeapfrogProgram = program;
        this.nonlinearParams = uniforms;
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