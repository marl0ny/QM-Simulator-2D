#version 330 core

precision highp float;

#if __VERSION__ >= 300
in vec2 UV;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 UV;
#endif

uniform float hbar;
uniform float dx;
uniform float dy;
uniform float width;
uniform float height;
uniform bool is_density_constant;
uniform sampler2D wavefuncTex;

#define complex2 vec4

const complex2 IMAG_UNIT = complex2(0.0, 1.0, 0.0, 1.0);

complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}

complex2 conj(complex2 z) {
    return complex2(z[0], -z[1], z[2], -z[3]);
}

    
complex2 centredXDerivative2ndOrder(sampler2D wavefuncTex) {
    complex2 l = texture(wavefuncTex, UV - vec2(dx/width, 0.0));
    complex2 r = texture(wavefuncTex, UV + vec2(dx/width, 0.0));
    return 0.5*(r - l)/dx;
}

complex2 centredYDerivative2ndOrder(sampler2D wavefuncTex) {
    complex2 u = texture(wavefuncTex, UV + vec2(0.0, dy/height));
    complex2 d = texture(wavefuncTex, UV - vec2(0.0, dy/height));
    return 0.5*(u - d)/dy;
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


void main() {
    complex2 psi = texture(wavefuncTex, UV);
    complex2 dPsiDX = centredXDerivative2ndOrder(wavefuncTex);
    complex2 dPsiDY = centredYDerivative2ndOrder(wavefuncTex);
    complex2 absPsi2 = multiply(conj(psi), psi);
    float density = absPsi2[0] + absPsi2[2];
    complex2 tmp1;
    tmp1 = (hbar/density)*multiply(-conj(psi), multiply(IMAG_UNIT, dPsiDX));
    float jx = (tmp1[0] + tmp1[2])/density;
    complex2 tmp2;
    tmp2 = (hbar/density)*multiply(-conj(psi), multiply(IMAG_UNIT, dPsiDY));
    float jy = (tmp2[0] + tmp2[2])/density;
    fragColor = vec4(jx, jy, 0.0, density);
}