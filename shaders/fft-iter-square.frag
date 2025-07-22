/* This shader is used to implement the iterative part of the
Cooley-Tukey iterative radix-2 FFT algorithm. It is assumed that 
the width of the input texture is equal to its height.

References:

Wikipedia - Cooley–Tukey FFT algorithm
https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm

MathWorld Wolfram - Fast Fourier Transform:
http://mathworld.wolfram.com/FastFourierTransform.html

William Press et al.
12.2 Fast Fourier Transform (FFT) - in Numerical Recipes
https://websites.pmc.ucsc.edu/~fnimmo/eart290c_17/NumericalRecipesinF77.pdf

*/
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
#define complex vec2
#define complex2 vec4

uniform sampler2D tex;
uniform float blockSize;
uniform float angleSign;
uniform float size;
uniform float scale;

uniform bool useCosTable;
uniform sampler2D cosTableTex;

const float PI = 3.141592653589793;
const complex IMAG_UNIT = complex(0.0, 1.0);


float getValueFromCosTable(float angle) {
    return texture2D(cosTableTex,
                     vec2(angle/PI + 0.5/(size/2.0), 0.5)).r;
}

complex expI(float angle) {
    if (!useCosTable)
        return complex(cos(angle), sin(angle));
    float c = getValueFromCosTable(abs(angle));
    float s = (abs(angle) < PI/2.0)?
        -getValueFromCosTable(abs(angle) + PI/2.0):
        getValueFromCosTable(abs(angle) - PI/2.0);
    return complex(c, sign(angle)*s);
}

complex mul(complex z, complex w) {
    return complex(z.x*w.x - z.y*w.y, z.x*w.y + z.y*w.x);
}

complex2 c2C1(complex2 z, complex w) {
    return complex2(mul(z.rg, w), mul(z.ba, w));
}

void main() {
    vec2 uv = fragTexCoord;
    vec2 blockPosition = vec2(mod(uv[0], blockSize), mod(uv[1], blockSize));
    float h = blockSize/2.0;
    vec2 signFactor = vec2((blockPosition.x <= h)? 1.0: -1.0,
                           (blockPosition.y <= h)? 1.0: -1.0);
    vec2 offset = vec2((blockPosition.x <= h)? 0.0: -1.0,
                       (blockPosition.y <= h)? 0.0: -1.0);
    complex2 ee = texture2D(tex, uv + h*offset);
    complex2 oe = texture2D(tex, uv + h*(vec2(1.0, 0.0) + offset));
    complex2 eo = texture2D(tex, uv + h*(vec2(0.0, 1.0) + offset));
    complex2 oo = texture2D(tex, uv + h*(vec2(1.0, 1.0) + offset));
    vec2 angle = angleSign*2.0*PI*(
        blockPosition - vec2(0.5/size) + h*offset)/blockSize;
    complex eIAngleX = expI(angle.x);
    complex eIAngleY = expI(angle.y);
    fragColor = scale*scale*(ee 
         + signFactor.x*c2C1(oe, eIAngleX) + signFactor.y*c2C1(eo, eIAngleY)
         + signFactor.x*signFactor.y*c2C1(oo, mul(eIAngleX, eIAngleY)));
}
