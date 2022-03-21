
let guiData = {
    brightness: 4, // brightness for wavefunction
    maxBrightness: 20,
    brightness2: 1.0, // brightness for potential
    maxBrightness2: 10,
    speed: 6, // number of steps per frame
    maxSpeed: 20,
    bx: 0.0,
    by: 0.0,
    px: 0.0,
    py: 0.0,
    colourPhase: true,
    viewProbCurrent: false,
    showProbHeightMap: false,
    showPotHeightMap: false,
    displayOutline: false,
    mouseMode: 'new ψ(x, y)',
    mouseData: {name: () => {},
                stencilTypes: 'square',
                erase: false,
                stencilType: 0,
                width: 0.01, v2: 10.0,
                fixInitialP: false,
                sigma: 0.05859375,
                px0: 0.0, py0: 20.0,
                probabilityInBox: '0.0',
                mouseUse: false,
                mouseAction: false,
                mouseCount: 0,
                NEW_PSI: 'n',
                SKETCH_BARRIER: 's',
                ERASE_BARRIER: 'e',
                PROB_IN_BOX: 'p'
                },
    drawRect: {x: 0.0, y: 0.0, w: 0.0, h: 0.0},
    presetPotential: 'SHO',
    dissipation: 0,
    useTextureCoordinates: true,
    enterPotential: 'V(x, y)',
    enterPotentialExpr: '',
    enterWavefunc: 'ψ(x, y)',
    enterWavefuncExpr: '',
    enterNonlinear: 'f(u)',
    enterNonlinearExpr: '',
    useNonlocal: false,
    nonlocalPoissonJacobiIterations: 10,
    nonlocalInteractionStrength: 0.01,
    measure: false,
    measurePosition: () => {},
    dt: 0.01,
    m: 1.0,
    laplace: '5 point',
    laplaceVal: 5,
    scaleP: 1.0,
    potChanged: false,
    rScaleV: 0.0,
    object: "string",
    changeDimensions: `${canvas.width}x${canvas.height}`,
    showValues: {w: width , h: height},
    boundaries: 'default',
    borderAlpha: 0.0,
    boundaryType: "Dirichlet",
    probColour: [1.0, 1.0, 1.0],
    potColour: [1.0, 1.0, 1.0],
    imageName: '',
    imageFunc: () => {},
    imageBackgroundFunc: () => {},
    setToImageDimensions: () => {},
    serializeWavefunc: () => {},
    serializePotential: () => {},
    displayBGImage: false,
    bgBrightness: 1.0,
    invertImage: false,
    takeScreenshot: false,
    setStartSpeed: false,
    startSpeed: 2,
    pauseOnFinish: false,
    recordVideo: false,
    mediaRecorder: null,
    nVideoFrames: 0,
    videoData: [],
    nScreenshots: 1,
    screenshotCount: 0,
    screenshotDownloadCount: 0,
    screenshotNames: [],
    screenshots: [],
    screenshotProgress: '',
    streams: [],
    method: 'Leapfrog',
    iterations: 10,
    assessConvergence: false,
    tolerance: 1e-5,
    toleranceString: '1e-5',
    normalizeEachFrame: false,
};
guiData.measurePosition = () => guiData.measure = true;