class SimulationViewManager {

    constructor(framesManager) {
        this.viewFrame = framesManager.frames[0];
        this.swapFrames = [1, 2, 3, 4].map(i =>
                                           framesManager.frames[i]);
        this.storeFrame = framesManager.frames[5];
        this.potentialFrame = framesManager.frames[6];
        this.vectorFieldFrame = framesManager.frames[7];
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
                               this.potentialFrame, this.vectorFieldFrame);
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
        this.storeFrame.useProgram(staggeredProbDensityProgram);
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
    selectPositionFromProbDist() {
        // TODO: get this to work for nonequal side lengths.
        let probDensity = this.getUnnormalizedProbDist();
        let notNormalizedTot = 0.0;
        for (let i = 0; i < probDensity.length/4; i++) {
            notNormalizedTot += probDensity[4*i];
        }
        console.log(notNormalizedTot);
        let randNum = Math.random()*notNormalizedTot;
        let j = 0;
        let notNormalizedProb = 0;
        for (let i = 0; i < probDensity.length/4; i++) {
            notNormalizedProb += probDensity[4*i];
            if (randNum <= notNormalizedProb) {
                j = i;
                break;
            }
        }
        let v = j/pixelWidth;
        let u = j%pixelWidth;
        unbind();
        return [u, v];
    }
    probCurrent(params) {
        let swapFrames = this.swapFrames;
        let t = this.t;
        this.storeFrame.useProgram(staggeredProbCurrentProgram);
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
        let wSpacing = parseInt(pixelWidth/dst);
        let hSpacing = parseInt(pixelHeight/dst);
        let hEnd = pixelHeight; // - hSpacing;
        let wEnd = pixelWidth; // - wSpacing;
        let count = 0;
        for (let i = hSpacing; i < hEnd; i += hSpacing) {
            for (let j = wSpacing; j < wEnd; j += wSpacing) {
                let vy = probCurrent[4*i*pixelWidth + 4*j]/60.0;
                let vx = probCurrent[4*i*pixelWidth + 4*j + 1]/60.0;
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
    reshapePotential(bx, by, v2, drawWidth, drawHeight, 
                     stencilType, eraseMode) {
        let storeFrame = this.storeFrame;
        let potentialFrame = this.potentialFrame;
        let nullTexNumber = this.nullTexNumber;
        storeFrame.useProgram(shapePotentialProgram);
        storeFrame.bind();
        storeFrame.setFloatUniforms({bx: bx, by: by,
                                     v2: v2,
                                     drawWidth: drawWidth,
                                     drawHeight: drawHeight});
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


class CrankNicolsonSimulationViewManager extends SimulationViewManager {

    getUnnormalizedProbDist() {
        this.storeFrame.useProgram(probDensityProgram);
        this.storeFrame.bind();
        let swapFrames = this.swapFrames;
        let t = this.t;
        this.storeFrame.setIntUniforms({tex: swapFrames[t].frameNumber});
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
        this.storeFrame.setIntUniforms({tex: swapFrames[t].frameNumber});
        draw();
        let probCurrent = this.storeFrame.getTextureArray({x: 0, y: 0,
                                                           w: pixelWidth, 
                                                           h: pixelHeight});
        unbind();
        let vecs = [];
        let dst = 32;
        if (pixelWidth === 400 && pixelHeight === 400) dst = 25;
        let wSpacing = parseInt(pixelWidth/dst);
        let hSpacing = parseInt(pixelHeight/dst);
        let hEnd = pixelHeight; // - hSpacing;
        let wEnd = pixelWidth; // - wSpacing;
        let count = 0;
        for (let i = hSpacing; i < hEnd; i += hSpacing) {
            for (let j = wSpacing; j < wEnd; j += wSpacing) {
                let vy = probCurrent[4*i*pixelWidth + 4*j]/60.0;
                let vx = probCurrent[4*i*pixelWidth + 4*j + 1]/60.0;
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
    initWavefunc(params, wavefuncParams) {
        let swapFrames = this.swapFrames;
        let borderAlpha;
        ({borderAlpha} = params);
        let amp, sx, sy, bx, by, px, py;
        ({amp, sx, sy, bx, by, px, py} = wavefuncParams);
        for (let i = 0; i < swapFrames.length; i++) {
            swapFrames[i].useProgram(initialWaveProgram);
            swapFrames[i].bind();
            swapFrames[i].setFloatUniforms({dx: 1.0/pixelWidth, 
                                            dy: 1.0/pixelHeight,
                                            px: px, py: py,
                                            amp: amp,
                                            sx: sx, sy: sy,
                                            bx: bx, by: by,
                                            borderAlpha: borderAlpha});
            draw();
            unbind();
        }
    }
    jacobiIter(params, frame1, frame2) {
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
                               laplacePoints: laplaceVal});
        draw();
        unbind();
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
        storeFrame.useProgram(cnExplicitPartProgram);
        storeFrame.bind();
        storeFrame.setFloatUniforms({dx: dx, dy: dy, dt: dt,
                                     w: width, h: height,
                                     m: m, hbar: hbar,
                                     rScaleV: rScaleV});
        storeFrame.setIntUniforms({texPsi: swapFrames[t-2].frameNumber,
                                   texV: potentialFrame.frameNumber});
        draw();
        unbind();
        for (let i = 0; i < 10; i++) {
            if (i === 0) {
                this.jacobiIter(params, storeFrame, swapFrames[t-1]);
            } else if (i % 2) {
                this.jacobiIter(params, swapFrames[t-1], swapFrames[t]);
            } else {
                this.jacobiIter(params, swapFrames[t], swapFrames[t-1]);
            }
        }
    }
    display(floatUniforms, intUniforms, vec3Uniforms) {
        let tex = this.vectorFieldFrame.frameNumber;
        let potentialFrame = this.potentialFrame;
        let swapFrames = this.swapFrames;
        let t = this.t;
        intUniforms['vecTex'] = tex;
        intUniforms['tex1'] = swapFrames[t].frameNumber,
        intUniforms['tex2'] = swapFrames[t].frameNumber,
        intUniforms['tex3'] = swapFrames[t].frameNumber,
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


function bitReverse2(arr, start, end, size) {
    let n = end - start;
    let u, d, rev;
    for(let i = 0; i < end - start; i++) {
        u = 1;
        d = n >> 1;
        rev = 0;
        while (u < n) {
            rev += d*((i&u)/u);
            u <<= 1;
            d >>= 1;
        }
        if (rev >= 1) {
            for (let k = 0; k < size; k++) {
                let tmp = arr[size*(start + i) + k];
                arr[size*(start + i) + k] = arr[size*(start + rev) + k];
                arr[size*(start + rev) + k] = tmp;
            }
        }
    }
}

function transpose(dest, src, w, h, size) {
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            for (let k = 0; k < size; k++) {
                dest[size*(i*h + j) + k] = src[size*(j*w + i) + k];
            }
        }
    }
}

function fftFreq(arr, start, end) {
    let n = end - start;
    if (n % 2 === 0) {
        for (let i = 0; i <= n/2 - 1; i++) {
            arr[start + i] = i;
        }
        for (let i = n - 1, j = -1; i >= n/2; i--, j--) {
            arr[start + i] = j;
        }
    } else {
        let k = 0;
        for (let i = 0; i < (n-1)/2; i++) {
            arr[start + i] = k;
            k += 1;
        }
        k = -k;
        for (let i = (n-1)/2 + 1; i < n; i++) {
            arr[start + i] = k;
            k -= 1;
        }
    }
}
/*
A Cooley-Tukey Radix-2 FFT implementation.


References:

Wikipedia - Cooley–Tukey FFT algorithm:
https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm

Press W. et al. (1992). Fast Fourier Transform.
In Numerical Recipes in Fortran 77, chapter 12
https://websites.pmc.ucsc.edu/~fnimmo/eart290c_17/NumericalRecipesinF77.pdf

MathWorld Wolfram - Fast Fourier Transform:
http://mathworld.wolfram.com/FastFourierTransform.html 
*/
function fft(arr, start, end, isInverse=false) {
    bitReverse2(arr, start, end, 4);
    let n = end - start;
    // let blockTotal;
    sign = (isInverse)? -1.0: 1.0;
    for (let blockSize = 2; blockSize <= n; blockSize *= 2) {
        for (let j = 0; j < n; j += blockSize) {
            for (let i = 0; i < blockSize/2; i++) {
                let cosVal = Math.cos(2.0*Math.PI*i/blockSize);
                let sinVal = sign*Math.sin(2.0*Math.PI*i/blockSize);
                let reEven = arr[(start + j + i)*4];
                let imEven = arr[(start + j + i)*4 + 1];
                let reOdd = arr[(start + j + i + blockSize/2)*4];
                let imOdd = arr[(start + j + i + blockSize/2)*4 + 1];
                let reExp = cosVal*reOdd - imOdd*sinVal;
                let imExp = cosVal*imOdd + sinVal*reOdd;
                let nVal = (isInverse && blockSize === n)? n: 1.0;
                arr[(start + j + i)*4] = (reEven + reExp)/nVal;
                arr[(start + j + i)*4 + 1] = (imEven + imExp)/nVal;
                arr[(start + j + i + blockSize/2)*4] = (reEven - reExp)/nVal;
                arr[(start + j + i + 
                     blockSize/2)*4 + 1] = (imEven - imExp)/nVal;
            }
        }
    }

}
class SplitStepSimulationViewManager 
    extends CrankNicolsonSimulationViewManager {

    constructor(framesManager) {
        super(framesManager);
        this.expKineticInitialized = false;
        this.expKinetic = new Float32Array(4*pixelWidth*pixelHeight);
    }
    swap() {
        this.swapFrames = [this.swapFrames[3], this.swapFrames[0],
                           this.swapFrames[1], this.swapFrames[2]];
    }
    initWavefunc(params, wavefuncParams) {
        if (!this.expKineticInitialized) {
            this.makeExpKinetic(this.expKinetic, params);
            this.expKineticInitialized = true;
        } 
        super.initWavefunc(params, wavefuncParams);
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

        // Get the gpu data as an array
        let arr = swapFrames[t-2].getTextureArray({x: 0, y: 0, 
                                                   w: pixelWidth, 
                                                   h: pixelHeight});
        unbind();
        let arrTranspose = new Float32Array(4*pixelWidth*pixelHeight);
        let transposeWidth = pixelHeight, transposeHeight = pixelWidth;

        // fft to momentum space.
        for (let offset = 0; offset < pixelWidth*pixelHeight; 
             offset+=pixelWidth) {
            fft(arr, offset, offset+pixelWidth);
        }
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
                let rePsi = arr[index], imPsi = arr[index + 1];
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