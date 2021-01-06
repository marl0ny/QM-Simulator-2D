#define NAME realTimeStepFragmentSource
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
    if (fragTexCoord.x > dx/w && fragTexCoord.x < 1.0 - dx/w &&
        fragTexCoord.y > dy/h && fragTexCoord.y < 1.0 - dy/h) {
        float v = texture2D(texV, fragTexCoord).r;
        float rePsi = texture2D(texPsi, fragTexCoord).r;
        float imPsi = texture2D(texPsi, fragTexCoord).g;
        float u = texture2D(texPsi, fragTexCoord + vec2(0.0, dy/h)).g;
        float d = texture2D(texPsi, fragTexCoord + vec2(0.0, -dy/h)).g;
        float l = texture2D(texPsi, fragTexCoord + vec2(-dx/w, 0.0)).g;
        float r = texture2D(texPsi, fragTexCoord + vec2(dx/w, 0.0)).g;
        float div2ImPsi = (u + d + l + r - 4.0*imPsi)/dr2;
        float hamiltonImPsi = -(0.5*hbar*hbar/m)*div2ImPsi + v*imPsi;
        gl_FragColor = vec4(rePsi + hamiltonImPsi*dt, imPsi, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
    }
}