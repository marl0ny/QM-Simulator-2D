
class SplitStepSimulationManager 
extends CrankNicolsonSimulationManager {

constructor(framesManager) {
    super(framesManager);
    this.expKinetic = new Float32Array(4*pixelWidth*pixelHeight);
    this._dt = 0.0;
    this._hbar = 1.0;
    this._m = 0.0;
    this._w = 0.0;
    this._h = 0.0;
}
swap() {
    this.swapFrames = [this.swapFrames[3], this.swapFrames[0],
                       this.swapFrames[1], this.swapFrames[2]];
}
fftFreq2(freqW, freqH) {
    for (let offset = 0; offset < pixelWidth*pixelHeight; 
         offset+=pixelWidth) {
        fftFreq(freqW, offset, offset+pixelWidth);
    }
    let freqTranspose = new Float32Array(pixelWidth*pixelHeight);
    let transposeWidth = pixelHeight, transposeHeight = pixelWidth;
    transpose(freqTranspose, freqH, pixelWidth, pixelHeight, 1);
    for (let offset = 0; offset < transposeWidth*transposeHeight; 
         offset+=transposeWidth) {
        fftFreq(freqTranspose, offset, offset+transposeWidth);
    } 
    transpose(freqH, freqTranspose, transposeWidth, transposeHeight, 1);
}
makeExpKinetic(expKinetic, params) {
    let width, height, hbar, dt, m;
    ({width, height, hbar, dt, m} = params);
    let freqH = new Float32Array(pixelWidth*pixelHeight);
    let freqW = new Float32Array(pixelWidth*pixelHeight);
    this.fftFreq2(freqW, freqH);
    for (let i = 0; i < pixelHeight; i++) {
        for (let j = 0; j < pixelWidth; j++) {
            let px = 2.0*Math.PI*freqW[i*pixelWidth + j]/width;
            let py = 2.0*Math.PI*freqH[i*pixelWidth + j]/height;
            let p2 = px*px + py*py;
            let phi = -dt*p2/(2.0*m*hbar);
            expKinetic[4*(i*pixelWidth + j)] = Math.cos(phi);
            expKinetic[4*(i*pixelWidth + j) + 1] = Math.sin(phi);
            expKinetic[4*(i*pixelWidth + j) + 2] = 0.0;
            expKinetic[4*(i*pixelWidth + j) + 3] = 1.0;
        }
    }

}
momentumStepCPU(arr) {
    // Get the gpu data as an array
    let arrTranspose = new Float32Array(4*pixelWidth*pixelHeight);
    let transposeWidth = pixelHeight, transposeHeight = pixelWidth;
    // fft to momentum space.
    // let workers = [];
    for (let offset = 0; offset < pixelWidth*pixelHeight; 
        offset+=pixelWidth) {
        /* let worker = new Worker('./scripts/qm/fft-worker.js');
        worker.postMessage([arr.subarray(4*offset, 
                                         4*(offset + pixelWidth)),
                            offset, false]);
        // workers.push(worker);
        worker.onmessage = e => {
            let subArr = e.data[0];
            let offset = e.data[1];
            for (let i = offset*4; i < 4*(offset + pixelWidth); i++) {
                arr[i] = subArr[i];
            }
            worker.terminate();
        }*/
        fft(arr, offset, offset+pixelWidth);
    }
    //  while (workers.length > 0) {}
    transpose(arrTranspose, arr, pixelWidth, pixelHeight, 4);
    for (let offset = 0; offset < transposeWidth*transposeHeight; 
        offset+=transposeWidth) {
        fft(arrTranspose, offset, offset+transposeWidth);
    }
    transpose(arr, arrTranspose, transposeWidth, transposeHeight, 4);
    // multiply psi(p) with the exp kinetic factor.
    for (let j = 0; j < pixelHeight; j++) {
        for (let i = 0; i < pixelWidth; i++) {
            let index = 4*(j*pixelWidth + i);
            let rePsi = arr[index];
            let imPsi = arr[index + 1];
            let reExpKinetic = this.expKinetic[index];
            let imExpKinetic = this.expKinetic[index + 1];
            arr[index] = rePsi*reExpKinetic - imPsi*imExpKinetic;
            arr[index + 1] =  rePsi*imExpKinetic + imPsi*reExpKinetic;
        }
    }
    // Go back to position space.
    for (let offset = 0; offset < pixelWidth*pixelHeight; 
         offset+=pixelWidth) {
        fft(arr, offset, offset+pixelWidth, true);
    }
    transpose(arrTranspose, arr, pixelWidth, pixelHeight, 4);
    for (let offset = 0; offset < transposeWidth*transposeHeight; 
         offset+=transposeWidth) {
        fft(arrTranspose, offset, offset+transposeWidth, true);
    } 
    transpose(arr, arrTranspose, transposeWidth, transposeHeight, 4);
}
step(params) {
    let t = this.t;
    let swapFrames = this.swapFrames;
    let storeFrame = this.storeFrame;
    let potentialFrame = this.potentialFrame;
    let dx, dy, dt;
    let m, hbar;
    let laplaceVal;
    let rScaleV;
    let width, height;
    ({dx, dy, dt, m, hbar, laplaceVal, 
        width, height, rScaleV} = params);
    if (this._dt !== dt) {
        this.makeExpKinetic(this.expKinetic, params);
        this._hbar = hbar;
        this._dt = dt;
        this._m = m;
        this._w = width;
        this._h = height;
    }
    storeFrame.useProgram(expPotentialProgram);
    storeFrame.bind();
    storeFrame.setFloatUniforms({dt: dt, hbar: hbar});
    storeFrame.setIntUniforms({texV: potentialFrame.frameNumber});
    draw();
    unbind();

    // Multiply wavefunction with exp potential part
    swapFrames[t-2].useProgram(complexMultiplyProgram);
    swapFrames[t-2].bind();
    swapFrames[t-2].setIntUniforms({tex1: storeFrame.frameNumber, 
                                    tex2: swapFrames[t-3].frameNumber});
    draw();
    let arr = swapFrames[t-2].getTextureArray({x: 0, y: 0, 
                                               w: pixelWidth, 
                                               h: pixelHeight});
    unbind();
    this.momentumStepCPU(arr);
    // Put array data back into gpu buffer
    swapFrames[t-1].substituteTextureArray(pixelWidth, pixelHeight, 
                                           gl.FLOAT, arr);
    // Multiply wavefunction with exp potential part
    swapFrames[t].useProgram(complexMultiplyProgram);
    swapFrames[t].bind();
    swapFrames[t].setIntUniforms({tex1: storeFrame.frameNumber, 
                                  tex2: swapFrames[t-1].frameNumber});
    draw();
    unbind();
}
}

