let vShader = makeShader(gl.VERTEX_SHADER, vertexShaderSource);
let realTimeStepShader = makeShader(gl.FRAGMENT_SHADER,
                                    realTimestepFragmentSource);
let realTimeStepProgram = makeProgram(vShader, realTimeStepShader);
let imagTimeStepShader = makeShader(gl.FRAGMENT_SHADER,
                                    imagTimestepFragmentSource);
let imagTimeStepProgram = makeProgram(vShader, imagTimeStepShader);
let initialWaveShader = makeShader(gl.FRAGMENT_SHADER,
                                    initialWavepacketFragmentSource);
let initialWaveProgram = makeProgram(vShader, initialWaveShader);
let initPotentialShader = makeShader(gl.FRAGMENT_SHADER,
                                        initialPotentialFragmentSource);
let initPotentialProgram = makeProgram(vShader, initPotentialShader);
let reshapePotentialShader = makeShader(gl.FRAGMENT_SHADER,
                                        reshapePotentialFragmentSource);
let shapePotentialProgram = makeProgram(vShader, reshapePotentialShader);
let displayShader = makeShader(gl.FRAGMENT_SHADER, viewFrameFragmentSource);
let displayProgram = makeProgram(vShader, displayShader);
let copyToShader = makeShader(gl.FRAGMENT_SHADER, copyOverFragmentSource);
let copyToProgram = makeProgram(vShader, copyToShader);
let probDensityShader = makeShader(gl.FRAGMENT_SHADER,
                                    probDensityFragmentSource);
let probDensityProgram = makeProgram(vShader, probDensityShader);
let probCurrentShader = makeShader(gl.FRAGMENT_SHADER,
                                   probCurrentFragmentSource);
let probCurrentProgram = makeProgram(vShader, probCurrentShader);
let onesShader = makeShader(gl.FRAGMENT_SHADER, onesFragmentSource);
let onesProgram = makeProgram(vShader, onesShader);
let imagePotentialShader = makeShader(gl.FRAGMENT_SHADER, 
                                      imagePotentialFragmentSource);
let imagePotentialProgram = makeProgram(vShader, imagePotentialShader);

gl.deleteShader(vShader);
gl.deleteShader(realTimeStepShader);
gl.deleteShader(imagTimeStepShader);
gl.deleteShader(initialWaveShader);
gl.deleteShader(initPotentialShader);
gl.deleteShader(reshapePotentialShader);
gl.deleteShader(displayShader);
gl.deleteShader(copyToShader);
gl.deleteShader(probDensityShader);
gl.deleteShader(probCurrentShader);
gl.deleteShader(onesShader);
gl.deleteShader(imagePotentialShader);

