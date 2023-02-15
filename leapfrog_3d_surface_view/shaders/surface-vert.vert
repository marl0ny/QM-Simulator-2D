#VERSION_NUMBER_PLACEHOLDER

precision highp float;

#if __VERSION__ >= 300
in vec4 position;
out vec2 UV;
#define texture2D texture
#else
attribute vec4 position;
attribute vec2 UV;
#endif

uniform sampler2D tex;
uniform sampler2D tex2;
uniform vec4 rotationQuaternion;
uniform vec3 translate;
uniform float scaleZ;
uniform float scale;

vec4 quaternionMultiply(vec4 q1, vec4 q2) {
    vec4 q3;
    q3.w = q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z;
    q3.x = q1.w*q2.x + q1.x*q2.w + q1.y*q2.z - q1.z*q2.y; 
    q3.y = q1.w*q2.y + q1.y*q2.w + q1.z*q2.x - q1.x*q2.z; 
    q3.z = q1.w*q2.z + q1.z*q2.w + q1.x*q2.y - q1.y*q2.x;
    return q3; 
}

vec4 rotate(vec4 x, vec4 r) {
    vec4 xr = quaternionMultiply(x, r);
    r.x = -r.x;
    r.y = -r.y;
    r.z = -r.z;
    vec4 x2 = quaternionMultiply(r, xr);
    x2.w = 1.0;
    return x2; 
}

vec4 project(vec4 x) {
    vec4 y;
    y[0] = x[0]*5.0/(x[2] + 5.0);
    y[1] = x[1]*5.0/(x[2] + 5.0);
    y[2] = x[2];
    y[3] = 1.0;
    return y;
}


void main() {
    UV = position.xy;
    vec4 psi = texture2D(tex2, UV);
    float absPsi2 = (psi.x*psi.x + psi.y*psi.y)/5.0;
    float absPsi = sqrt(absPsi2);
    vec4 tPosition = scale*(position - vec4(0.5, 0.5,
                                            min(scaleZ*absPsi, 0.5), 0.0));
    gl_Position = project(rotate(tPosition, rotationQuaternion)
                     + vec4(translate, 0.0));
}
