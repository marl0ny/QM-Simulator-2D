#version 330 core

precision highp float;

#if __VERSION__ >= 300
in vec2 UV;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 UV;
#endif

uniform float m;
uniform float hbar;
uniform float c;
uniform float q;
uniform float dt;
uniform float dx;
uniform float dy;
uniform float width;
uniform float height;
uniform sampler2D wavefuncTex0;
uniform sampler2D wavefuncTex1;
uniform sampler2D potentialTex;

uniform bool useFTForMomentumTerms;
uniform sampler2D p2wavefuncTex;
uniform sampler2D gradXWavefuncTex;
uniform sampler2D gradYWavefuncTex;

uniform bool enableBFieldSpinInteraction;
uniform sampler2D magneticFieldTex;

uniform bool addNonlinearTerms;
uniform sampler2D nonlinearTex;

#define complex vec2
#define complex2 vec4

const complex2 IMAG_UNIT = complex2(0.0, 1.0, 0.0, 1.0);

complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}

complex2 conj(complex2 z) {
    return complex2(z[0], -z[1], z[2], -z[3]);
}

float absComplex2(complex2 z) {
    return sqrt(z[0]*z[0] + z[1]*z[1] + z[2]*z[2] + z[3]*z[3]);
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

complex2 centredXDerivative4thOrder(sampler2D wavefuncTex) {
    complex2 L2 = texture(wavefuncTex, UV - 2.0*vec2(dx/width, 0.0));
    complex2 L1 = texture(wavefuncTex, UV -     vec2(dx/width, 0.0));
    complex2 r1 = texture(wavefuncTex, UV +     vec2(dx/width, 0.0));
    complex2 r2 = texture(wavefuncTex, UV + 2.0*vec2(dx/width, 0.0));
    return (-r2/12.0 + 2.0*r1/3.0 - 2.0*L1/3.0 + L2/12.0)/dx;
}

complex2 centredYDerivative4thOrder(sampler2D wavefuncTex) {
    complex2 u2 = texture(wavefuncTex, UV + 2.0*vec2(0.0, dy/height));
    complex2 u1 = texture(wavefuncTex, UV +     vec2(0.0, dy/height));
    complex2 d1 = texture(wavefuncTex, UV -     vec2(0.0, dy/height));
    complex2 d2 = texture(wavefuncTex, UV - 2.0*vec2(0.0, dy/height));
    return (-u2/12.0 + 2.0*u1/3.0 - 2.0*d1/3.0 + d2/12.0)/dy;
}

complex2 laplacian2ndOrder4Point(sampler2D wavefuncTex) {
    complex2 u = texture(wavefuncTex, UV + vec2(0.0, dy/height));
    complex2 d = texture(wavefuncTex, UV - vec2(0.0, dy/height));
    complex2 l = texture(wavefuncTex, UV - vec2(dx/width, 0.0));
    complex2 r = texture(wavefuncTex, UV + vec2(dx/width, 0.0));
    complex2 c = texture(wavefuncTex, UV);
    return (u + d - 2.0*c)/(dy*dy) + (l + r - 2.0*c)/(dx*dx);
}

complex2 laplacian4thOrder9Point(sampler2D wavefuncTex) {
    complex2 u2 = texture(wavefuncTex, UV + 2.0*vec2(0.0, dy/height));
    complex2 u1 = texture(wavefuncTex, UV +     vec2(0.0, dy/height));
    complex2 d1 = texture(wavefuncTex, UV -     vec2(0.0, dy/height));
    complex2 d2 = texture(wavefuncTex, UV - 2.0*vec2(0.0, dy/height));
    complex2 L2 = texture(wavefuncTex, UV - 2.0*vec2(dx/width, 0.0));
    complex2 L1 = texture(wavefuncTex, UV -     vec2(dx/width, 0.0));
    complex2 r1 = texture(wavefuncTex, UV +     vec2(dx/width, 0.0));
    complex2 r2 = texture(wavefuncTex, UV + 2.0*vec2(dx/width, 0.0));
    complex2 c0 = texture(wavefuncTex, UV);
    float dy2 = dy*dy, dx2 = dx*dx;
    return (-u2/12.0 + 4.0*u1/3.0 - 5.0*c0/2.0 + 4.0*d1/3.0 - d2/12.0)/dy2
            + (-L2/12.0 + 4.0*L1/3.0 - 5.0*c0/2.0 + 4.0*r1/3.0 - r2/12.0)/dx2;
}

void main() {
    complex2 psi0 = texture(wavefuncTex0, UV);
    complex2 psi1 = texture(wavefuncTex1, UV);
    complex2 potential = texture(potentialTex, UV);
    complex2 potentialPsi1 = psi1*potential.w;
    complex2 hPsi1;
    complex2 gradXPsi1, gradYPsi1;
    complex2 spinInt = complex2(0.0, 0.0, 0.0, 0.0);
    // The Pauli Equation which discribes how
    // a spin 1/2 particle interacts with a magnetic field
    // in the nonrelativistic limit
    // is found in  Shankar, 568
    // 
    // Shankar, R. (1994). Spin. 
    // In Principles of Quantum Mechanics, 
    // chapter 14. Springer.
    // 
    // Shankar, R. (1994). The Dirac Equation. 
    // In Principles of Quantum Mechanics, chapter 20. 
    // Springer.
    if (enableBFieldSpinInteraction) {
        vec3 magneticField = texture(magneticFieldTex, UV).xyz;
        float bx = magneticField.x, by = magneticField.y;
        float bz = magneticField.z;
        // TODO check units
        spinInt = -(q*hbar/(2.0*m*c))*(bx*sigmaX(psi1)
                                       + by*sigmaY(psi1)
                                       + bz*sigmaZ(psi1));
    }
    if (useFTForMomentumTerms) {
        complex2 p2Psi1 = texture(p2wavefuncTex, UV);
        gradXPsi1 = texture(gradXWavefuncTex, UV);
        gradYPsi1 = texture(gradYWavefuncTex, UV);
        float ax = potential.x;
        float ay = potential.y;
        complex2 k1 = p2Psi1/(2.0*m);
        complex2 k2 = hbar*q*(multiply(IMAG_UNIT, ax*gradXPsi1)
                                + multiply(IMAG_UNIT, ay*gradYPsi1))/(m*c);
        hPsi1 = k1 + k2 + spinInt + potentialPsi1;
    } else {
        // complex2 laplacianPsi1 = laplacian2ndOrder4Point(wavefuncTex1);
        complex2 laplacianPsi1 = laplacian4thOrder9Point(wavefuncTex1);
        complex2 k1 = -(hbar*hbar)*laplacianPsi1/(2.0*m);
        gradXPsi1 = centredXDerivative4thOrder(wavefuncTex1);
        gradYPsi1 = centredYDerivative4thOrder(wavefuncTex1);
        float ax = potential.x, ay = potential.y;
        complex2 k2 = hbar*q*(multiply(IMAG_UNIT, ax*gradXPsi1)
                               + multiply(IMAG_UNIT, ay*gradYPsi1))/(m*c);
        hPsi1 = k1 + k2 + spinInt + potentialPsi1;
    }
    complex2 nonlinear = complex2(0.0, 0.0, 0.0, 0.0);
    if (addNonlinearTerms)
        nonlinear = multiply(texture(nonlinearTex, UV), psi1);
    complex2 psi2 = -(dt/hbar)*multiply(IMAG_UNIT, hPsi1 + nonlinear) + psi0;
    fragColor = psi2;
}
