#version 330 core

precision highp float;

#if __VERSION__ >= 300
#define texture2D texture;
in vec2 UV;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 UV;
#endif

uniform sampler2D tex1;
uniform sampler2D tex2;

void main() {
    vec4 v1 = texture(tex1, UV);
    vec4 v2 = texture(tex2, UV);
    vec4 v3 = v1 + v2;
    fragColor = vec4(v3.rgb, 1.0);
}