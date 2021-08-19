precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float pixelW;
uniform float pixelH;
uniform sampler2D uTex;
uniform sampler2D vTex1;
uniform sampler2D vTex2;


void main() {
    vec4 u = texture2D(uTex, fragTexCoord);
    vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);
    vec4 v1 = texture2D(vTex1, fragTexCoord + offset);
    vec4 v2 = texture2D(vTex2, fragTexCoord + offset);
    vec4 v = (v1 + v2)/2.0;
    vec4 probs = vec4(u[0]*u[0] + u[1]*u[1], u[2]*u[2] + u[3]*u[3],
                      v[0]*v[0] + v[1]*v[1], v[2]*v[2] + v[3]*v[3]);
    fragColor = probs;
}