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

uniform sampler2D tex;
uniform float blockSize;
uniform bool isVertical;
uniform float angleSign;
uniform float size;
uniform float scale;

const float TAU = 6.283185307179586;

vec4 getOdd1(float x, float y) {
    return (!isVertical)? texture2D(tex, vec2(x + blockSize/2.0, y)):
                          texture2D(tex, vec2(x, y + blockSize/2.0));
}

vec4 getEven2(float x, float y) {
    return (!isVertical)? texture2D(tex, vec2(x - blockSize/2.0, y)):
                          texture2D(tex, vec2(x, y - blockSize/2.0));
}

void main() {
    float val = (!isVertical)? mod(UV[0], blockSize): mod(UV[1], blockSize);
    // even lower half
    vec4 even1 = texture2D(tex, UV);
    vec4 odd1 = getOdd1(UV[0], UV[1]);
    float phi1 = angleSign*TAU*(val - 0.5/size)/(blockSize);
    float cos_val1 = cos(phi1);
    float sin_val1 = sin(phi1);
    vec4 expOdd1 = vec4(odd1.r*cos_val1 - odd1.g*sin_val1,
                        odd1.r*sin_val1 + odd1.g*cos_val1,
                        odd1.b*cos_val1 - odd1.a*sin_val1,
                        odd1.b*sin_val1 + odd1.a*cos_val1);
    vec4 out1 = scale*(even1 + expOdd1);
    // odd upper half
    vec4 even2 = getEven2(UV[0], UV[1]);
    vec4 odd2 = texture2D(tex, UV);
    float phi2 = angleSign*TAU*((val - 0.5/size) - blockSize/2.0)/(blockSize);
    float cos_val2 = cos(phi2);
    float sin_val2 = sin(phi2);
    vec4 expOdd2 = vec4(odd2.r*cos_val2 - odd2.g*sin_val2,
                        odd2.r*sin_val2 + odd2.g*cos_val2,
                        odd2.b*cos_val2 - odd2.a*sin_val2,
                        odd2.b*sin_val2 + odd2.a*cos_val2);
    vec4 out2 = scale*(even2 - expOdd2);
    fragColor = (val <= blockSize/2.0)? out1: out2;
}