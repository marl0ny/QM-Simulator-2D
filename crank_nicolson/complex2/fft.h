#include <math.h>
#include <complex.h>
#include "complex2.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifndef _FFT_
#define _FFT_

void bit_reverse(struct Complex2 *arr, int n);

void square_bit_reverse(struct Complex2 *arr, int n);

void inplace_fft(struct Complex2 *z, int n);

void inplace_ifft(struct Complex2 *z, int n);

void inplace_fft2(struct Complex2 *z, int w);

void inplace_ifft2(struct Complex2 *z, int w);

void fftfreq(float *arr, int n);

void fftfreq2(float *horizontal, float *vertical,
              int w, int h);


#endif

#ifdef __cplusplus
}
#endif
