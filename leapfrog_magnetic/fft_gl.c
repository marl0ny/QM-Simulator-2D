#include <stdlib.h>
#include "fft_gl.h"


void swap2(frame_id *f1, frame_id *f2) {
    frame_id tmp = *f2;
    *f2 = *f1;
    *f1 = tmp;
}

void reverse_bit_sort(int rearrange_program,
                      frame_id lookup_table,
                      frame_id initial, frame_id dest) {
    bind_quad(dest, rearrange_program);
    set_sampler2D_uniform("tex", initial);
    set_sampler2D_uniform("lookupTex", lookup_table);
    draw_unbind();
}

void make_reverse_bit_sort_table(frame_id texture_table, int size) {
    struct Vec4 *table = (struct Vec4 *)malloc(size*size*sizeof(struct Vec4));
    for (int i = 0; i < size; i++) {
        for (int j = 0; j < size; j++) {
            table[i*size + j].ind[0] = (float)j/(float)size;
            table[i*size + j].ind[1] = (float)i/(float)size;
            table[i*size + j].ind[2] = 0.0;
            table[i*size + j].ind[3] = 1.0;
        }
    }
    square_bit_reverse((struct Complex2 *)table, size);
    substitute_array(texture_table, size, size,
                     GL_FLOAT, table);
    free(table);
}

frame_id fft_iter(int fft_iter_program,
                  frame_id fft_iter1, frame_id fft_iter2,
                  int size, int is_vertical) {
    frame_id iter2[2] = {fft_iter1, fft_iter2};
    for (float block_size = 2.0; block_size <= size; block_size *= 2) {
        bind_quad(iter2[1], fft_iter_program);
        set_sampler2D_uniform("tex", iter2[0]);
        set_int_uniform("isVertical", is_vertical);
        set_float_uniform("blockSize", block_size/(float)size);
        set_float_uniform("angleSign", -1.0);
        set_float_uniform("size", (float)size);
        set_float_uniform("scale", 1.0);
        draw_unbind();
        swap2(&iter2[0], &iter2[1]);
    }
    return iter2[0];
}

frame_id ifft_iter(int fft_iter_program,
                   frame_id fft_iter1, frame_id fft_iter2,
                   int size, int is_vertical) {
    frame_id iter2[2] = {fft_iter1, fft_iter2};
    for (float block_size = 2.0; block_size <= size; block_size *= 2) {
        bind_quad(iter2[1], fft_iter_program);
        set_sampler2D_uniform("tex",  iter2[0]);
        set_int_uniform("isVertical", is_vertical);
        set_float_uniform("blockSize", block_size/(float)size);
        set_float_uniform("angleSign", 1.0);
        set_float_uniform("size", (float)size);
        set_float_uniform("scale", (block_size == size)? 1.0/(float)size: 1.0);
        draw_unbind();
        swap2(&iter2[0], &iter2[1]);
    }
    return iter2[0];
}
