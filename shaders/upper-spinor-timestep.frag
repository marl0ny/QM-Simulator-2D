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
    vec4 rightV = texture2D(vTex, vec2(xy.x+dx/w, xy.y+0.5*dy/h));
    vec4 leftV = texture2D(vTex, vec2(xy.x, xy.y+0.5*dy/h));
    vec4 upV = texture2D(vTex, vec2(xy.x+0.5*dx/w, xy.y+dy/h));
    vec4 downV = texture2D(vTex, vec2(xy.x+0.5*dx/w, xy.y));
    vec4 dVdx;
    vec4 dVdy;
    if (useVecPot == 1) {
        vec2 loc = xy;
        vec4 thetaRightUpDownLeft = getRightUpDownLeftAngles(loc);
        vec2 rightPhase = getPhase(thetaRightUpDownLeft[0]);
        vec2 upPhase = getPhase(thetaRightUpDownLeft[1]);
        vec2 downPhase = getPhase(thetaRightUpDownLeft[2]);
        vec2 leftPhase = getPhase(thetaRightUpDownLeft[3]);
        rightV = vec4(mult(rightV.rg, rightPhase),
                      mult(rightV.ba, rightPhase));
        leftV = vec4(mult(leftV.rg, leftPhase),
                     mult(leftV.ba, leftPhase));
        upV = vec4(mult(upV.rg, upPhase),
                   mult(upV.ba, upPhase));
        downV = vec4(mult(downV.rg, downPhase),
                     mult(downV.ba, downPhase));
        dVdx = (rightV - leftV)/dx;
        dVdy = (upV - downV)/dy;
    }
    dVdx = (rightV - leftV)/dx;
    dVdy = (upV - downV)/dy;
    vec4 vDerivatives = vec4(-dVdx[2] - dVdy[3], dVdy[2] - dVdx[3],
                             -dVdx[0] + dVdy[1], -dVdy[0] - dVdx[1]);
    float a = 0.5*(dt/hbar)*(m*c*c + c*texture2D(potTex, xy)[0]);
    float den = (1.0 + a*a);
    vec4 v = vec4(dot(vec4(1.0, a,  0.0, 0.0), vDerivatives)/den,
                  dot(vec4(-a, 1.0, 0.0, 0.0), vDerivatives)/den,
                  dot(vec4(0.0, 0.0, 1.0, a),  vDerivatives)/den,
                  dot(vec4(0.0, 0.0, -a, 1.0), vDerivatives)/den);

    vec4 prevU = texture2D(uTex, xy);
    vec4 u = vec4(dot(vec4(1.0 - a*a, 2.0*a,  0.0, 0.0), prevU)/den,
                  dot(vec4(-2.0*a, 1.0 - a*a, 0.0, 0.0), prevU)/den,
                  dot(vec4(0.0, 0.0,  1.0 - a*a, 2.0*a), prevU)/den,
                  dot(vec4(0.0, 0.0, -2.0*a, 1.0 - a*a), prevU)/den);

    fragColor = u + c*dt*v;
}
