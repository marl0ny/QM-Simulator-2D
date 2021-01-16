#define NAME reshapePotentialFragmentSource
precision highp float;
varying highp vec2 fragTexCoord;
uniform sampler2D tex1;
uniform float bx;
uniform float by;
uniform float v2;


void main() {
    vec2 xy = fragTexCoord.xy;
    float initialV = texture2D(tex1, fragTexCoord).r;
    if ((xy.x - bx)*(xy.x - bx) < 0.0001 && (xy.y - by)*(xy.y - by) < 0.0001
         && initialV < v2) {
        gl_FragColor = vec4(v2, (initialV + v2)/2.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(initialV, initialV, 0.0, 1.0);
    }
}
