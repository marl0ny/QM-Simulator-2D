
class LeapfrogMomentumFFTSimulationManager 
    extends Leapfrog2SimulationManager {
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
        }
}
