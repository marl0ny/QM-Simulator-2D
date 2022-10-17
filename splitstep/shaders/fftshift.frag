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
uniform bool isVertical;


void main() {
    float u = UV[0];
    float v = UV[1];
    if (!isVertical) {
        if (u < 0.5) {
            fragColor = texture2D(tex, vec2(u + 0.5, v));
        } else {
            fragColor = texture2D(tex, vec2(u - 0.5, v));
        }
    } else {
        if (v < 0.5) {
            fragColor = texture2D(tex, vec2(u, v + 0.5));
        } else {
            fragColor = texture2D(tex, vec2(u, v - 0.5));
        }
    }
}