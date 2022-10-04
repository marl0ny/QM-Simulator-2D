#version 330 core

precision highp float;

#if __VERSION__ >= 300
in vec2 UV;
out vec4 fragColor;
#define texture2D texture
#else
#define fragColor gl_FragColor
varying highp vec2 UV;
#endif

#define complex2 vec4

const float PI = 3.141592653589793;

uniform complex2 dt;
uniform float m;
uniform float hbar;
uniform float q;
uniform float c;
uniform float dx;
uniform float dy;
uniform float width;
uniform float height;
uniform float pixelWidth;
uniform float pixelHeight;

uniform vec3 vecPotential;
uniform float vecPotentialSquared;

uniform sampler2D wavefuncTex;


complex2 multiply(complex2 w, complex2 z) {
    return complex2(w[0]*z[0] - w[1]*z[1], w[0]*z[1] + w[1]*z[0],
                    w[2]*z[2] - w[3]*z[3], w[2]*z[3] + w[3]*z[2]);
}

complex2 complex2Exp(complex2 z) {
    return complex2(exp(z[0])*cos(z[1]), exp(z[0])*sin(z[1]),
                    exp(z[2])*cos(z[3]), exp(z[2])*sin(z[3]));
}

complex2 IMAG_UNIT = complex2(0.0, 1.0, 0.0, 1.0);

void main() {
    float u = UV[0], v = UV[1];
    float freqU = ((u < 0.5)? u: -1.0 + u) - 0.5/pixelWidth;
    float freqV = ((v < 0.5)? v: -1.0 + v) - 0.5/pixelHeight;
    float px = 2.0*PI*freqU; // *exp(-freqU);
    float py = 2.0*PI*freqV; // *exp(-freqV);
    float pz = 0.0;
    // float p2 = (pixelWidth*width*(1.0 - cos(px*width/pixelWidth))
    //             + pixelHeight*height*(1.0 - cos(py*height/pixelHeight))
    //           )*hbar*hbar/(2.0*m);
    float p2 = px*px + py*py + pz*pz;
    vec3 p = vec3(px, py, pz);
    float kinetic2 = (p2/(2.0*m) - q*dot(vecPotential, p)/(m*c)
                      + q*q/(2.0*m*c*c)*vecPotentialSquared);
    complex2 iDt = multiply(IMAG_UNIT, dt);
    complex2 psi = texture2D(wavefuncTex, UV);
    fragColor = multiply(psi, complex2Exp(-(iDt/hbar)*kinetic2));
}