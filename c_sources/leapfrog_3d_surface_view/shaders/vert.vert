#VERSION_NUMBER_PLACEHOLDER

precision highp float;

#if __VERSION__ >= 300
in vec2 uvIndex;
#define texture2D texture
#else
attribute vec2 uvIndex;
#endif

uniform float scale;
uniform vec4 rotationQuaternion;
uniform sampler2D tex;

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
    vec2 uv = texture2D(tex, uvIndex);
    vec4 pos = vec4(u);
    gl_Position = project(rotate(scale*pos, rotationQuaternion));
}
