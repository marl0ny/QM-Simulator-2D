#define NAME imagTimeStepFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform float dx;
uniform float dy;
uniform float dt;
uniform float w;
uniform float h;
uniform float m;
uniform float hbar;
uniform sampler2D texPsi;
uniform sampler2D texV;


void main () {
    float dr2 = dx*dx + dy*dy;
    float v = texture2D(texV, fragTexCoord).r;
    float rePsi = texture2D(texPsi, fragTexCoord).r;
    float imPsi = texture2D(texPsi, fragTexCoord).g;
    float u = texture2D(texPsi, fragTexCoord + vec2(0.0, dy/h)).r;
    float d = texture2D(texPsi, fragTexCoord + vec2(0.0, -dy/h)).r;
    float l = texture2D(texPsi, fragTexCoord + vec2(-dx/w, 0.0)).r;
    float r = texture2D(texPsi, fragTexCoord + vec2(dx/w, 0.0)).r;
    float div2RePsi = (u + d + l + r - 4.0*rePsi)/dr2;
    float hamiltonRePsi = -(0.5*hbar*hbar/m)*div2RePsi + v*rePsi;
    gl_FragColor = vec4(rePsi, imPsi - hamiltonRePsi*dt, 0.0, 1.0);
}