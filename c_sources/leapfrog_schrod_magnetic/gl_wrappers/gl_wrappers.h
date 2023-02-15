#define GL_SILENCE_DEPRECATION
// #define GLFW_INCLUDE_GLCOREARB
#define GLFW_INCLUDE_ES3
#include <GLFW/glfw3.h>

#ifdef __cplusplus
extern "C" {
#endif

#ifndef _GL_WRAPPERS
#define _GL_WRAPPERS

typedef int frame_id;

struct TextureParams {

    /* Type of texture. */
    int type; // Either GL_FLOAT, GL_INT, etc.

    /* Dimensions of texture. */
    int width, height;

    /* Whether to create a mipmap or not. */
    int generate_mipmap; // 1=generate mipmap, 0=don't

    /* Value sampled when reading from texture coordinates
       beyond the texture boundaries.
       wrap_s deals with the first texture coordinate, s, while
       wrap_t deals with the second, t.*/
    int wrap_s, wrap_t; // GL_CLAMP_TO_EDGE, GL_REPEAT, etc.

    /* Interpolation used when sampling the texture.
       mag_fiter is for magnification to a larger texture,
       min_filter is for minification.*/
    int min_filter, mag_filter; // GL_LINEAR, GL_NEAREST, etc
};


struct VertexParam {
    char *name; // The name of the attribute.
    GLint size; // Number of components for this attribute
    GLenum type; // Type of the data
    GLboolean normalized; // Whether the data is normalized or not
    GLsizei stride; // Stride
    GLuint64 offset; // Offset, in number of bytes
};


struct Vec2 {
    union {
        struct { float x, y; };
        struct { float u, v; };
        struct { float s, t; };
        struct { float ind[2]; };
    };
};

struct DVec2 {
    union {
        struct { double x, y; };
        struct { double u, v; };
        struct { double s, t; };
        struct { double ind[2]; };
    };
};

struct IVec2 {
    union {
        struct { int32_t x, y; };
        struct { int32_t i, j; };
        struct { int32_t u, v; };
        struct { int32_t s, t; };
        struct { int32_t ind[2]; };
    };
};

struct UVec2 {
    union {
        struct { uint32_t x, y; };
        struct { uint32_t u, v; };
        struct { uint32_t s, t; };
        struct { uint32_t ind[2]; };
    };
};

struct Vec3 {
    union {
        struct { float x, y, z; };
        struct { float r, g, b; };
        struct { float s, t, p; };
        struct { float ind[3]; };
    };
};

struct IVec3 {
    union {
        struct { int32_t x, y, z; };
        struct { int32_t i, j, k; };
        struct { int32_t r, g, b; };
        struct { int32_t s, t, p; };
        struct { int32_t ind[3]; };
    };
};

struct DVec3 {
    union {
        struct { double x, y, z; };
        struct { double r, g, b; };
        struct { double s, t, p; };
        struct { double ind[3]; };
    };
};

struct Vec4 {
    union {
        struct { float x, y, z, w; };
        struct { float r, g, b, a; };
        struct { float s, t, p, q; };
        struct { float ind[4]; };
    };
};

struct Matrix4x4 {
    union {
        struct {float as_array[16]; };
        struct {float ind[4][4]; };
    };
};

struct DVec4 {
    union {
        struct { double x, y, z, w; };
        struct { double r, g, b, a; };
        struct { double s, t, p, q; };
        struct { double ind[4]; };
    };
};

struct IVec4 {
    union {
        struct { int32_t x, y, z, w; };
        struct { int32_t i, j, k, l; };
        struct { int32_t r, g, b, a; };
        struct { int32_t s, t, p, q; };
        struct { int32_t ind[4]; };
    };
};

struct UVec4 {
    union {
        struct { uint32_t x, y, z, w; };
        struct { uint32_t r, g, b, a; };
        struct { uint32_t s, t, p, q; };
        struct { uint32_t ind[4]; };
    };
};


GLFWwindow *init_window(int width, int height);

GLuint make_program(const char *path_vertex, const char *path_fragment);

GLuint make_quad_program(const char *path_to_fragment_shader_file);

GLuint make_quad_program_from_string_source(const char *src);

int new_frame(const struct TextureParams *texture_params,
              float *vertices, int sizeof_vertices,
              int *elements, int sizeof_elements);

frame_id new_quad(const struct TextureParams *texture_params);

void bind_frame(int frame2d_id, GLuint program);

void set_vertex_attributes(const struct VertexParam *vertex_params,
                           int n);

void bind_quad(frame_id quad_id, GLuint program);

void set_int_uniform(const char *name, int val);

void set_sampler2D_uniform(const char *name, int val);

void set_float_uniform(const char *name, float val);

void set_vec2_uniform(const char *name, float v0, float v1);

void set_vec3_uniform(const char *name, float v0, float v1, float v2);

void set_vec4_uniform(const char *name,
                      float v0, float v1, float v2, float v3);

void set_ivec2_uniform(const char *name, int v0, int v1);

void set_ivec3_uniform(const char *name, int v0, int v1, int v2);

void set_matrix4_uniform(const char *name, float *matrix);

void print_user_defined_uniforms();

void unbind();

void draw_quad();

void draw_unbind_quad();

void get_quad_texture_array(int quad_id,
                            int x0, int y0, int width, int height,
                            int texture_type, void *array);

void quad_substitute_array(int quad_id, int width, int height,
                           int texture_type, void *array);


#endif


#ifdef __cplusplus
}
#endif
