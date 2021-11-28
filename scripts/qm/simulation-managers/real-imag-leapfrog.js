class LeapfrogSimulationManager extends SimulationManager {

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
}
