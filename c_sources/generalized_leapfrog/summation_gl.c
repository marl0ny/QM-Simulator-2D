#include "summation_gl.h"


struct Vec4 sum_vec4_array(int width, int height,
                           const struct Vec4 *arr) {
    struct Vec4 res;
    for (int k = 0; k < 4; k++) {
        res.ind[k] = 0.0;
    }
    for (int i = 0; i < height; i++) {
        for (int j = 0; j < width; j++) {
            for (int k = 0; k < 4; k++) {
                res.ind[k] += arr[i*width + j].ind[k];
            }
        }
    }
    return res;
}

SummationFrames init_summation_frames(struct TextureParams tex_params,
                                      int n) {
    SummationFrames s = {.n = n, .ind={0,}};
    for (int i = 0; i < s.n - 1; i++) {
        tex_params.width /= 2;
        tex_params.height /= 2;
        s.ind[i] = new_quad(&tex_params);
    }
    return s;
}

struct Vec4 texture_reduction_sum(int scale_program,
                                  frame_id init_quad,
                                  SummationFrames *sum_quads) {
    int init_size = 1;
    for (int i = 1; i <= sum_quads->n; i++) init_size *= 2;
    int i = 0;
    for (int size = init_size/2; size >= 2; i++, size /= 2) {
        glViewport(0, 0, size, size);
        bind_quad(sum_quads->ind[i], scale_program);
        set_float_uniform("scale", 4.0);
        frame_id tmp = (i == 0)? init_quad: sum_quads->ind[i-1];
        set_sampler2D_uniform("tex", tmp);
        draw_unbind_quad();
    }
    struct Vec4 arr[4];
    get_quad_texture_array(sum_quads->ind[i-1], 0, 0, 2, 2, GL_FLOAT, arr);
    glViewport(0, 0, init_size, init_size);
    return sum_vec4_array(2, 2, arr);
}

