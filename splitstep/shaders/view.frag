#VERSION_NUMBER_PLACEHOLDER

precision highp float;

#if __VERSION__ >= 300
in vec2 UV;
out vec4 fragColor;
#define texture2D texture
#else
#define fragColor gl_FragColor
varying highp vec2 UV;
#endif

uniform int viewMode;
uniform float wavefuncBrightnessScale1;
uniform float wavefuncBrightnessScale2;
uniform float potentialBrightnessScale;
uniform sampler2D texWavefunc0;
uniform sampler2D texWavefunc1;
uniform sampler2D texWavefunc2;
uniform sampler2D texPotential;

#define DENSITY_PHASE1 0
#define DENSITY_PHASE2 1
#define DENSITY1 2
#define DENSITY2 3
#define DENSITY_PHASE_ALL 4
#define DENSITY_ALL 5
#define DENSITY_ALL_DIFF_COLOURS 6
#define SPIN 7

#define complex vec2
#define complex2 vec4

complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}

complex2 conj(complex2 z) {
    return complex2(z[0], -z[1], z[2], -z[3]);
}

complex complex2Dot(complex2 w, complex2 z) {
    complex2 tmp = multiply(w, z);
    return complex(tmp[0] + tmp[2], tmp[1] + tmp[3]);
}

complex2 sigmaX(complex2 w) {
    return complex2(complex2Dot(complex2(0.0, 0.0, 1.0, 0.0), w),
                    complex2Dot(complex2(1.0, 0.0, 0.0, 0.0), w));
}

complex2 sigmaY(complex2 w) {
    return complex2(complex2Dot(complex2(0.0, 0.0, 0.0, -1.0), w),
                    complex2Dot(complex2(0.0, 1.0, 0.0, 0.0), w));
}

complex2 sigmaZ(complex2 w) {
    return complex2(complex2Dot(complex2(1.0, 0.0,  0.0, 0.0), w),
                    complex2Dot(complex2(0.0, 0.0, -1.0, 0.0), w));
}

vec3 complexToColour(float re, float im) {
    float pi = 3.141592653589793;
    float argVal = atan(im, re);
    float maxCol = 1.0;
    float minCol = 50.0/255.0;
    float colRange = maxCol - minCol;
    if (argVal <= pi/3.0 && argVal >= 0.0) {
        return vec3(maxCol,
                    minCol + colRange*argVal/(pi/3.0), minCol);
    } else if (argVal > pi/3.0 && argVal <= 2.0*pi/3.0){
        return vec3(maxCol - colRange*(argVal - pi/3.0)/(pi/3.0),
                    maxCol, minCol);
    } else if (argVal > 2.0*pi/3.0 && argVal <= pi){
        return vec3(minCol, maxCol,
                    minCol + colRange*(argVal - 2.0*pi/3.0)/(pi/3.0));
    } else if (argVal < 0.0 && argVal > -pi/3.0){
        return vec3(maxCol, minCol,
                    minCol - colRange*argVal/(pi/3.0));
    } else if (argVal <= -pi/3.0 && argVal > -2.0*pi/3.0){
        return vec3(maxCol + (colRange*(argVal + pi/3.0)/(pi/3.0)),
                    minCol, maxCol);
    } else if (argVal <= -2.0*pi/3.0 && argVal >= -pi){
        return vec3(minCol,
                    minCol - (colRange*(argVal + 2.0*pi/3.0)/(pi/3.0)), maxCol);
    }
    else {
        return vec3(minCol, maxCol, maxCol);
    }
}

void main() {
    vec4 wavefunc0 = texture2D(texWavefunc0, UV);
    vec4 wavefunc1 = texture2D(texWavefunc1, UV);
    vec4 wavefunc2 = texture2D(texWavefunc2, UV);
    float wavefuncBrightness1 = (wavefunc0[1]*wavefunc2[1]
                                 + wavefunc1[0]*wavefunc1[0]
                                 )*wavefuncBrightnessScale1;
    float wavefuncBrightness2 = (wavefunc0[3]*wavefunc2[3]
                                 + wavefunc1[2]*wavefunc1[2]
                                 )*wavefuncBrightnessScale2;
    vec3 wavefuncColour1 = complexToColour(wavefunc1[0],
                                          (wavefunc2[1] + wavefunc0[1])/2.0);
    vec3 wavefuncColour2 = complexToColour(wavefunc1[2],
                                          (wavefunc2[3] + wavefunc0[3])/2.0);
    float potentialBrightness = texture2D(texPotential, UV).w
                                *potentialBrightnessScale;
    switch(viewMode) {
        case DENSITY_PHASE1:
            fragColor = vec4(wavefuncBrightness1*wavefuncColour1
                                + potentialBrightness/50.0, 1.0);
            break;
        case DENSITY_PHASE2:
            fragColor = vec4(wavefuncBrightness2*wavefuncColour2
                                + potentialBrightness/50.0, 1.0);
            break;
        case DENSITY1:
            fragColor = vec4(wavefuncBrightness1*vec3(1.0, 1.0, 1.0)
                                + potentialBrightness/50.0, 1.0);
            break;
        case DENSITY2:
            fragColor = vec4(wavefuncBrightness2*vec3(1.0, 1.0, 1.0)
                                + potentialBrightness/50.0, 1.0);
            break;
        case DENSITY_PHASE_ALL:
            fragColor = vec4(wavefuncBrightness1*wavefuncColour1
                                + wavefuncBrightness2*wavefuncColour2
                                + potentialBrightness/50.0, 1.0);
            break;
        case DENSITY_ALL_DIFF_COLOURS:
            fragColor = vec4(vec3(wavefuncBrightness1, 0.0,
                                     wavefuncBrightness2)
                                + potentialBrightness/50.0, 1.0);
            break;
        case SPIN:
            complex2 reWavefunc1 = complex2(wavefunc1[0], 0.0,
                                            wavefunc1[2], 0.0);
            complex2 imWavefunc02 = complex2(0.0, wavefunc2[1] + wavefunc0[1],
                                             0.0, wavefunc2[3] + wavefunc0[3]);
            complex2 psi = reWavefunc1 + imWavefunc02/2.0;
            float absPsi = sqrt(psi[0]*psi[0] + psi[1]*psi[1]
                                + psi[2]*psi[2] + psi[3]*psi[3]);
            float nx = complex2Dot(conj(psi), sigmaX(psi))[0];
            float ny = complex2Dot(conj(psi), sigmaY(psi))[0];
            float nz = complex2Dot(conj(psi), sigmaZ(psi))[0];
            fragColor = vec4(absPsi*(sqrt(nx*nx + ny*ny)*complexToColour(nx, ny) + abs(nz))
                                + potentialBrightness/50.0, 1.0);
            break;
        default:
            fragColor = vec4((wavefuncBrightness1 + wavefuncBrightness2)
                                *vec3(1.0, 1.0, 1.0)
                                + potentialBrightness/50.0, 1.0);
    }
}