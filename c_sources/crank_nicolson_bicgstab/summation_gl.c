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

struct Vec4 texture_reduction_sum(int scale_program,
                                  frame_id init_quad, frame_id *sum_quads,
                                  size_t init_size) {
    int i = 0;
    for (int size = init_size/2; size >= 2; i++, size /= 2) {
        glViewport(0, 0, size, size);
        bind_quad(sum_quads[i], scale_program);
        set_float_uniform("scale", 4.0);
        frame_id tmp = (i == 0)? init_quad: sum_quads[i-1];
        set_sampler2D_uniform("tex", tmp);
        draw_unbind();
    }
    struct Vec4 arr[4];
    get_texture_array(sum_quads[i-1], 0, 0, 2, 2, GL_FLOAT, arr);
    glViewport(0, 0, init_size, init_size);
    return sum_vec4_array(2, 2, arr);
}
