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

uniform float width;
uniform float height;
uniform float dx;
uniform float dy;
uniform sampler2D tex;


vec4 centredXDerivative4thOrder(sampler2D tex) {
    vec4 L2 = texture2D(tex, UV - 2.0*vec2(dx/width, 0.0));
    vec4 L1 = texture2D(tex, UV -     vec2(dx/width, 0.0));
    vec4 r1 = texture2D(tex, UV +     vec2(dx/width, 0.0));
    vec4 r2 = texture2D(tex, UV + 2.0*vec2(dx/width, 0.0));
    return (-r2/12.0 + 2.0*r1/3.0 - 2.0*L1/3.0 + L2/12.0)/dx;
}

vec4 centredYDerivative4thOrder(sampler2D tex) {
    vec4 u2 = texture2D(tex, UV + 2.0*vec2(0.0, dy/height));
    vec4 u1 = texture2D(tex, UV +     vec2(0.0, dy/height));
    vec4 d1 = texture2D(tex, UV -     vec2(0.0, dy/height));
    vec4 d2 = texture2D(tex, UV - 2.0*vec2(0.0, dy/height));
    return (-u2/12.0 + 2.0*u1/3.0 - 2.0*d1/3.0 + d2/12.0)/dy;
}

void main() {
    float dFyDx = centredXDerivative4thOrder(tex).y;
    float dFxDy = centredYDerivative4thOrder(tex).x;
    fragColor = vec4(0.0, 0.0, dFyDx - dFxDy, 1.0);
}
