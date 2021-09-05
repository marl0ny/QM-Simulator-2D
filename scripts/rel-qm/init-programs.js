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
let probDensityShader = makeShader(gl.FRAGMENT_SHADER, 
                                   diracProbDensityFragmentSource);
let guiRectShader = makeShader(gl.FRAGMENT_SHADER, 
                               guiRectangleFragmentSource);
let currentShader = makeShader(gl.FRAGMENT_SHADER, 
                               diracCurrentFragmentSource);
let onesShader = makeShader(gl.FRAGMENT_SHADER, onesFragmentSource);
let imagePotentialShader = makeShader(gl.FRAGMENT_SHADER, 
                                      imagePotentialFragmentSource);

let initWaveProgram = makeProgram(vShader, initWaveShader);
let initWave2Program = makeProgram(vShader, initWave2Shader);
let stepUpProgram = makeProgram(vShader, stepUpShader);
let stepDownProgram = makeProgram(vShader, stepDownShader);
let potProgram = makeProgram(vShader, potShader);
let viewProgram = makeProgram(vShader, viewShader);
let reshapePotProgram = makeProgram(vShader, reshapePotShader);
let copyOverProgram = makeProgram(vShader, copyOverShader);
let probDensityProgram = makeProgram(vShader, probDensityShader);
let guiRectProgram = makeProgram(vShader, guiRectShader);
let currentProgram = makeProgram(vShader, currentShader);
let onesProgram = makeProgram(vShader, onesShader);
let imagePotentialProgram = makeProgram(vShader, imagePotentialShader);

gl.deleteShader(vShader);
gl.deleteShader(initWaveShader);
gl.deleteShader(initWave2Shader);
gl.deleteShader(stepUpShader);
gl.deleteShader(stepDownShader);
gl.deleteShader(viewShader);
gl.deleteShader(potShader);
gl.deleteShader(reshapePotShader);
gl.deleteShader(copyOverShader);
gl.deleteShader(probDensityShader);
gl.deleteShader(guiRectShader);
gl.deleteShader(currentShader);
gl.deleteShader(onesShader);
gl.deleteShader(imagePotentialShader);

