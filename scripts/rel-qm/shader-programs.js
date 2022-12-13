let vShader = makeShader(gl.VERTEX_SHADER, vertexShaderSource);
let initWaveShader = makeShader(gl.FRAGMENT_SHADER, 
                                initialUpperSpinorFragmentSource);
let initWave2Shader = makeShader(gl.FRAGMENT_SHADER, 
                                initialBottomSpinorFragmentSource);
let stepUpShader = makeShader(gl.FRAGMENT_SHADER, 
                              upperSpinorTimestepFragmentSource);
let stepDownShader = makeShader(gl.FRAGMENT_SHADER,
                                bottomSpinorTimestepFragmentSource);
let viewShader = makeShader(gl.FRAGMENT_SHADER,
                            diracViewFragmentSource);
let potShader = makeShader(gl.FRAGMENT_SHADER, 
                            initialPotentialFragmentSource);
let reshapePotShader = makeShader(gl.FRAGMENT_SHADER,
                                  reshapePotentialFragmentSource);
let copyOverShader = makeShader(gl.FRAGMENT_SHADER, copyOverFragmentSource);
let copyScaleShader = makeShader(gl.FRAGMENT_SHADER, copyScaleFragmentSource);
let copyScaleFlipShader = makeShader(gl.FRAGMENT_SHADER, 
                                     copyScaleFlipFragmentSource);
let probDensityShader = makeShader(gl.FRAGMENT_SHADER, 
                                   diracProbDensityFragmentSource);
let guiRectShader = makeShader(gl.FRAGMENT_SHADER, 
                               guiRectangleFragmentSource);
let currentShader = makeShader(gl.FRAGMENT_SHADER, 
                               diracCurrentFragmentSource);
let onesShader = makeShader(gl.FRAGMENT_SHADER, onesFragmentSource);
let imagePotentialShader = makeShader(gl.FRAGMENT_SHADER, 
                                      imagePotentialFragmentSource);
let initVectorPotentialShader = makeShader(gl.FRAGMENT_SHADER,
                                    initialVectorPotentialFragmentSource);
let complexMultiplyShader = makeShader(gl.FRAGMENT_SHADER,
                                       complexMultiplyFragmentSource);
let fftIterShader = makeShader(gl.FRAGMENT_SHADER,
                               fftIterFragmentSource);
let splitStepKineticShader = makeShader(gl.FRAGMENT_SHADER,
                                        diracSplitStepKineticFragmentSource);
let splitStepPotentialShader = makeShader(gl.FRAGMENT_SHADER,
    diracSplitStepPotentialFragmentSource);
let rearrangeShader = makeShader(gl.FRAGMENT_SHADER,
                                 rearrangeFragmentSource);
let revBitSort2Shader = makeShader(gl.FRAGMENT_SHADER,
                                   revBitSort2FragmentSource);


let initWaveProgram = makeProgram(vShader, initWaveShader);
let initWave2Program = makeProgram(vShader, initWave2Shader);
let stepUpProgram = makeProgram(vShader, stepUpShader);
let stepDownProgram = makeProgram(vShader, stepDownShader);
let potProgram = makeProgram(vShader, potShader);
let viewProgram = makeProgram(vShader, viewShader);
let reshapePotProgram = makeProgram(vShader, reshapePotShader);
let copyOverProgram = makeProgram(vShader, copyOverShader);
let copyScaleProgram = makeProgram(vShader, copyScaleShader);
let copyScaleFlipProgram = makeProgram(vShader, copyScaleFlipShader);
let probDensityProgram = makeProgram(vShader, probDensityShader);
let guiRectProgram = makeProgram(vShader, guiRectShader);
let currentProgram = makeProgram(vShader, currentShader);
let onesProgram = makeProgram(vShader, onesShader);
let imagePotentialProgram = makeProgram(vShader, imagePotentialShader);
let initVectorPotentialProgram = makeProgram(vShader, 
                                             initVectorPotentialShader);
let complexMultiplyProgram = makeProgram(vShader, complexMultiplyShader);
let fftIterProgram = makeProgram(vShader, fftIterShader);
let expKineticProgram = makeProgram(vShader, splitStepKineticShader);
let expPotentialProgram = makeProgram(vShader, splitStepPotentialShader);
let rearrangeProgram = makeProgram(vShader, rearrangeShader);
let revBitSort2Program = makeProgram(vShader, revBitSort2Shader);

// gl.deleteShader(vShader);
gl.deleteShader(initWaveShader);
gl.deleteShader(initWave2Shader);
gl.deleteShader(stepUpShader);
gl.deleteShader(stepDownShader);
gl.deleteShader(viewShader);
gl.deleteShader(potShader);
gl.deleteShader(reshapePotShader);
gl.deleteShader(copyOverShader);
gl.deleteShader(copyScaleShader);
gl.deleteShader(copyScaleFlipShader);
gl.deleteShader(probDensityShader);
gl.deleteShader(guiRectShader);
gl.deleteShader(currentShader);
gl.deleteShader(onesShader);
gl.deleteShader(imagePotentialShader);
gl.deleteShader(initVectorPotentialShader);
gl.deleteShader(complexMultiplyShader);
gl.deleteShader(fftIterShader);
gl.deleteShader(splitStepKineticShader);
gl.deleteShader(splitStepPotentialShader);
gl.deleteShader(rearrangeShader);
gl.deleteShader(revBitSort2Shader);

