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
uniform sampler2D lookupTex;


void main() {
    vec2 lookupPos = texture2D(lookupTex, UV).xy;
    fragColor = texture2D(tex, lookupPos);
}