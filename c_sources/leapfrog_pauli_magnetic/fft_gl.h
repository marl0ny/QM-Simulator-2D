#include "complex2/fft.h"
#include "gl_wrappers/gl_wrappers.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifndef _FFT_GL_
#define _FFT_GL_

void reverse_bit_sort(int rearrange_program,
                      frame_id lookup_table,
                      frame_id initial, frame_id dest);

void make_reverse_bit_sort_table(frame_id texture_table, int size);

frame_id fft_iter(int fft_iter_program,
                  frame_id fft_iter1, frame_id fft_iter2,
                  int size, int is_vertical);

frame_id ifft_iter(int fft_iter_program,
                   frame_id fft_iter1, frame_id fft_iter2,
                   int size, int is_vertical);

#endif

#ifdef __cplusplus
}
#endif

