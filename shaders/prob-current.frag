precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;
uniform float dy;
uniform float w;
uniform float h;
uniform float hbar;
uniform float m;
uniform sampler2D tex;


float realValueAt(sampler2D texPsi, vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.r*tmp.a;
}

float imagValueAt(sampler2D texPsi, vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.g*tmp.a;
}

vec2 getDivRePsi(sampler2D texPsi) {
    float u = realValueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));
    float d = realValueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));
    float l = realValueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));
    float r = realValueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));
    return vec2(0.5*(r - l)/dx, 0.5*(u - d)/dy);
}

vec2 getDivImPsi(sampler2D texPsi) {
    float u = imagValueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));
    float d = imagValueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));
    float l = imagValueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));
    float r = imagValueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));
    return vec2(0.5*(r - l)/dx, 0.5*(u - d)/dy);
}

void main() {
    float rePsi = texture2D(tex, fragTexCoord).r;
    float imPsi = texture2D(tex, fragTexCoord).g;
    vec2 divRePsi = getDivRePsi(tex);
    vec2 divImPsi = getDivImPsi(tex);
    vec2 probCurrent = (hbar/m)*(-imPsi*divRePsi + rePsi*divImPsi);
    fragColor = vec4(probCurrent.x, probCurrent.y, 0.0, 1.0);
}
