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

uniform vec4 scale;
uniform sampler2D tex;

void main() {
    fragColor = scale*texture2D(tex, UV);
}