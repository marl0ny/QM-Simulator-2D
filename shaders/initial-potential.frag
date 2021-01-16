#define NAME initializePotentialFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform int potentialType;

// Controls size of potential
uniform float a;

// For the double slit
uniform float y0;
uniform float w;
uniform float spacing;
uniform float x1;
uniform float x2;


void main() {
    float x = fragTexCoord.x;
    float y = fragTexCoord.y;
    if (potentialType == 1) {
        gl_FragColor = vec4(a*((x-0.5)*(x-0.5) + (y-0.5)*(y-0.5)), 0.0, 0.0, 1.0); 
    } else if (potentialType == 2) {
        if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             (x >= x1 + spacing/2.0 &&
              x <= x2 - spacing/2.0
             ) || x >= x2 + spacing/2.0
            )) {
            gl_FragColor = vec4(a, 0.0, 0.0, 1.0); 
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
        }
    } else if (potentialType == 3) {
         if (y <= (y0 + w/2.0) &&
            y >= (y0 - w/2.0) &&
            (x <= x1 - spacing/2.0 ||
             x >= x1 + spacing/2.0)) {
            gl_FragColor = vec4(a, 0.0, 0.0, 1.0); 
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
        }
    } else if (potentialType == 4) {
        float u = 10.0*(x - 0.5);        
        float v = 10.0*(y - 0.5);
        float oneOverR = 1.0/sqrt(u*u + v*v);
        float val = (oneOverR < 50.0)? oneOverR: 50.0;
        gl_FragColor = vec4(val, 0.0, 0.0, 1.0); 
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
    }
}