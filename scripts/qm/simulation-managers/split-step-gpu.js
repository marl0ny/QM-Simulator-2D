
class SplitStepGPUSimulationManager 
extends SplitStepSimulationManager {
    constructor(framesManager) {
        super(framesManager);
        this.expPotentialFrame = framesManager.frames[7];
        this.expKineticFrame = framesManager.frames[8];
        this.revBitSort2LookupFrame = framesManager.frames[9];
        this.initRevBitSort2LookupFrame();
    }
    setFrameDimensions(pixelWidth, pixelHeight) {
        super.setFrameDimensions(pixelWidth, pixelHeight);
        let frames = [].concat(this.expPotentialFrame, this.expKineticFrame, 
                            this.revBitSort2LookupFrame);
        for (let frame of frames) {
            frame.setTexture(pixelWidth, pixelHeight, {s: gl.CLAMP_TO_EDGE,
                                                    t: gl.CLAMP_TO_EDGE});
            frame.activateFramebuffer();
            unbind();
        }
        this.initRevBitSort2LookupFrame();
        width = (canvas.width/512)*64.0*Math.sqrt(2.0);
        height = (canvas.height/512)*64.0*Math.sqrt(2.0);
        let params = {m: this._m, dt: this._dt, hbar: this._hbar, 
                    width: width, height: height};
        this.makeExpKinetic(this.expPotentialFrame, params);
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
        transpose(arrTranspose, revBitSort2Table, pixelWidth, pixelHeight, 4);
        for (let offset = 0; offset < transposeWidth*transposeHeight; 
            offset+=transposeWidth) {
            bitReverse2(arrTranspose, offset, offset+transposeWidth, 4);
        } 
        transpose(revBitSort2Table, arrTranspose, 
                transposeWidth, transposeHeight, 4);
        this.revBitSort2LookupFrame.substituteTextureArray(
            pixelWidth, pixelHeight, gl.FLOAT, revBitSort2Table);
    }
    makeExpKinetic(expKinetic, params) {
        super.makeExpKinetic(expKinetic, params);
        let expKineticFrame = this.expKineticFrame;
        expKineticFrame.substituteTextureArray(pixelWidth, pixelHeight,
                                            gl.FLOAT, 
                                            this.expKinetic);
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
        for (let blockSize = 2; blockSize <= pixelWidth; blockSize *=2) {
            let scale = (isInv && blockSize === size)? 1.0/size: 1.0;
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
    momentumStep() {
        let t = this.t;
        let swapFrames = this.swapFrames;
        let expKineticFrame = this.expKineticFrame;
        let revBitSort2LookupFrame = this.revBitSort2LookupFrame;
        this.revBitSort2(swapFrames[t-1], swapFrames[t-2],
                        revBitSort2LookupFrame);
        let frames = [swapFrames[t-1], swapFrames[t-2]];
        let isVert = true, isInv = true; 
        frames = this.fftIters(frames, pixelWidth, !isVert, !isInv);
        frames = this.fftIters(frames, pixelHeight, isVert, !isInv);
        frames[1].useProgram(complexMultiplyProgram);
        frames[1].bind();
        frames[1].setIntUniforms({tex1: expKineticFrame.frameNumber,
                                tex2: frames[0].frameNumber});
        draw();
        unbind();
        this.revBitSort2(frames[0], frames[1], revBitSort2LookupFrame);
        frames = this.fftIters(frames, pixelWidth, !isVert, isInv);
        frames = this.fftIters(frames, pixelHeight, isVert, isInv);
        return frames;
    }
    makeExpPotential(potentialFrame, expPotentialFrame, dt, hbar) {
        expPotentialFrame.useProgram(expPotentialProgram);
        expPotentialFrame.bind();
        expPotentialFrame.setFloatUniforms({dt: dt, hbar: hbar});
        expPotentialFrame.setIntUniforms({texV: potentialFrame.frameNumber});
        draw();
        unbind();
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
            this.makeExpKinetic(this.expKinetic, params);
            this.makeExpPotential(potentialFrame, expPotentialFrame, 
                                dt, hbar);
            this._dt = dt;
            this._hbar = hbar;
            this._m = m;
            this._w = width;
            this._h = height;
        }

        // Multiply wavefunction with exp potential part
        swapFrames[t-2].useProgram(complexMultiplyProgram);
        swapFrames[t-2].bind();
        swapFrames[t-2].setIntUniforms({tex1: expPotentialFrame.frameNumber, 
                                        tex2: swapFrames[t-3].frameNumber});
        draw();
        unbind();

        let frames = this.momentumStep();

        // Multiply wavefunction with exp potential part
        swapFrames[t].useProgram(complexMultiplyProgram);
        swapFrames[t].bind();
        swapFrames[t].setIntUniforms({tex1: expPotentialFrame.frameNumber, 
                                    tex2: frames[0].frameNumber});
        draw();
        unbind();
    }
    reshapePotential(bx, by, v2, drawWidth, drawHeight, 
                    stencilType, eraseMode) {
        super.reshapePotential(bx, by, v2, drawWidth, drawHeight,
                            stencilType, eraseMode);
        this.makeExpPotential(this.potentialFrame, this.expPotentialFrame,
                            this._dt, this._hbar);
    }
    imagePotential(imageData, invert=0) { 
        super.imagePotential(imageData, invert);
        this.makeExpPotential(this.potentialFrame, this.expPotentialFrame,
                            this._dt, this._hbar);
    }
    presetPotential(potentialType, potentialUniforms) {
        super.presetPotential(potentialType, potentialUniforms);
        this.makeExpPotential(this.potentialFrame, this.expPotentialFrame,
                            this._dt, this._hbar);
    }
    textPotential(program, uniforms) {
        super.textPotential(program, uniforms);
        this.makeExpPotential(this.potentialFrame, this.expPotentialFrame,
                            this._dt, this._hbar);
    }
}
