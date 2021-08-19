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


vec4 multiplyBySigmaX(vec4 x) {
    return vec4(dot(vec4(0.0, 0.0, 1.0, 0.0), x),
                dot(vec4(0.0, 0.0, 0.0, 1.0), x),
                dot(vec4(1.0, 0.0, 0.0, 0.0), x),
                dot(vec4(0.0, 1.0, 0.0, 0.0), x));
}


vec4 multiplyBySigmaY(vec4 x) {
    return vec4(dot(vec4(0.0, 0.0, 0.0, 1.0), x),
                dot(vec4(0.0, 0.0, -1.0, 0.0), x),
                dot(vec4(0.0, -1.0, 0.0, 0.0), x),
                dot(vec4(1.0, 0.0, 0.0, 0.0), x));
}


vec4 multiplyBySigmaZ(vec4 x) {
    return vec4(dot(vec4(1.0, 0.0, 0.0, 0.0), x),
                dot(vec4(0.0, 1.0, 0.0, 0.0), x),
                dot(vec4(0.0, 0.0, -1.0, 0.0), x),
                dot(vec4(0.0, 0.0, 0.0, -1.0), x));
}


void main() {
    vec4 u = texture2D(uTex, fragTexCoord);
    vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);
    vec4 v1 = texture2D(vTex1, fragTexCoord + offset);
    vec4 v2 = texture2D(vTex2, fragTexCoord + offset);
    vec4 v = (v1 + v2)/2.0;
    vec4 current;
    current[0] = u[0]*u[0] + u[1]*u[1] + u[2]*u[2] + u[3]*u[3]
                  + v[0]*v[0] + v[1]*v[1] + v[2]*v[2] + v[3]*v[3];

    current[1] = dot(u, multiplyBySigmaX(v)) 
                  + dot(v, multiplyBySigmaX(u));
    current[2] = dot(u, multiplyBySigmaY(v)) 
                  + dot(v, multiplyBySigmaY(u));
    current[3] = dot(u, multiplyBySigmaZ(v)) 
                  + dot(v, multiplyBySigmaZ(u));
    fragColor = current;
}
