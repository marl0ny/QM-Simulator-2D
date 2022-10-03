#version 330 core

precision highp float;

#if __VERSION__ >= 300
in vec2 UV;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 UV;
#endif

uniform sampler2D tex;
uniform sampler2D lookupTex;


void main() {
    vec2 lookupPos = texture(lookupTex, UV).xy;
    fragColor = texture(tex, lookupPos);
}