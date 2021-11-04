precision highp float;
#if __VERSION__ == 300
#define texture2D texture
in vec2 fragTexCoord;
out vec4 fragColor;
#else
#define fragColor gl_FragColor
varying highp vec2 fragTexCoord;
#endif
uniform float width;
uniform float height;
uniform sampler2D tex;
uniform sampler2D lookupTex;


// The reverse bit sort table needs to be re-computed
// each time the dimensions change.

void main() {
    vec2 xy = fragTexCoord;
    vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
    vec2 lookupPos = texture2D(lookupTex, xy).xy;
    /*#if __VERSION__ >= 130
    ivec2 intLookupPos = ivec2(int(width*lookupPos.x),
                               int(height*lookupPos.y));
    col += texelFetch(tex, intLookupPos, 0);
    #else*/
    col += texture2D(tex, lookupPos);
    fragColor = col;
    // #endif
}
