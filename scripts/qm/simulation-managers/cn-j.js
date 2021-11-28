
class CrankNicolsonSimulationManager extends SimulationManager {

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
                               laplacePoints: laplaceVal  // laplaceVal
                               });
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
                                   texV: potentialFrame.frameNumber,
                                   laplacePoints: laplaceVal
                                   });
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
