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

uniform sampler2D massTex;
uniform sampler2D posVelTex0;
uniform sampler2D posVelTex1;
uniform sampler2D forceTex;

uniform float dt;
uniform int method;

const int LEAPFROG = 0;

void main() {
    vec4 posVel0 = texture2D(posVelTex0, UV);
    vec4 posVel1 = texture2D(posVelTex1, UV);
    vec4 force1 =  texture2D(forceTex, UV);
    vec4 vel1 = vec4(posVel1[2], posVel1[3], 0.0, 0.0);
    float m = texture2D(massTex, UV)[0];
    if (method == LEAPFROG)
        fragColor = posVel0 + vel1*dt + force1*dt/m;
}
