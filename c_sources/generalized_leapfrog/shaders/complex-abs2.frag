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

#define complex vec2
uniform sampler2D tex;


void main() {
    complex val = texture2D(tex, UV).xy;
    float abs2Val = val.x*val.x + val.y*val.y;
    fragColor = vec4(abs2Val);
}