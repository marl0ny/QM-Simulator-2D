precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform int potentialType;
uniform int dissipativePotentialType;

// Controls size of potential
uniform float a;

// For the double slit
uniform float y0;
uniform float w;
uniform float spacing;
uniform float x1;
uniform float x2;

uniform float aImag;

#define SHO 1
#define DOUBLE_SLIT 2
#define SINGLE_SLIT 3
#define STEP 4
#define INV_R 5
#define TRIPLE_SLIT 6
#define NEG_INV_R 7
#define CIRCLE 8
#define LOG_R 9
#define CONE 10

#define NO_DISSIPATION 0
#define BOUNDARY_DISSIPATION 1
#define UNIFORM_DISSIPATION 2


void main() {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    float imagVal = 0.0;
    if (dissipativePotentialType == BOUNDARY_DISSIPATION) {
        imagVal -= 30.0*exp(-0.5*y*y/(0.01*0.01));
        imagVal -= 30.0*exp(-0.5*(y-1.0)*(y-1.0)/(0.01*0.01));
        imagVal -= 30.0*exp(-0.5*x*x/(0.01*0.01));
        imagVal -= 30.0*exp(-0.5*(x-1.0)*(x-1.0)/(0.01*0.01));
    } else if (dissipativePotentialType == UNIFORM_DISSIPATION) {
        imagVal = -10.0;
    }
    if (potentialType == SHO) {
        fragColor = vec4(a*((x-0.5)*(x-0.5) + (y-0.5)*(y-0.5)), 0.0,
                         imagVal, 1.0); 
    } else if (potentialType == DOUBLE_SLIT) {
        if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             (x >= x1 + spacing/2.0 &&
              x <= x2 - spacing/2.0
             ) || x >= x2 + spacing/2.0
            )) {
            fragColor = vec4(a, 0.0, imagVal, 1.0); 
        } else {
            fragColor = vec4(0.0, 0.0, imagVal, 1.0); 
        }
    } else if (potentialType == SINGLE_SLIT) {
         if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             x >= x1 + spacing/2.0)) {
            fragColor = vec4(a, 0.0, imagVal, 1.0); 
        } else {
            fragColor = vec4(0.0, 0.0, imagVal, 1.0); 
        }
    } else if (potentialType == STEP) {
        if (y > y0) {
            fragColor = vec4(a, 0.0, imagVal, 1.0);
        } else {
            fragColor = vec4(0.0, 0.0, imagVal, 1.0);
        }
    } else if (potentialType == INV_R) {
        float u = 10.0*(x - 0.5);        
        float v = 10.0*(y - 0.5);
        float oneOverR = 1.0/sqrt(u*u + v*v);
        float val = (oneOverR < 50.0)? oneOverR: 50.0;
        fragColor = vec4(val, 0.0, imagVal, 1.0); 
    } else if (potentialType == TRIPLE_SLIT) {
        float val = 15.0;   
        if ((y <= 0.45 || y >= 0.48) || (x > 0.49 && x < 0.51)
            || (x > 0.43 && x < 0.45) || (x > 0.55 && x < 0.57)) {
            fragColor = vec4(0.0, 0.0, imagVal, 1.0);
        } else {
            fragColor = vec4(val, 0.0, imagVal, 1.0);
        }
    } else if (potentialType == NEG_INV_R) {
        float u = x - 0.5;        
        float v = y - 0.5;
        float oneOverR = -a/sqrt(u*u + v*v);
        /// float val = (oneOverR < -1000.0)? -1000.0: oneOverR;
        fragColor = vec4(oneOverR + 7.0, 0.0, imagVal, 1.0);
    } else if (potentialType == LOG_R) {
        float u = x - 0.5;        
        float v = y - 0.5;
        float logR = log(sqrt(u*u + v*v));
        /// float val = (oneOverR < -1000.0)? -1000.0: oneOverR;
        fragColor = vec4(logR + 10.0, 0.0, imagVal, 1.0);
    } else if (potentialType == CONE) {
        float u = x - 0.5;        
        float v = y - 0.5;
        fragColor = vec4(a*sqrt(u*u + v*v), 0.0, imagVal, 1.0);
    } else if (potentialType == CIRCLE) {
        float u = x - 0.5;
        float v = y - 0.5;
        float r = sqrt(u*u + v*v);
        float val = a*smoothstep(spacing - 0.02, 
                                 spacing + 0.02, r);
        fragColor = vec4(val, 0.0, imagVal, 1.0);
    } else {
        fragColor = vec4(0.0, 0.0, imagVal, 1.0); 
    }
}
