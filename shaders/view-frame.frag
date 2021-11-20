#define NAME viewFrameFragmentSource
precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float x0;
uniform float y0;
uniform float w;
uniform float h;
uniform float lineWidth;
uniform float brightness;
uniform float brightness2;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform sampler2D texV;
uniform sampler2D vecTex;
uniform sampler2D textTex;
uniform sampler2D backgroundTex;
// TODO: Split this up into separate modes that deal with the 
// potential, wavefunction, and probability current individually.
uniform int displayMode;
uniform int backgroundDisplayMode;
uniform vec3 probColour;
uniform vec3 potColour;

#define DISPLAY_ONLY_PROB_DENSITY 0
#define DISPLAY_PHASE 1
#define DISPLAY_CURRENT_WITH_PROB 2
#define DISPLAY_CURRENT_WITH_PHASE 3

#define DISPLAY_BACKGROUND 1


vec4 drawWindow(vec4 pix, float x, float y,
                float x0, float y0, float w, float h,
                float lineWidth) {
    y0 = (h < 0.0)? y0 + h: y0;
    h = (h < 0.0)? -h: h;
    x0 = (w < 0.0)? x0 + w: x0;
    w = (w < 0.0)? -w: w;
    if ((x >= x0 && x <= (x0 + w)) &&
        (
            (abs(y - y0) <= lineWidth/2.0) ||
            (abs(y - y0 - h) <= lineWidth/2.0)
        )
    ) {
        return vec4(1.0, 1.0, 1.0, 1.0);
    }
    if ((y > y0 && y < (y0 + h)) &&
        (
            (abs(x - x0) <= lineWidth/2.0) ||
            (abs(x - x0 - w) <= lineWidth/2.0)
        )
    ) {
        return vec4(1.0, 1.0, 1.0, 1.0);
    }
    return pix;
}


vec3 argumentToColour(float argVal) {
    float pi = 3.141592653589793;
    float maxCol = 1.0;
    float minCol = 50.0/255.0;
    float colRange = maxCol - minCol;
    if (argVal <= pi/3.0 && argVal >= 0.0) {
        return vec3(maxCol,
                    minCol + colRange*argVal/(pi/3.0), minCol);
    } else if (argVal > pi/3.0 && argVal <= 2.0*pi/3.0){
        return vec3(maxCol - colRange*(argVal - pi/3.0)/(pi/3.0),
                    maxCol, minCol);
    } else if (argVal > 2.0*pi/3.0 && argVal <= pi){
        return vec3(minCol, maxCol,
                    minCol + colRange*(argVal - 2.0*pi/3.0)/(pi/3.0));
    } else if (argVal < 0.0 && argVal > -pi/3.0){
        return vec3(maxCol, minCol,
                    minCol - colRange*argVal/(pi/3.0));
    } else if (argVal <= -pi/3.0 && argVal > -2.0*pi/3.0){
        return vec3(maxCol + (colRange*(argVal + pi/3.0)/(pi/3.0)),
                    minCol, maxCol);
    } else if (argVal <= -2.0*pi/3.0 && argVal >= -pi){
        return vec3(minCol,
                    minCol - (colRange*(argVal + 2.0*pi/3.0)/(pi/3.0)), maxCol);
    }
    else {
        return vec3(minCol, maxCol, maxCol);
    }
}


vec3 complexToColour(float re, float im) {
    return argumentToColour(atan(im, re));
}


void main () {
    vec4 col1 = texture2D(tex1, fragTexCoord);
    vec4 col2 = texture2D(tex2, fragTexCoord);
    vec4 col3 = texture2D(tex3, fragTexCoord);
    vec4 col4 = texture2D(texV, fragTexCoord)/(50.0*1.0);
    float probDensity = (col1.g*col3.g + col2.r*col2.r);
    float re = col2.r;
    float im = (col3.g + col1.g)/2.0;
    vec4 pix;
    vec3 potential = col4.r*brightness2*potColour;
    if (displayMode == DISPLAY_PHASE) {
        pix = vec4(probDensity*complexToColour(re, im)*(brightness/16.0) +
                   potential,
                   // argumentToColour(2.0*3.14159*col4.r*brightness2 - 1.0)
                   // *exp(-brightness*probDensity/16.0),
                   1.0);
    } else if (displayMode == DISPLAY_ONLY_PROB_DENSITY) {
        /* vec3 colPotential = argumentToColour(2.0*3.14159*col4.r*brightness2 - 1.0)*exp(-brightness*probDensity/16.0);
        pix = vec4(probDensity*probColour[0]*(brightness/16.0) + colPotential.r,
                   probDensity*probColour[1]*(brightness/16.0) + colPotential.g,
                   probDensity*probColour[2]*(brightness/16.0) + colPotential.b, 
                   1.0);*/
        pix = vec4(probDensity*probColour[0]*(brightness/16.0) + potential.r,
                   probDensity*probColour[1]*(brightness/16.0) + potential.g,
                   probDensity*probColour[2]*(brightness/16.0) + potential.b, 
                   1.0);
    } else if (displayMode == DISPLAY_CURRENT_WITH_PHASE) {
        pix = vec4(probDensity*complexToColour(re, im)*(brightness/16.0) +
                   potential,
                   1.0);
        pix += 10.0*texture2D(vecTex, fragTexCoord);
    } else if (displayMode == DISPLAY_CURRENT_WITH_PROB) {
        pix = vec4(probDensity*probColour[0]*(brightness/16.0) + potential.r,
                   probDensity*probColour[1]*(brightness/16.0) + potential.g,
                   probDensity*probColour[2]*(brightness/16.0) + potential.b,
                   1.0);
        pix += 10.0*texture2D(vecTex, fragTexCoord);
    }
    fragColor = drawWindow(pix, fragTexCoord.x, fragTexCoord.y,
                              x0, y0, w, h, lineWidth) +
                              texture2D(textTex, fragTexCoord);
}
