class SplitStepNonlinearManager 
extends SplitStepGPUSimulationManager {
    // TODO
    constructor(framesManager) {
        super(framesManager);
        this.expPotentialProgram = expPotentialProgram;
        this.nonlinearParams = {};
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
    step(params) {
        let t = this.t;
        let swapFrames = this.swapFrames;
        let potentialFrame = this.potentialFrame;
        let expPotentialFrame = this.expPotentialFrame;
        let dt = params.dt;
        if (this._dt !== dt) {
            let m, hbar, width, height;
            ({m, hbar, width, height} = params);
            this._dt = dt;
            this._hbar = hbar;
            this._m = m;
            this._w = width;
            this._h = height;
            this._resetNonlinearParams();
            this.makeExpPotential(potentialFrame, expPotentialFrame, 
                                  dt, hbar);
            this.makeExpKinetic(this.expKinetic, params);
        }
        /*
        Applying nonlinear terms for the split-operator method can be found here
        https://arxiv.org/pdf/1305.1093 on page 6.

        Antoine, X., Bao, W., Besse C. (2013). 
        Computational methods for the dynamics of
        the nonlinear Schrödinger/Gross–Pitaevskii equations.
        Computer Physics Communications, 184(12), 2621-2633.
        https://doi.org/10.1016/j.cpc.2013.07.012

        */
        // Multiply wavefunction with exp potential part
        this.makeNonlinearExpPotential(potentialFrame, expPotentialFrame, swapFrames[t-3]);
        swapFrames[t-2].useProgram(complexMultiplyProgram);
        swapFrames[t-2].bind();
        swapFrames[t-2].setIntUniforms({tex1: expPotentialFrame.frameNumber, 
                                        tex2: swapFrames[t-3].frameNumber});
        draw();
        unbind();

        let frames = this.momentumStep();

        // Multiply wavefunction with exp potential part
        this.makeNonlinearExpPotential(potentialFrame, expPotentialFrame, frames[0]);
        swapFrames[t].useProgram(complexMultiplyProgram);
        swapFrames[t].bind();
        swapFrames[t].setIntUniforms({tex1: expPotentialFrame.frameNumber, 
                                    tex2: frames[0].frameNumber});
        draw();
        unbind();
    }
}