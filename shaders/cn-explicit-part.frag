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
uniform float dt;
uniform float w;
uniform float h;
uniform float m;
uniform float hbar;
uniform float rScaleV;
uniform sampler2D texPsi;
uniform sampler2D texV;

float realValueAt(vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.r*tmp.a;
}

float imagValueAt(vec2 location) {
    vec4 tmp = texture2D(texPsi, location);
    return tmp.g*tmp.a;
}

float getDiv2RePsi(float rePsi) {
    float u = realValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = realValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = realValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = realValueAt(fragTexCoord + vec2(dx/w, 0.0));
    return (u + d + l + r - 4.0*rePsi)/(dx*dx);
}

float getDiv2ImPsi(float imPsi) {
    float u = imagValueAt(fragTexCoord + vec2(0.0, dy/h));
    float d = imagValueAt(fragTexCoord + vec2(0.0, -dy/h));
    float l = imagValueAt(fragTexCoord + vec2(-dx/w, 0.0));
    float r = imagValueAt(fragTexCoord + vec2(dx/w, 0.0));
    return (u + d + l + r - 4.0*imPsi)/(dx*dx);
}

void main() {
    float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r + 
               rScaleV*texture2D(texV, fragTexCoord).g;
    vec4 psi = texture2D(texPsi, fragTexCoord);
    // TODO: do an electromagnetic field where
    // H = e**2*A**2/(2*m) - e*A*p/(2*m) - e*p*(A/(2*m)) + p**2/(2*m) + V
    // H = p**2/(2*m) - e*A*p/(2*m) - e*p*(A/(2*m)) + (e**2*A**2/(2*m) + V)
    // V_A = (e**2*A**2/(2*m) + V)
    // H = (1/(2*m))*p**2 - (e/(2*m))*A*p - (e/(2*m))*p*A + V_A
    // H psi = (1/(2*m))*p**2 psi - (e/(2*m))*A*p psi
    //          - (e/(2*m))*p (A psi) + V_A psi
    float reKinetic = (-hbar*hbar/(2.0*m))*getDiv2RePsi(psi.r);
    float imKinetic = (-hbar*hbar/(2.0*m))*getDiv2ImPsi(psi.g);
    float hamiltonRePsi = reKinetic + V*psi.r;
    float hamiltonImPsi = imKinetic + V*psi.g;
    // 1 - i*dt*H/(2.0*hbar)
    fragColor = vec4(psi.r + dt/(2.0*hbar)*hamiltonImPsi,
                     psi.g - dt/(2.0*hbar)*hamiltonRePsi, 0.0, psi.a
                     );
}
