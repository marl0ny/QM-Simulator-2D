const staggeredProbCurrentFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;uniform float dy;uniform float w;uniform float h;uniform float hbar;uniform float m;uniform sampler2D tex1;uniform sampler2D tex2;uniform sampler2D tex3;float realValueAt(sampler2D texPsi, vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.r*tmp.a;}float imagValueAt(sampler2D texPsi, vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.g*tmp.a;}vec2 getDivRePsi(sampler2D texPsi) {float u = realValueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));float d = realValueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));float l = realValueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));float r = realValueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));return vec2(0.5*(r - l)/dx, 0.5*(u - d)/dy);}vec2 getDivImPsi(sampler2D texPsi) {float u = imagValueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));float d = imagValueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));float l = imagValueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));float r = imagValueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));return vec2(0.5*(r - l)/dx, 0.5*(u - d)/dy);}void main() {float rePsi = texture2D(tex2, fragTexCoord).r;float imPsi = 0.5*(texture2D(tex1, fragTexCoord).g+ texture2D(tex3, fragTexCoord).g);vec2 divRePsi = getDivRePsi(tex2);vec2 divImPsi = (getDivImPsi(tex1) + getDivImPsi(tex3))/2.0;vec2 probCurrent = (hbar/m)*(-imPsi*divRePsi + rePsi*divImPsi);fragColor = vec4(probCurrent.x, probCurrent.y, 0.0, 1.0);}`;
const diracCurrentFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float pixelW;uniform float pixelH;uniform sampler2D uTex;uniform sampler2D vTex1;uniform sampler2D vTex2;vec4 multiplyBySigmaX(vec4 x) {return vec4(dot(vec4(0.0, 0.0, 1.0, 0.0), x),dot(vec4(0.0, 0.0, 0.0, 1.0), x),dot(vec4(1.0, 0.0, 0.0, 0.0), x),dot(vec4(0.0, 1.0, 0.0, 0.0), x));}vec4 multiplyBySigmaY(vec4 x) {return vec4(dot(vec4(0.0, 0.0, 0.0, 1.0), x),dot(vec4(0.0, 0.0, -1.0, 0.0), x),dot(vec4(0.0, -1.0, 0.0, 0.0), x),dot(vec4(1.0, 0.0, 0.0, 0.0), x));}vec4 multiplyBySigmaZ(vec4 x) {return vec4(dot(vec4(1.0, 0.0, 0.0, 0.0), x),dot(vec4(0.0, 1.0, 0.0, 0.0), x),dot(vec4(0.0, 0.0, -1.0, 0.0), x),dot(vec4(0.0, 0.0, 0.0, -1.0), x));}void main() {vec4 u = texture2D(uTex, fragTexCoord);vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);vec4 v1 = texture2D(vTex1, fragTexCoord + offset);vec4 v2 = texture2D(vTex2, fragTexCoord + offset);vec4 v = (v1 + v2)/2.0;vec4 current;current[0] = u[0]*u[0] + u[1]*u[1] + u[2]*u[2] + u[3]*u[3]+ v[0]*v[0] + v[1]*v[1] + v[2]*v[2] + v[3]*v[3];current[1] = dot(u, multiplyBySigmaX(v))+ dot(v, multiplyBySigmaX(u));current[2] = dot(u, multiplyBySigmaY(v))+ dot(v, multiplyBySigmaY(u));current[3] = dot(u, multiplyBySigmaZ(v))+ dot(v, multiplyBySigmaZ(u));fragColor = current;}`;
const diracProbDensityFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float pixelW;uniform float pixelH;uniform sampler2D uTex;uniform sampler2D vTex1;uniform sampler2D vTex2;void main() {vec4 u = texture2D(uTex, fragTexCoord);vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);vec4 v1 = texture2D(vTex1, fragTexCoord + offset);vec4 v2 = texture2D(vTex2, fragTexCoord + offset);vec4 v = (v1 + v2)/2.0;vec4 probs = vec4(u[0]*u[0] + u[1]*u[1], u[2]*u[2] + u[3]*u[3],v[0]*v[0] + v[1]*v[1], v[2]*v[2] + v[3]*v[3]);fragColor = probs;}`;
const diracViewFragmentSource = `
#define NAME viewFrameFragmentSource
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float constPhase;uniform float psiBrightness;uniform float potBrightness;uniform float pixelW;uniform float pixelH;uniform float showPsi1;uniform float showPsi2;uniform float showPsi3;uniform float showPsi4;uniform sampler2D vTex1;uniform sampler2D vTex2;uniform sampler2D uTex;uniform sampler2D potTex;uniform sampler2D guiTex;uniform sampler2D vecTex;uniform int displayMode;vec3 complexToColour(float re, float im) {float pi = 3.141592653589793;float argVal = atan(im, re);float maxCol = 1.0;float minCol = 50.0/255.0;float colRange = maxCol - minCol;if (argVal <= pi/3.0 && argVal >= 0.0) {return vec3(maxCol,minCol + colRange*argVal/(pi/3.0), minCol);} else if (argVal > pi/3.0 && argVal <= 2.0*pi/3.0){return vec3(maxCol - colRange*(argVal - pi/3.0)/(pi/3.0),maxCol, minCol);} else if (argVal > 2.0*pi/3.0 && argVal <= pi){return vec3(minCol, maxCol,minCol + colRange*(argVal - 2.0*pi/3.0)/(pi/3.0));} else if (argVal < 0.0 && argVal > -pi/3.0){return vec3(maxCol, minCol,minCol - colRange*argVal/(pi/3.0));} else if (argVal <= -pi/3.0 && argVal > -2.0*pi/3.0){return vec3(maxCol + (colRange*(argVal + pi/3.0)/(pi/3.0)),minCol, maxCol);} else if (argVal <= -2.0*pi/3.0 && argVal >= -pi){return vec3(minCol,minCol - (colRange*(argVal + 2.0*pi/3.0)/(pi/3.0)), maxCol);}else {return vec3(minCol, maxCol, maxCol);}}void main () {vec4 gui = texture2D(guiTex, fragTexCoord);vec4 vec = texture2D(vecTex, fragTexCoord);vec2 offset = 0.5*vec2(1.0/pixelW, 1.0/pixelH);vec4 u = texture2D(uTex, fragTexCoord);vec4 v1 = texture2D(vTex1, fragTexCoord + offset);vec4 v2 = texture2D(vTex2, fragTexCoord + offset);vec4 v = (v1 + v2)/2.0;vec4 probs = vec4(showPsi1*(u[0]*u[0] + u[1]*u[1]),showPsi2*(u[2]*u[2] + u[3]*u[3]),showPsi3*(v[0]*v[0] + v[1]*v[1]),showPsi4*(v[2]*v[2] + v[3]*v[3]));vec3 pot = texture2D(potTex, fragTexCoord).rrr;vec3 col;vec4 notPhaseProb;vec4 phaseProb;vec3 ones = vec3(1.0, 1.0, 1.0);if (displayMode == 0) {col = complexToColour(u[0]*cos(constPhase) - u[1]*sin(constPhase),u[0]*sin(constPhase) + u[1]*cos(constPhase));notPhaseProb = vec4((probs[1] + probs[2] + probs[3])*ones, 1.0);phaseProb = vec4(probs[0]*col, 1.0);} else if (displayMode == 1) {col = complexToColour(u[2]*cos(constPhase) - u[3]*sin(constPhase),u[2]*sin(constPhase) + u[3]*cos(constPhase));notPhaseProb = vec4((probs[0] + probs[2] + probs[3])*ones, 1.0);phaseProb = vec4(probs[1]*col, 1.0);} else if (displayMode == 2) {col = complexToColour(v[0]*cos(constPhase) - v[1]*sin(constPhase),v[0]*sin(constPhase) + v[1]*cos(constPhase));notPhaseProb = vec4((probs[0] + probs[1] + probs[3])*ones, 1.0);phaseProb = vec4(probs[2]*col, 1.0);} else if (displayMode == 3) {col = complexToColour(v[2]*cos(constPhase) - v[3]*sin(constPhase),v[2]*sin(constPhase) + v[3]*cos(constPhase));notPhaseProb = vec4((probs[0] + probs[1] + probs[2])*ones, 1.0);phaseProb = vec4(probs[3]*col, 1.0);} else if (displayMode == 4) {float pi = 3.141592653589793;float p1 = probs[0] + probs[1];float p2 = probs[2] + probs[3];float a = p1 + p2;col = complexToColour(sqrt(p1)*cos(6.0*pi/5.0)- sqrt(p2)*sin(6.0*pi/5.0),sqrt(p1)*sin(6.0*pi/5.0)+ sqrt(p2)*cos(6.0*pi/5.0));notPhaseProb = vec4(0.0, 0.0, 0.0, 1.0);phaseProb = vec4(a*col, 1.0);} else {notPhaseProb = vec4((probs[0] + probs[1]+ probs[2] + probs[3])*ones, 1.0);phaseProb = vec4(0.0, 0.0, 0.0, 1.0);}vec4 pixColor = psiBrightness*(phaseProb + notPhaseProb)+ vec4(10.0*potBrightness*pot/1000.0, 1.0);fragColor = vec4(pixColor.rgb, 1.0) + gui + vec;}`;
const vertexShaderSource = `
#if __VERSION__ == 300
in vec3 pos;out highp vec2 fragTexCoord;
#else
attribute vec3 pos;varying highp vec2 fragTexCoord;
#endif
void main() {gl_Position = vec4(pos.xyz, 1.0);fragTexCoord = vec2(0.5, 0.5) + pos.xy/2.0;}`;
const probCurrentFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;uniform float dy;uniform float w;uniform float h;uniform float hbar;uniform float m;uniform sampler2D tex;float realValueAt(sampler2D texPsi, vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.r*tmp.a;}float imagValueAt(sampler2D texPsi, vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.g*tmp.a;}vec2 getDivRePsi(sampler2D texPsi) {float u = realValueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));float d = realValueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));float l = realValueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));float r = realValueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));return vec2(0.5*(r - l)/dx, 0.5*(u - d)/dy);}vec2 getDivImPsi(sampler2D texPsi) {float u = imagValueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));float d = imagValueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));float l = imagValueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));float r = imagValueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));return vec2(0.5*(r - l)/dx, 0.5*(u - d)/dy);}void main() {float rePsi = texture2D(tex, fragTexCoord).r;float imPsi = texture2D(tex, fragTexCoord).g;vec2 divRePsi = getDivRePsi(tex);vec2 divImPsi = getDivImPsi(tex);vec2 probCurrent = (hbar/m)*(-imPsi*divRePsi + rePsi*divImPsi);fragColor = vec4(probCurrent.x, probCurrent.y, 0.0, 1.0);}`;
const initialPotentialFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform int potentialType;uniform float a;uniform float y0;uniform float w;uniform float spacing;uniform float x1;uniform float x2;
#define SHO 1
#define DOUBLE_SLIT 2
#define SINGLE_SLIT 3
#define STEP 4
#define INV_R 5
#define TRIPLE_SLIT 6
#define NEG_INV_R 7
void main() {float x = fragTexCoord.x;float y = fragTexCoord.y;if (potentialType == SHO) {fragColor = vec4(a*((x-0.5)*(x-0.5) + (y-0.5)*(y-0.5)), 0.0, 0.0, 1.0);} else if (potentialType == DOUBLE_SLIT) {if (y <= (y0 + w/2.0) &&y >= (y0 - w/2.0) &&(x <= x1 - spacing/2.0 ||(x >= x1 + spacing/2.0 &&x <= x2 - spacing/2.0) || x >= x2 + spacing/2.0)) {fragColor = vec4(a, 0.0, 0.0, 1.0);} else {fragColor = vec4(0.0, 0.0, 0.0, 1.0);}} else if (potentialType == SINGLE_SLIT) {if (y <= (y0 + w/2.0) &&y >= (y0 - w/2.0) &&(x <= x1 - spacing/2.0 ||x >= x1 + spacing/2.0)) {fragColor = vec4(a, 0.0, 0.0, 1.0);} else {fragColor = vec4(0.0, 0.0, 0.0, 1.0);}} else if (potentialType == STEP) {if (y > y0) {fragColor = vec4(a, 0.0, 0.0, 1.0);} else {fragColor = vec4(0.0, 0.0, 0.0, 1.0);}} else if (potentialType == INV_R) {float u = 10.0*(x - 0.5);float v = 10.0*(y - 0.5);float oneOverR = 1.0/sqrt(u*u + v*v);float val = (oneOverR < 50.0)? oneOverR: 50.0;fragColor = vec4(val, 0.0, 0.0, 1.0);} else if (potentialType == TRIPLE_SLIT) {float val = 15.0;if ((y <= 0.45 || y >= 0.48) || (x > 0.49 && x < 0.51)|| (x > 0.43 && x < 0.45) || (x > 0.55 && x < 0.57)) {fragColor = vec4(0.0, 0.0, 0.0, 1.0);} else {fragColor = vec4(val, 0.0, 0.0, 1.0);}} else if (potentialType == NEG_INV_R) {float u = 2.0*(x - 0.5);float v = 2.0*(y - 0.5);float oneOverR = -1.0/sqrt(u*u + v*v);float val = (oneOverR < -150.0)? -150.0: oneOverR;fragColor = vec4(val + 50.0, 0.0, 0.0, 1.0);} else {float val = 0.0;fragColor = vec4(0.0, 0.0, -val, 1.0);}}`;
const initialUpperSpinorFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float bx;uniform float by;uniform float kx;uniform float ky;uniform float sx;uniform float sy;uniform float amp;uniform float m;uniform float c;uniform float w;uniform float h;uniform float pixelW;uniform float pixelH;uniform float t;uniform float hbar;float sqrt2 = 1.4142135623730951;float pi = 3.141592653589793;void main () {float x = fragTexCoord.x;float y = fragTexCoord.y;float u = ((x - bx)/(sx*sqrt2));float v = ((y - by)/(sy*sqrt2));float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(kx*x + ky*y));float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(kx*x + ky*y));if ((kx == 0.0 && ky == 0.0) || m == 0.0) {fragColor = vec4(re, im, 0.0, 0.0);} else {float mc = m*c;float px = 2.0*pi*kx/w;float py = 2.0*pi*ky/h;float p2 = px*px + py*py;float p = sqrt(p2);float omega = sqrt(mc*mc + p2);float energy = omega*c;float den = p*sqrt((mc + omega)*(mc + omega) + p2);float reS1 = px*(mc + omega)/den;float imS1 = -py*(mc + omega)/den;float reExpEnergy = cos(t*energy/hbar);float imExpEnergy = sin(t*energy/hbar);float re2 = re*reExpEnergy - im*imExpEnergy;float im2 = re*imExpEnergy + im*reExpEnergy;fragColor = vec4(reS1*re2 - imS1*im2, reS1*im2 + imS1*re2, 0.0, 0.0);}}`;
const iswEnergyEigenstatesFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
const float pi = 3.141592653589793;uniform float m;uniform float hbar;uniform float w;uniform float h;uniform float t;void main() {vec2 psi = vec2(0.0, 0.0);float E;float psin0;float x = fragTexCoord.x;float y = fragTexCoord.y;gl_FragColor = vec4(psi, 0.0, 1.0);}`;
const initialWavepacketFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;uniform float dy;uniform float bx;uniform float by;uniform float px;uniform float py;uniform float sx;uniform float sy;uniform float amp;uniform float borderAlpha;float sqrt2 = 1.4142135623730951;float sqrtpi = 1.7724538509055159;float pi = 3.141592653589793;void main () {if (fragTexCoord.x > dx && fragTexCoord.x < 1.0-dx &&fragTexCoord.y > dy && fragTexCoord.y < 1.0-dy) {float x = fragTexCoord.x;float y = fragTexCoord.y;float u = ((x - bx)/(sx*sqrt2));float v = ((y - by)/(sy*sqrt2));float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(px*x + py*y));float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(px*x + py*y));fragColor = vec4(re, im, 0.0, 1.0);} else {fragColor = vec4(0.0, 0.0, 0.0, borderAlpha);}}`;
const copyOverFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex1;uniform sampler2D tex2;void main () {vec4 col1 = texture2D(tex1, fragTexCoord);vec4 col2 = texture2D(tex2, fragTexCoord);fragColor = vec4(col1.rgb + col2.rgb, 1.0);}`;
const staggeredProbDensityFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex1;uniform sampler2D tex2;uniform sampler2D tex3;void main() {vec4 col1 = texture2D(tex1, fragTexCoord);vec4 col2 = texture2D(tex2, fragTexCoord);vec4 col3 = texture2D(tex3, fragTexCoord);float probDensity = col2.r*col2.r + col1.g*col3.g;fragColor = vec4(probDensity, 0.0, 0.0, 1.0);}`;
const initialVectorPotentialFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform int potentialType;uniform float cx;uniform float cy;
#define UNIFORM_MAGNETIC 1
void main() {float x = fragTexCoord.x;float y = fragTexCoord.y;if (potentialType == UNIFORM_MAGNETIC) {fragColor = vec4(cx*(y - 0.5), -cy*(x - 0.5), 0.0, 1.0);} else {fragColor = vec4(0.0, 0.0, 0.0, 1.0);}}`;
const realTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;uniform float dy;uniform float dt;uniform float w;uniform float h;uniform float m;uniform float hbar;uniform float rScaleV;uniform sampler2D texPsi;uniform sampler2D texV;uniform int laplacePoints;float imagValueAt(vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.g*tmp.a;}float getDiv2ImPsi(float imPsi) {float u = imagValueAt(fragTexCoord + vec2(0.0, dy/h));float d = imagValueAt(fragTexCoord + vec2(0.0, -dy/h));float l = imagValueAt(fragTexCoord + vec2(-dx/w, 0.0));float r = imagValueAt(fragTexCoord + vec2(dx/w, 0.0));if (laplacePoints <= 5) {return (u + d + l + r - 4.0*imPsi)/(dx*dx);} else {float ul = imagValueAt(fragTexCoord + vec2(-dx/w, dy/h));float ur = imagValueAt(fragTexCoord + vec2(dx/w, dy/h));float dl = imagValueAt(fragTexCoord + vec2(-dx/w, -dy/h));float dr = imagValueAt(fragTexCoord + vec2(dx/w, -dy/h));return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*imPsi)/(dx*dx);}}void main () {float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r +rScaleV*texture2D(texV, fragTexCoord).g;float imV = texture2D(texV, fragTexCoord).b;vec4 psi = texture2D(texPsi, fragTexCoord);float rePsi = psi.r;float imPsi = psi.g;float alpha = psi.a;float div2ImPsi = getDiv2ImPsi(imPsi);float hamiltonImPsi = -(0.5*hbar*hbar/m)*div2ImPsi + V*imPsi;float f1 = 1.0 - dt*imV/hbar;float f2 = 1.0 + dt*imV/hbar;fragColor = vec4(rePsi*(f2/f1) + hamiltonImPsi*dt/(f1*hbar), imPsi,0.0, alpha);}`;
const probDensityFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex;void main() {vec4 col = texture2D(tex, fragTexCoord);float probDensity = col.r*col.r + col.g*col.g;fragColor = vec4(probDensity, 0.0, 0.0, 1.0);}`;
const reshapePotentialFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex1;uniform int drawMode;uniform int eraseMode;uniform float drawWidth;uniform float drawHeight;uniform float bx;uniform float by;uniform float v2;
#define DRAW_SQUARE 0
#define DRAW_CIRCLE 1
#define DRAW_GAUSS 2
void main() {vec2 xy = fragTexCoord.xy;float initialV = texture2D(tex1, fragTexCoord).r;float imagV = 0.0;float drawW2 = drawWidth*drawWidth;float drawH2 = drawHeight*drawHeight;float x2 = (xy.x - bx)*(xy.x - bx);float y2 = (xy.y - by)*(xy.y - by);if (initialV < v2 || eraseMode == 1) {if ((drawMode == DRAW_SQUARE &&x2 < drawW2 && y2 < drawH2) ||(drawMode == DRAW_CIRCLE && x2*(drawH2/drawW2) + y2 < drawH2)) {fragColor = vec4(v2, initialV, 0.0, 1.0);} else if (drawMode == DRAW_GAUSS) {float tmp = exp(-0.25*(x2/drawW2 + y2/drawH2));if (eraseMode == 0) {fragColor = vec4(max(tmp + initialV, initialV),initialV, imagV, 1.0);} else {fragColor = vec4(max(initialV - tmp, 0.0),initialV, imagV, 1.0);}} else {fragColor = vec4(initialV, initialV, imagV, 1.0);}} else {fragColor = vec4(initialV, initialV, imagV, 1.0);}}`;
const bottomSpinorTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dt;uniform float dx;uniform float dy;uniform float w;uniform float h;uniform float hbar;uniform float m;uniform float c;uniform sampler2D vTex;uniform sampler2D uTex;uniform sampler2D potTex;uniform int useVecPot;uniform sampler2D vecPotTex;vec2 mult(vec2 z1, vec2 z2) {return vec2(z1.x*z2.x - z1.y*z2.y,z1.x*z2.y + z1.y*z2.x);}vec2 conj(vec2 z) {return vec2(z.r, -z.g);}vec4 getRightUpDownLeftAngles(vec2 xy) {float q = 1.0;vec4 centre = texture2D(vecPotTex, xy);vec4 up = texture2D(vecPotTex, xy + vec2(0.0, dy/h));vec4 down = texture2D(vecPotTex, xy + vec2(0.0, -dy/h));vec4 left = texture2D(vecPotTex, xy + vec2(-dx/w, 0.0));vec4 right = texture2D(vecPotTex, xy + vec2(dx/w, 0.0));float thetaR = 0.5*q*(right + centre).x*dx/hbar;float thetaU = 0.5*q*(up + centre).y*dy/hbar;float thetaD = -0.5*q*(centre + down).y*dy/hbar;float thetaL = -0.5*q*(centre + left).x*dx/hbar;return vec4(thetaR, thetaU, thetaD, thetaL);}vec2 getPhase(float theta) {return vec2(cos(theta), -sin(theta));}void main() {vec2 xy = fragTexCoord;vec4 rightU = texture2D(uTex, vec2(xy.x, xy.y-0.5*dy/h));vec4 leftU = texture2D(uTex, vec2(xy.x-dx/w, xy.y-0.5*dy/h));vec4 upU = texture2D(uTex, vec2(xy.x-0.5*dx/w, xy.y));vec4 downU = texture2D(uTex, vec2(xy.x-0.5*dx/w, xy.y-dy/h));if (useVecPot == 1) {vec2 loc = xy - 0.5*vec2(dx/w, dy/h);vec4 thetaRightUpDownLeft = getRightUpDownLeftAngles(loc);vec2 rightPhase = getPhase(thetaRightUpDownLeft[0]);vec2 upPhase = getPhase(thetaRightUpDownLeft[1]);vec2 downPhase = getPhase(thetaRightUpDownLeft[2]);vec2 leftPhase = getPhase(thetaRightUpDownLeft[3]);rightU = vec4(mult(rightU.rg, rightPhase),mult(rightU.ba, rightPhase));leftU = vec4(mult(leftU.rg, leftPhase),mult(leftU.ba, leftPhase));upU = vec4(mult(upU.rg, upPhase),mult(upU.ba, upPhase));downU = vec4(mult(downU.rg, downPhase),mult(downU.ba, downPhase));}vec4 dUdx = (rightU - leftU)/dx;vec4 dUdy = (upU - downU)/dy;vec4 uDerivatives = vec4(-dUdx[2] - dUdy[3], dUdy[2] - dUdx[3],-dUdx[0] + dUdy[1], -dUdy[0] - dUdx[1]);float b = 0.5*(dt/hbar)*(-m*c*c+ c*(texture2D(potTex,xy-0.5*vec2(dx/w, dy/h))[0]));float den = (1.0 + b*b);vec4 u = vec4(dot(vec4(1.0, b,  0.0, 0.0), uDerivatives)/den,dot(vec4(-b, 1.0, 0.0, 0.0), uDerivatives)/den,dot(vec4(0.0, 0.0, 1.0, b ), uDerivatives)/den,dot(vec4(0.0, 0.0, -b, 1.0), uDerivatives)/den);vec4 prevV = texture2D(vTex, xy);vec4 v = vec4(dot(vec4(1.0 - b*b, 2.0*b,  0.0, 0.0), prevV)/den,dot(vec4(-2.0*b, 1.0 - b*b, 0.0, 0.0), prevV)/den,dot(vec4(0.0, 0.0,  1.0 - b*b, 2.0*b), prevV)/den,dot(vec4(0.0, 0.0, -2.0*b, 1.0 - b*b), prevV)/den);fragColor = v + c*dt*u;}`;
const realImagTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;uniform float dy;uniform float dt;uniform float w;uniform float h;uniform float m;uniform float hbar;uniform float rScaleV;uniform sampler2D texPsi1;uniform sampler2D texPsi2;uniform sampler2D texV;uniform int laplacePoints;vec2 valueAt(sampler2D texPsi, vec2 coord) {vec4 psiFragment = texture2D(texPsi, coord);return psiFragment.xy*psiFragment.a;}vec2 div2Psi(sampler2D texPsi) {vec2 c = valueAt(texPsi, fragTexCoord);vec2 u = valueAt(texPsi, fragTexCoord + vec2(0.0, dy/h));vec2 d = valueAt(texPsi, fragTexCoord + vec2(0.0, -dy/h));vec2 l = valueAt(texPsi, fragTexCoord + vec2(-dx/w, 0.0));vec2 r = valueAt(texPsi, fragTexCoord + vec2(dx/w, 0.0));if (laplacePoints <= 5) {return (u + d + l + r - 4.0*c)/(dx*dx);} else {vec2 ul = valueAt(texPsi, fragTexCoord + vec2(-dx/w, dy/h));vec2 ur = valueAt(texPsi, fragTexCoord + vec2(dx/w, dy/h));vec2 dl = valueAt(texPsi, fragTexCoord + vec2(-dx/w, -dy/h));vec2 dr = valueAt(texPsi, fragTexCoord + vec2(dx/w, -dy/h));return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*c)/(dx*dx);}}void main() {float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r +rScaleV*texture2D(texV, fragTexCoord).g;vec4 psi1Fragment = texture2D(texPsi1, fragTexCoord);float alpha = psi1Fragment.a;vec2 psi1 = psi1Fragment.xy*alpha;vec2 psi2 = valueAt(texPsi2, fragTexCoord);vec2 hamiltonianPsi2 = -(0.5*hbar*hbar/m)*div2Psi(texPsi2) + V*psi2;fragColor = vec4(psi1.x + dt*hamiltonianPsi2.y/hbar,psi1.y - dt*hamiltonianPsi2.x/hbar,0.0, alpha);}`;
const rearrangeFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float width;uniform float height;uniform sampler2D tex;uniform sampler2D lookupTex;void main() {vec2 xy = fragTexCoord;vec4 col = vec4(0.0, 0.0, 0.0, 1.0);vec2 lookupPos = texture2D(lookupTex, xy).xy;
/*#if __VERSION__ >= 130
ivec2 intLookupPos = ivec2(int(width*lookupPos.x),int(height*lookupPos.y));col += texelFetch(tex, intLookupPos, 0);
#else*/
col += texture2D(tex, lookupPos);fragColor = col;}`;
const upperSpinorTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dt;uniform float dx;uniform float dy;uniform float w;uniform float h;uniform float hbar;uniform float m;uniform float c;uniform sampler2D vTex;uniform sampler2D uTex;uniform sampler2D potTex;uniform int useVecPot;uniform sampler2D vecPotTex;vec2 mult(vec2 z1, vec2 z2) {return vec2(z1.x*z2.x - z1.y*z2.y,z1.x*z2.y + z1.y*z2.x);}vec2 conj(vec2 z) {return vec2(z.r, -z.g);}vec4 getRightUpDownLeftAngles(vec2 xy) {float q = 1.0;vec4 centre = texture2D(vecPotTex, xy);vec4 up = texture2D(vecPotTex, xy + vec2(0.0, dy/h));vec4 down = texture2D(vecPotTex, xy + vec2(0.0, -dy/h));vec4 left = texture2D(vecPotTex, xy + vec2(-dx/w, 0.0));vec4 right = texture2D(vecPotTex, xy + vec2(dx/w, 0.0));float thetaR = 0.5*q*(right + centre).x*dx/hbar;float thetaU = 0.5*q*(up + centre).y*dy/hbar;float thetaD = -0.5*q*(centre + down).y*dy/hbar;float thetaL = -0.5*q*(centre + left).x*dx/hbar;return vec4(thetaR, thetaU, thetaD, thetaL);}vec2 getPhase(float theta) {return vec2(cos(theta), -sin(theta));}void main() {vec2 xy = fragTexCoord;vec4 rightV = texture2D(vTex, vec2(xy.x+dx/w, xy.y+0.5*dy/h));vec4 leftV = texture2D(vTex, vec2(xy.x, xy.y+0.5*dy/h));vec4 upV = texture2D(vTex, vec2(xy.x+0.5*dx/w, xy.y+dy/h));vec4 downV = texture2D(vTex, vec2(xy.x+0.5*dx/w, xy.y));if (useVecPot == 1) {vec2 loc = xy;vec4 thetaRightUpDownLeft = getRightUpDownLeftAngles(loc);vec2 rightPhase = getPhase(thetaRightUpDownLeft[0]);vec2 upPhase = getPhase(thetaRightUpDownLeft[1]);vec2 downPhase = getPhase(thetaRightUpDownLeft[2]);vec2 leftPhase = getPhase(thetaRightUpDownLeft[3]);rightV = vec4(mult(rightV.rg, rightPhase),mult(rightV.ba, rightPhase));leftV = vec4(mult(leftV.rg, leftPhase),mult(leftV.ba, leftPhase));upV = vec4(mult(upV.rg, upPhase),mult(upV.ba, upPhase));downV = vec4(mult(downV.rg, downPhase),mult(downV.ba, downPhase));}vec4 dVdx = (rightV - leftV)/dx;vec4 dVdy = (upV - downV)/dy;vec4 vDerivatives = vec4(-dVdx[2] - dVdy[3], dVdy[2] - dVdx[3],-dVdx[0] + dVdy[1], -dVdy[0] - dVdx[1]);float a = 0.5*(dt/hbar)*(m*c*c + c*texture2D(potTex, xy)[0]);float den = (1.0 + a*a);vec4 v = vec4(dot(vec4(1.0, a,  0.0, 0.0), vDerivatives)/den,dot(vec4(-a, 1.0, 0.0, 0.0), vDerivatives)/den,dot(vec4(0.0, 0.0, 1.0, a),  vDerivatives)/den,dot(vec4(0.0, 0.0, -a, 1.0), vDerivatives)/den);vec4 prevU = texture2D(uTex, xy);vec4 u = vec4(dot(vec4(1.0 - a*a, 2.0*a,  0.0, 0.0), prevU)/den,dot(vec4(-2.0*a, 1.0 - a*a, 0.0, 0.0), prevU)/den,dot(vec4(0.0, 0.0,  1.0 - a*a, 2.0*a), prevU)/den,dot(vec4(0.0, 0.0, -2.0*a, 1.0 - a*a), prevU)/den);fragColor = u + c*dt*v;}`;
const imagTimestepFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;uniform float dy;uniform float dt;uniform float w;uniform float h;uniform float m;uniform float hbar;uniform float rScaleV;uniform sampler2D texPsi;uniform sampler2D texV;uniform int laplacePoints;float realValueAt(vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.r*tmp.a;}float getDiv2RePsi(float rePsi) {float u = realValueAt(fragTexCoord + vec2(0.0, dy/h));float d = realValueAt(fragTexCoord + vec2(0.0, -dy/h));float l = realValueAt(fragTexCoord + vec2(-dx/w, 0.0));float r = realValueAt(fragTexCoord + vec2(dx/w, 0.0));if (laplacePoints <= 5) {return (u + d + l + r - 4.0*rePsi)/(dx*dx);} else if (laplacePoints <= 9) {float ul = realValueAt(fragTexCoord + vec2(-dx/w, dy/h));float ur = realValueAt(fragTexCoord + vec2(dx/w, dy/h));float dl = realValueAt(fragTexCoord + vec2(-dx/w, -dy/h));float dr = realValueAt(fragTexCoord + vec2(dx/w, -dy/h));return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*rePsi)/(dx*dx);} /*else {}*/}void main () {float V = texture2D(texV, fragTexCoord).r;float imV = texture2D(texV, fragTexCoord).b;vec4 psi = texture2D(texPsi, fragTexCoord);float rePsi = psi.r;float imPsi = psi.g;float alpha = psi.a;float div2RePsi = getDiv2RePsi(rePsi);float f1 = 1.0 - dt*imV/hbar;float f2 = 1.0 + dt*imV/hbar;float hamiltonRePsi = -(0.5*hbar*hbar/m)*div2RePsi + V*rePsi;fragColor = vec4(rePsi, imPsi*(f2/f1) - hamiltonRePsi*dt/(f1*hbar),0.0, alpha);}`;
const imagePotentialFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform int invert;uniform sampler2D tex;void main() {vec2 st = vec2(fragTexCoord.x, 1.0 - fragTexCoord.y);vec4 col = texture2D(tex, st);float avgCol = (col.r + col.g + col.b)/3.0;if (invert == 1) {avgCol = 20.0 - avgCol;}fragColor = vec4(avgCol, avgCol/2.0, 0.0, 1.0);}`;
const viewFrameFragmentSource = `
#define NAME viewFrameFragmentSource
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float x0;uniform float y0;uniform float w;uniform float h;uniform float lineWidth;uniform float brightness;uniform float brightness2;uniform sampler2D tex1;uniform sampler2D tex2;uniform sampler2D tex3;uniform sampler2D texV;uniform sampler2D vecTex;uniform sampler2D textTex;uniform sampler2D backgroundTex;uniform int displayMode;uniform int wavefunctionDisplayMode;uniform int potentialDisplayMode;uniform int vectorDisplayMode;uniform int backgroundDisplayMode;uniform vec3 probColour;uniform vec3 potColour;const float pi = 3.141592653589793;
#define DISPLAY_ONLY_PROB_DENSITY 0
#define DISPLAY_PHASE 1
#define DISPLAY_PROB_DENSITY_HEIGHT_MAP 2

#define DISPLAY_POTENTIAL_SINGLE_COLOUR 0
#define DISPLAY_POTENTIAL_COLOUR_MAP 1
#define DISPLAY_POTENTIAL_COLOUR 2

#define DISPLAY_NO_VECTOR 0
#define DISPLAY_VECTOR 1

#define DISPLAY_NO_BACKGROUND 0
#define DISPLAY_BACKGROUND 1
vec4 drawWindow(vec4 pix, float x, float y,float x0, float y0, float w, float h,float lineWidth) {y0 = (h < 0.0)? y0 + h: y0;h = (h < 0.0)? -h: h;x0 = (w < 0.0)? x0 + w: x0;w = (w < 0.0)? -w: w;if ((x >= x0 && x <= (x0 + w)) &&((abs(y - y0) <= lineWidth/2.0) ||(abs(y - y0 - h) <= lineWidth/2.0))) {return vec4(1.0, 1.0, 1.0, 1.0);}if ((y > y0 && y < (y0 + h)) &&((abs(x - x0) <= lineWidth/2.0) ||(abs(x - x0 - w) <= lineWidth/2.0))) {return vec4(1.0, 1.0, 1.0, 1.0);}return pix;}vec3 argumentToColour(float argVal) {float maxCol = 1.0;float minCol = 50.0/255.0;float colRange = maxCol - minCol;if (argVal <= pi/3.0 && argVal >= 0.0) {return vec3(maxCol,minCol + colRange*argVal/(pi/3.0), minCol);} else if (argVal > pi/3.0 && argVal <= 2.0*pi/3.0){return vec3(maxCol - colRange*(argVal - pi/3.0)/(pi/3.0),maxCol, minCol);} else if (argVal > 2.0*pi/3.0 && argVal <= pi){return vec3(minCol, maxCol,minCol + colRange*(argVal - 2.0*pi/3.0)/(pi/3.0));} else if (argVal < 0.0 && argVal > -pi/3.0){return vec3(maxCol, minCol,minCol - colRange*argVal/(pi/3.0));} else if (argVal <= -pi/3.0 && argVal > -2.0*pi/3.0){return vec3(maxCol + (colRange*(argVal + pi/3.0)/(pi/3.0)),minCol, maxCol);} else if (argVal <= -2.0*pi/3.0 && argVal >= -pi){return vec3(minCol,minCol - (colRange*(argVal + 2.0*pi/3.0)/(pi/3.0)), maxCol);}else {return vec3(minCol, maxCol, maxCol);}}vec3 complexToColour(float re, float im) {return argumentToColour(atan(im, re));}void main () {vec4 col1 = texture2D(tex1, fragTexCoord);vec4 col2 = texture2D(tex2, fragTexCoord);vec4 col3 = texture2D(tex3, fragTexCoord);float probDensity = (col1.g*col3.g + col2.r*col2.r);float re = col2.r;float im = (col3.g + col1.g)/2.0;vec3 wavefunction;/*vec3 colPotential = col4.r*brightness2*argumentToColour(2.0*3.14159*col4.r*brightness2 - 1.0)*exp(-brightness*probDensity/16.0);*/vec4 col4 = texture2D(texV, fragTexCoord)/(50.0*1.0);vec3 potential;if (potentialDisplayMode == DISPLAY_POTENTIAL_SINGLE_COLOUR) {potential = col4.r*brightness2*potColour;} else if (potentialDisplayMode == DISPLAY_POTENTIAL_COLOUR_MAP) {float val = -3.0*pi*col4.r*brightness2 - 2.0*pi/3.0;if (val < -pi) {val = 2.0*pi + val;if (val < -pi/4.0) {val = -pi/4.0;}}potential = argumentToColour(val);} else if (potentialDisplayMode == DISPLAY_POTENTIAL_COLOUR) {}if (wavefunctionDisplayMode == DISPLAY_PHASE) {wavefunction = probDensity*(brightness/16.0)*complexToColour(re, im);} else if (wavefunctionDisplayMode == DISPLAY_ONLY_PROB_DENSITY) {wavefunction = probDensity*probColour*(brightness/16.0);} else if (wavefunctionDisplayMode == DISPLAY_PROB_DENSITY_HEIGHT_MAP) {float val = -pi*probDensity*brightness/(4.0*10.0) - 2.0*pi/3.0;if (val < -pi) {val = 2.0*pi + val;if (val < 0.0) {val = 0.0;}}wavefunction = min(probDensity*(brightness/16.0), 1.25)*argumentToColour(val);}vec3 background;if (backgroundDisplayMode == DISPLAY_BACKGROUND) {background = texture2D(backgroundTex, fragTexCoord).rgb;}vec4 pix = vec4(wavefunction + potential + background/4.0, 1.0);if (vectorDisplayMode == DISPLAY_VECTOR) {pix += 10.0*texture2D(vecTex, fragTexCoord);}fragColor = drawWindow(pix, fragTexCoord.x, fragTexCoord.y,x0, y0, w, h, lineWidth) +texture2D(textTex, fragTexCoord);}`;
const guiRectangleFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float x0;uniform float y0;uniform float w;uniform float h;uniform float lineWidth;vec4 drawWindow(vec4 pix, float x, float y,float x0, float y0, float w, float h,float lineWidth) {y0 = (h < 0.0)? y0 + h: y0;h = (h < 0.0)? -h: h;x0 = (w < 0.0)? x0 + w: x0;w = (w < 0.0)? -w: w;if ((x >= x0 && x <= (x0 + w)) &&((abs(y - y0) <= lineWidth/2.0) ||(abs(y - y0 - h) <= lineWidth/2.0))) {return vec4(1.0, 1.0, 1.0, 1.0);}if ((y > y0 && y < (y0 + h)) &&((abs(x - x0) <= lineWidth/2.0) ||(abs(x - x0 - w) <= lineWidth/2.0))) {return vec4(1.0, 1.0, 1.0, 1.0);}return pix;}void main() {vec2 xy = fragTexCoord;vec4 col = vec4(0.0, 0.0, 0.0, 0.0);fragColor = drawWindow(col, xy.x, xy.y, x0, y0, w, h, lineWidth);}`;
const copyScaleFlipFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float scale1;uniform float scale2;uniform sampler2D tex1;uniform sampler2D tex2;void main () {vec2 coord = vec2(fragTexCoord.x, 1.0 - fragTexCoord.y);vec4 col1 = scale1*texture2D(tex1, coord);vec4 col2 = scale2*texture2D(tex2, coord);fragColor = vec4(col1.rgb + col2.rgb, 1.0);}`;
const onesFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
void main () {fragColor = vec4(1.0, 1.0, 1.0, 1.0);}`;
const complexMultiplyFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex1;uniform sampler2D tex2;void main() {vec4 col1 = texture2D(tex1, fragTexCoord);vec4 col2 = texture2D(tex2, fragTexCoord);fragColor = vec4(col1.r*col2.r - col1.g*col2.g,col1.r*col2.g + col1.g*col2.r, 0.0, 1.0);}`;
const jacobiIterationFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;uniform float dy;uniform float dt;uniform float w;uniform float h;uniform float m;uniform float hbar;uniform float rScaleV;uniform sampler2D texPsi;uniform sampler2D texPsiIter;uniform sampler2D texV;uniform sampler2D texA;uniform int useAField;uniform int laplacePoints;vec2 mult(vec2 z1, vec2 z2) {return vec2(z1.x*z2.x - z1.y*z2.y,z1.x*z2.y + z1.y*z2.x);}vec2 conj(vec2 z) {return vec2(z.r, -z.g);}float reValueAt(sampler2D texComplexFunc, vec2 location) {vec4 tmp = texture2D(texComplexFunc, location);return tmp.r*tmp.a;}float imagValueAt(sampler2D texComplexFunc, vec2 location) {vec4 tmp = texture2D(texComplexFunc, location);return tmp.g*tmp.a;}float getImagValuesAround(sampler2D texComplexFunc) {float u = imagValueAt(texComplexFunc, fragTexCoord + vec2(0.0, dy/h));float d = imagValueAt(texComplexFunc, fragTexCoord + vec2(0.0, -dy/h));float l = imagValueAt(texComplexFunc, fragTexCoord + vec2(-dx/w, 0.0));float r = imagValueAt(texComplexFunc, fragTexCoord + vec2(dx/w, 0.0));if (laplacePoints <= 5) {return u + d + l + r;} else {float ul = imagValueAt(texComplexFunc,fragTexCoord + vec2(-dx/w, dy/h));float ur = imagValueAt(texComplexFunc,fragTexCoord + vec2(dx/w, dy/h));float dl = imagValueAt(texComplexFunc,fragTexCoord + vec2(-dx/w, -dy/h));float dr = imagValueAt(texComplexFunc,fragTexCoord + vec2(dx/w, -dy/h));return 0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r;}}float getReValuesAround(sampler2D texComplexFunc) {float u = reValueAt(texComplexFunc, fragTexCoord + vec2(0.0, dy/h));float d = reValueAt(texComplexFunc, fragTexCoord + vec2(0.0, -dy/h));float l = reValueAt(texComplexFunc, fragTexCoord + vec2(-dx/w, 0.0));float r = reValueAt(texComplexFunc, fragTexCoord + vec2(dx/w, 0.0));if (laplacePoints <= 5) {return u + d + l + r;} else {float ul = reValueAt(texComplexFunc,fragTexCoord + vec2(-dx/w, dy/h));float ur = reValueAt(texComplexFunc,fragTexCoord + vec2(dx/w, dy/h));float dl = reValueAt(texComplexFunc,fragTexCoord + vec2(-dx/w, -dy/h));float dr = reValueAt(texComplexFunc,fragTexCoord + vec2(dx/w, -dy/h));return 0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r;}}vec2 valueAt(sampler2D texComplexFunc, vec2 location) {vec4 tmp = texture2D(texComplexFunc, location);return tmp.xy*tmp.a;}/* To approximage the vector potential, Peierls substitution is used wherevery basically the non-diagonal elements are multiplied by a phase that isdetermined by a path from the diagonal to the non-diagonal elementusing the vector potential.Feynman R., Leighton R., Sands M. (2011).The Schrödinger Equation in a Classical Context:A Seminar on Superconductivityhttps:In The Feynman Lectures on Physics: The New Millennium Edition,Volume 3, chapter 21. Basic Books.Wikipedia contributors. (2021, April 21). Peierls substitutionhttps:In Wikipedia, The Free Encyclopedia*/vec4 getAngles(vec2 location) {float q = 1.0;vec2 xy = location;vec4 c = texture2D(texA, xy);vec4 u = texture2D(texA, xy + vec2(0.0, dy/h));vec4 d = texture2D(texA, xy + vec2(0.0, -dy/h));vec4 l = texture2D(texA, xy + vec2(-dx/w, 0.0));vec4 r = texture2D(texA, xy + vec2(dx/w, 0.0));float thetaR = 0.5*q*(r + c).x*dx/hbar;float thetaU = 0.5*q*(u + c).y*dy/hbar;float thetaD = -0.5*q*(c + d).y*dy/hbar;float thetaL = -0.5*q*(c + l).x*dx/hbar;return vec4(thetaR, thetaU, thetaD, thetaL);}vec2 getPhase(float theta) {return vec2(cos(theta), -sin(theta));}vec2 getValuesAround(sampler2D texComplexFunc) {vec2 xy = fragTexCoord;vec4 theta = getAngles(xy);vec2 phaseR = getPhase(theta[0]);vec2 phaseU = getPhase(theta[1]);vec2 phaseD = getPhase(theta[2]);vec2 phaseL = getPhase(theta[3]);vec2 u = mult(valueAt(texComplexFunc, xy + vec2(0.0, dy/h)), phaseU);vec2 d = mult(valueAt(texComplexFunc, xy + vec2(0.0, -dy/h)), phaseD);vec2 l = mult(valueAt(texComplexFunc, xy + vec2(-dx/w, 0.0)), phaseL);vec2 r = mult(valueAt(texComplexFunc, xy + vec2(dx/w, 0.0)), phaseR);if (laplacePoints <= 5) {return u + d + l + r;} else {vec2 ul = valueAt(texComplexFunc, xy + vec2(-dx/w, dy/h));vec2 ur = valueAt(texComplexFunc, xy + vec2(dx/w, dy/h));vec2 dl = valueAt(texComplexFunc, xy + vec2(-dx/w, -dy/h));vec2 dr = valueAt(texComplexFunc, xy + vec2(dx/w, -dy/h));return 0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r;}}void main() {float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r +rScaleV*texture2D(texV, fragTexCoord).g;vec4 psiIter = texture2D(texPsiIter, fragTexCoord);vec4 psi = texture2D(texPsi, fragTexCoord);float c1 = (laplacePoints <= 5)? 1.0: 0.75;float imDiag = dt*V/(2.0*hbar) + c1*hbar*dt/(m*dx*dx);if (useAField == 0) {float reInvDiag = 1.0/(1.0 + imDiag*imDiag);float imInvDiag = -imDiag/(1.0 + imDiag*imDiag);float reTmp = psi.r;reTmp -= hbar*dt/(4.0*m*dx*dx)*getImagValuesAround(texPsiIter);float imTmp = psi.g;imTmp += hbar*dt/(4.0*m*dx*dx)*getReValuesAround(texPsiIter);fragColor = vec4(reInvDiag*reTmp - imInvDiag*imTmp,imInvDiag*reTmp + reInvDiag*imTmp, 0.0, psi.a);} else {vec2 invDiag = vec2(1.0/(1.0 + imDiag*imDiag),-imDiag/(1.0 + imDiag*imDiag));vec2 I = vec2(0.0, 1.0);vec2 tmp = psi.xy + hbar*dt/(4.0*m*dx*dx)*mult(I, getValuesAround(texPsiIter));fragColor = vec4(mult(invDiag, tmp), 0.0, psi.a);}}`;
const initialBottomSpinorFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float bx;uniform float by;uniform float kx;uniform float ky;uniform float sx;uniform float sy;uniform float amp;uniform float m;uniform float c;uniform float w;uniform float h;uniform float pixelW;uniform float pixelH;uniform float t;uniform float hbar;float sqrt2 = 1.4142135623730951;float pi = 3.141592653589793;void main () {float x = fragTexCoord.x - 0.5/pixelW;float y = fragTexCoord.y - 0.5/pixelH;float u = ((x - bx)/(sx*sqrt2));float v = ((y - by)/(sy*sqrt2));float re = amp*exp(- u*u - v*v)*cos(2.0*pi*(kx*x + ky*y));float im = amp*exp(- u*u - v*v)*sin(2.0*pi*(kx*x + ky*y));if ((kx == 0.0 && ky == 0.0) || m == 0.0) {fragColor = vec4(0.0, 0.0, 0.0, 0.0);} else {float mc = m*c;float px = 2.0*pi*kx/w;float py = 2.0*pi*ky/h;float p2 = px*px + py*py;float p = sqrt(p2);float omega = sqrt(mc*mc + p2);float energy = omega*c;float reExpEnergy = cos(t*energy/hbar);float imExpEnergy = sin(t*energy/hbar);float den = sqrt((mc + omega)*(mc + omega) + p2);fragColor = vec4(0.0, 0.0, (re*reExpEnergy - im*imExpEnergy)*p/den,(re*imExpEnergy + im*reExpEnergy)*p/den);}}`;
const dist2FragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex0;uniform sampler2D tex1;uniform sampler2D tex2;void main() {vec4 v0 = texture2D(tex0, fragTexCoord);vec4 v1 = texture2D(tex1, fragTexCoord);vec4 v2 = texture2D(tex2, fragTexCoord);vec4 diff = v2 - v1;fragColor = vec4(diff.x*diff.x + diff.y*diff.y + diff.z*diff.z,v0.x*v0.x + v0.y*v0.y + v0.z*v0.z, 0.0,0.0);}`;
const expPotentialFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D texV;uniform float dt;uniform float hbar;void main() {vec4 potential = texture2D(texV, fragTexCoord);float reV = potential[0];float imV = potential[2];float imArg = -0.5*reV*dt/hbar;float reArg = 0.5*imV*dt/hbar;fragColor = vec4(exp(reArg)*cos(imArg), exp(reArg)*sin(imArg), 0.0, 1.0);}`;
const fftIterFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform sampler2D tex;uniform float blockSize;uniform int isVertical;uniform float angleSign;uniform float size;uniform float scale;const float tau = 6.283185307179586;vec3 getOdd1(float x, float y) {return (isVertical == 0)? texture2D(tex, vec2(x + blockSize/2.0, y)).rgb:texture2D(tex, vec2(x, y + blockSize/2.0)).rgb;}vec3 getEven2(float x, float y) {return (isVertical == 0)? texture2D(tex, vec2(x - blockSize/2.0, y)).rgb:texture2D(tex, vec2(x, y - blockSize/2.0)).rgb;}void main() {float x = fragTexCoord.x;float y = fragTexCoord.y;float val = (isVertical == 0)? mod(x, blockSize): mod(y, blockSize);vec3 even1 = texture2D(tex, fragTexCoord).rgb;vec3 odd1 = getOdd1(x, y);float phi1 = angleSign*tau*(val - 0.5/size)/(blockSize);float cos_val1 = cos(phi1);float sin_val1 = sin(phi1);vec3 expOdd1 = vec3(odd1.r*cos_val1 - odd1.g*sin_val1,odd1.r*sin_val1 + odd1.g*cos_val1,0.0);vec3 out1 = scale*(even1 + expOdd1);vec3 even2 = getEven2(x, y);vec3 odd2 = texture2D(tex, fragTexCoord).rgb;float phi2 = angleSign*tau*((val - 0.5/size) - blockSize/2.0)/(blockSize);float cos_val2 = cos(phi2);float sin_val2 = sin(phi2);vec3 expOdd2 = vec3(odd2.r*cos_val2 - odd2.g*sin_val2,odd2.r*sin_val2 + odd2.g*cos_val2,0.0);vec3 out2 = scale*(even2 - expOdd2);fragColor = (val <= blockSize/2.0)? vec4(out1, 1.0): vec4(out2, 1.0);}`;
const cnExplicitPartFragmentSource = `precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float dx;uniform float dy;uniform float dt;uniform float w;uniform float h;uniform float m;uniform float hbar;uniform float rScaleV;uniform sampler2D texPsi;uniform sampler2D texV;uniform sampler2D texA;uniform int useAField;uniform int laplacePoints;vec2 mult(vec2 z1, vec2 z2) {return vec2(z1.x*z2.x - z1.y*z2.y,z1.x*z2.y + z1.y*z2.x);}vec2 conj(vec2 z) {return vec2(z.r, -z.g);}float realValueAt(vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.r*tmp.a;}float imagValueAt(vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.g*tmp.a;}vec2 valueAt(vec2 location) {vec4 tmp = texture2D(texPsi, location);return tmp.xy*tmp.a;}/* To approximage the vector potential, Peierls substitution is used wherevery basically the non-diagonal elements are multiplied by a phase that isdetermined by a path from the diagonal to the non-diagonal elementusing the vector potential.Feynman R., Leighton R., Sands M. (2011).The Schrödinger Equation in a Classical Context:A Seminar on Superconductivityhttps:In The Feynman Lectures on Physics: The New Millennium Edition,Volume 3, chapter 21. Basic Books.Wikipedia contributors. (2021, April 21). Peierls substitutionhttps:In Wikipedia, The Free Encyclopedia*/vec4 getAngles(vec2 location) {float q = 1.0;vec2 xy = location;vec4 c = texture2D(texA, xy);vec4 u = texture2D(texA, xy + vec2(0.0, dy/h));vec4 d = texture2D(texA, xy + vec2(0.0, -dy/h));vec4 l = texture2D(texA, xy + vec2(-dx/w, 0.0));vec4 r = texture2D(texA, xy + vec2(dx/w, 0.0));float thetaR = 0.5*q*(r + c).x*dx/hbar;float thetaU = 0.5*q*(u + c).y*dy/hbar;float thetaD = -0.5*q*(c + d).y*dy/hbar;float thetaL = -0.5*q*(c + l).x*dx/hbar;return vec4(thetaR, thetaU, thetaD, thetaL);}vec2 getPhase(float theta) {return vec2(cos(theta), -sin(theta));}vec2 getDiv2Psi() {vec2 xy = fragTexCoord;vec4 theta = getAngles(xy);vec2 phaseR = getPhase(theta[0]);vec2 phaseU = getPhase(theta[1]);vec2 phaseD = getPhase(theta[2]);vec2 phaseL = getPhase(theta[3]);vec2 u = mult(valueAt(xy + vec2(0.0, dy/h)), phaseU);vec2 d = mult(valueAt(xy + vec2(0.0, -dy/h)), phaseD);vec2 l = mult(valueAt(xy + vec2(-dx/w, 0.0)), phaseL);vec2 r = mult(valueAt(xy + vec2(dx/w, 0.0)), phaseR);vec2 c = valueAt(xy);if (laplacePoints <= 5) {return (u + d + l + r - 4.0*c)/(dx*dx);} else {vec2 ul = valueAt(xy + vec2(-dx/w, dy/h));vec2 ur = valueAt(xy + vec2(dx/w, dy/h));vec2 dl = valueAt(xy + vec2(-dx/w, -dy/h));vec2 dr = valueAt(xy + vec2(dx/w, -dy/h));return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*c)/(dx*dx);}}float getDiv2RePsi(float rePsi) {float u = realValueAt(fragTexCoord + vec2(0.0, dy/h));float d = realValueAt(fragTexCoord + vec2(0.0, -dy/h));float l = realValueAt(fragTexCoord + vec2(-dx/w, 0.0));float r = realValueAt(fragTexCoord + vec2(dx/w, 0.0));if (laplacePoints <= 5) {return (u + d + l + r - 4.0*rePsi)/(dx*dx);} else {float ul = realValueAt(fragTexCoord + vec2(-dx/w, dy/h));float ur = realValueAt(fragTexCoord + vec2(dx/w, dy/h));float dl = realValueAt(fragTexCoord + vec2(-dx/w, -dy/h));float dr = realValueAt(fragTexCoord + vec2(dx/w, -dy/h));return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*rePsi)/(dx*dx);}}float getDiv2ImPsi(float imPsi) {float u = imagValueAt(fragTexCoord + vec2(0.0, dy/h));float d = imagValueAt(fragTexCoord + vec2(0.0, -dy/h));float l = imagValueAt(fragTexCoord + vec2(-dx/w, 0.0));float r = imagValueAt(fragTexCoord + vec2(dx/w, 0.0));if (laplacePoints <= 5) {return (u + d + l + r - 4.0*imPsi)/(dx*dx);} else {float ul = imagValueAt(fragTexCoord + vec2(-dx/w, dy/h));float ur = imagValueAt(fragTexCoord + vec2(dx/w, dy/h));float dl = imagValueAt(fragTexCoord + vec2(-dx/w, -dy/h));float dr = imagValueAt(fragTexCoord + vec2(dx/w, -dy/h));return (0.25*ur + 0.5*u + 0.25*ul + 0.5*l +0.25*dl + 0.5*d + 0.25*dr + 0.5*r - 3.0*imPsi)/(dx*dx);}}void main() {float V = (1.0 - rScaleV)*texture2D(texV, fragTexCoord).r +rScaleV*texture2D(texV, fragTexCoord).g;vec4 psi = texture2D(texPsi, fragTexCoord);if (useAField == 0) {float reKinetic = (-hbar*hbar/(2.0*m))*getDiv2RePsi(psi.r);float imKinetic = (-hbar*hbar/(2.0*m))*getDiv2ImPsi(psi.g);float hamiltonRePsi = reKinetic + V*psi.r;float hamiltonImPsi = imKinetic + V*psi.g;fragColor = vec4(psi.r + dt/(2.0*hbar)*hamiltonImPsi,psi.g - dt/(2.0*hbar)*hamiltonRePsi, 0.0, psi.a);} else {vec2 kinetic = (-hbar*hbar/(2.0*m))*getDiv2Psi();vec2 hamiltonPsi = kinetic + V*psi.xy;vec2 I = vec2(0.0, 1.0);fragColor = vec4(psi.xy - (dt/(2.0*hbar))*mult(I, hamiltonPsi), 0.0,psi.a);}}`;
