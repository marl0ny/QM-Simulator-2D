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

uniform sampler2D tex1;
uniform sampler2D tex2;

void main() {
    vec4 v1 = texture2D(tex1, UV);
    vec4 v2 = texture2D(tex2, UV);
    vec4 v3 = v1 + v2;
    fragColor = vec4(v3.rgb, 1.0);
}