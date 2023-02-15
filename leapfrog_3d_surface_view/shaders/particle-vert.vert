#VERSION_NUMBER_PLACEHOLDER

precision highp float;

#if __VERSION__ >= 300
in vec2 uvIndex;
#define texture2D texture
#else
attribute vec2 uvIndex;
#endif

uniform sampler2D tex;

void main() {
    vec4 posVel = texture2D(tex, uvIndex);
    gl_Position = vec4(2.0*posVel.xy - 1.0, 0.0, 1.0);
}
