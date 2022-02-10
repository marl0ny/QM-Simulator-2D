
class CrankNicolsonWithAFieldSimulationManager
extends CrankNicolsonSimulationManager {
    constructor(framesManager) {
        super(framesManager);
        this.vectorPotentialFrame = framesManager.frames[8];
        this.vectorPotentialFrame.useProgram(initVectorPotentialProgram);
        this.vectorPotentialFrame.bind();
        this.vectorPotentialFrame.setIntUniforms({potentialType: 1});
        this.vectorPotentialFrame.setFloatUniforms({cx: 8.0, cy: 8.0});
        draw();
        unbind();
    }
    jacobiIter(params, frame1, frame2) {
        let vectorPotentialFrame = this.vectorPotentialFrame;
        let potentialFrame = this.potentialFrame;
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
                            texV: potentialFrame.frameNumber,
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
        let potentialFrame = this.potentialFrame;
        let dx, dy, dt;
        let m, hbar;
        let laplaceVal;
        let rScaleV;
        let width, height;
        let iterations;
        let assessConvergence;
        let tolerance;
        ({dx, dy, dt, m, hbar, laplaceVal, 
            width, height, rScaleV,
            iterations, assessConvergence, tolerance} = params);
        storeFrame.useProgram(cnExplicitPartProgram);
        storeFrame.bind();
        storeFrame.setFloatUniforms({dx: dx, dy: dy, dt: dt,
                                    w: width, h: height,
                                    m: m, hbar: hbar,
                                    rScaleV: rScaleV});
        storeFrame.setIntUniforms({texPsi: swapFrames[t-2].frameNumber,
                                texV: potentialFrame.frameNumber,
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
    }
}
