precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif

uniform float dt;
uniform float dx;
uniform float dy;
uniform float w;
uniform float h;
uniform float hbar;
uniform float m;
uniform float c;
uniform sampler2D vTex;
uniform sampler2D uTex;
uniform sampler2D potTex;
uniform int useVecPot;
uniform sampler2D vecPotTex;

vec2 mult(vec2 z1, vec2 z2) {
    return vec2(z1.x*z2.x - z1.y*z2.y, 
                z1.x*z2.y + z1.y*z2.x);
}

vec2 conj(vec2 z) {
    return vec2(z.r, -z.g);
}

vec4 getRightUpDownLeftAngles(vec2 xy) {
    float q = 1.0;
    vec4 centre = texture2D(vecPotTex, xy);
    vec4 up = texture2D(vecPotTex, xy + vec2(0.0, dy/h));
    vec4 down = texture2D(vecPotTex, xy + vec2(0.0, -dy/h));
    vec4 left = texture2D(vecPotTex, xy + vec2(-dx/w, 0.0));
    vec4 right = texture2D(vecPotTex, xy + vec2(dx/w, 0.0));
    float thetaR = 0.5*q*(right + centre).x*dx/hbar;
    float thetaU = 0.5*q*(up + centre).y*dy/hbar;
    float thetaD = -0.5*q*(centre + down).y*dy/hbar;
    float thetaL = -0.5*q*(centre + left).x*dx/hbar;
    return vec4(thetaR, thetaU, thetaD, thetaL);
}

vec2 getPhase(float theta) {
    return vec2(cos(theta), -sin(theta));
}

void main() {

    vec2 xy = fragTexCoord;

    vec4 rightU = texture2D(uTex, vec2(xy.x, xy.y-0.5*dy/h));
    vec4 leftU = texture2D(uTex, vec2(xy.x-dx/w, xy.y-0.5*dy/h));
    vec4 upU = texture2D(uTex, vec2(xy.x-0.5*dx/w, xy.y));
    vec4 downU = texture2D(uTex, vec2(xy.x-0.5*dx/w, xy.y-dy/h));
    vec4 dUdx;
    vec4 dUdy;
    if (useVecPot == 1) {
        vec2 loc = xy - 0.5*vec2(dx/w, dy/h);
        vec4 thetaRightUpDownLeft = getRightUpDownLeftAngles(loc);
        vec2 rightPhase = getPhase(thetaRightUpDownLeft[0]);
        vec2 upPhase = getPhase(thetaRightUpDownLeft[1]);
        vec2 downPhase = getPhase(thetaRightUpDownLeft[2]);
        vec2 leftPhase = getPhase(thetaRightUpDownLeft[3]);
        rightU = vec4(mult(rightU.rg, rightPhase),
                      mult(rightU.ba, rightPhase));
        leftU = vec4(mult(leftU.rg, leftPhase),
                     mult(leftU.ba, leftPhase));
        upU = vec4(mult(upU.rg, upPhase),
                   mult(upU.ba, upPhase));
        downU = vec4(mult(downU.rg, downPhase),
                     mult(downU.ba, downPhase));
        dUdx = (rightU - leftU)/dx;
        dUdy = (upU - downU)/dy;
    }
    dUdx = (rightU - leftU)/dx;
    dUdy = (upU - downU)/dy;
    vec4 uDerivatives = vec4(-dUdx[2] - dUdy[3], dUdy[2] - dUdx[3],
                             -dUdx[0] + dUdy[1], -dUdy[0] - dUdx[1]);
    float b = 0.5*(dt/hbar)*(-m*c*c
                             + c*(texture2D(potTex, 
                                            xy-0.5*vec2(dx/w, dy/h))[0]));
    float den = (1.0 + b*b);
    vec4 u = vec4(dot(vec4(1.0, b,  0.0, 0.0), uDerivatives)/den,
                  dot(vec4(-b, 1.0, 0.0, 0.0), uDerivatives)/den,
                  dot(vec4(0.0, 0.0, 1.0, b ), uDerivatives)/den,
                  dot(vec4(0.0, 0.0, -b, 1.0), uDerivatives)/den);

    vec4 prevV = texture2D(vTex, xy);
    vec4 v = vec4(dot(vec4(1.0 - b*b, 2.0*b,  0.0, 0.0), prevV)/den,
                  dot(vec4(-2.0*b, 1.0 - b*b, 0.0, 0.0), prevV)/den,
                  dot(vec4(0.0, 0.0,  1.0 - b*b, 2.0*b), prevV)/den,
                  dot(vec4(0.0, 0.0, -2.0*b, 1.0 - b*b), prevV)/den);

    fragColor = v + c*dt*u;
}
