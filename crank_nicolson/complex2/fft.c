#include <stdlib.h>
#include "fft.h"

static const float TAU = 6.283185307179586;


static void transpose(float *dest, float *src, int w, int h) {
    for (int i = 0; i < h; i++) {
        for (int j = 0; j < w; j++) {
            dest[j*h + i] = src[i*w + j];
        }
    }
}

static void square_transpose(struct Complex2 *arr, int n) {
    #pragma omp parallel for
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            for (int k = 0; k < 4; k++) {
                float tmp = arr[n*i + j].ind[k];
                arr[n*i + j].ind[k] = arr[n*j + i].ind[k];
                arr[n*j + i].ind[k] = tmp;
            }
        }
    }
}

void bit_reverse(struct Complex2 *arr, int n) {
    int u, d, rev;
    for (int i = 0; i < n; i++) {
        u = 1;
        d = n >> 1;
        rev = 0;
        while (u < n) {
            rev += d*((i&u)/u);
            u <<= 1;
            d >>= 1;
        }
        if (rev >= i) {
            for (int k = 0; k < 4; k++) {
                float tmp = arr[i].ind[k];
                arr[i].ind[k] = arr[rev].ind[k];
                arr[rev].ind[k] = tmp;
            }
        }
    }
}

void square_bit_reverse(struct Complex2 *arr, int n) {
    for (int i = 0; i < n; i++) {
        bit_reverse(&arr[i*n], n);
    }
    square_transpose(arr, n);
    for (int i = 0; i < n; i++) {
        bit_reverse(&arr[i*n], n);
    }
    square_transpose(arr, n);
}

// #define _USE_COS_ARR
#ifdef _USE_COS_ARR
static const float INVSQRT2 = 0.7071067811865475;
static float _cos_arr[256];
static int _is_cos_arr_init = 0;
static void _cos_arr_init(int n) {
    float angle=TAU/n;
    float c, s;
    _cos_arr[0] = 1.0;
    _cos_arr[n/8] = INVSQRT2;
    _cos_arr[n/4] = 0.0;
    _cos_arr[3*n/8] = - INVSQRT2;
    for (int i = 1; i < n/8; i++) {
        c = cos(i*angle);
        s = sin(i*angle);
        _cos_arr[i] = c;
        _cos_arr[n/4 - i] = s;
        _cos_arr[n/4 + i] = -s;
        _cos_arr[n/2 - i] = -c;
    }
}
#endif


void _fft(int is_inverse, struct Complex2* z, int n) {
    bit_reverse(z, n);
    #ifdef _USE_COS_ARR
    if (! _is_cos_arr_init) {
        _cos_arr_init(n);
         _is_cos_arr_init = 1;
    }
    #endif
    int block_total;
    float sign = (is_inverse)? -1.0: 1.0;
    for (int block_size = 2; block_size <= n; block_size *= 2) {
        block_total = n/block_size;
        for (int j = 0; j < n; j += block_size) {
            for (int i = 0; i < block_size/2; i++) {
                #ifdef _USE_COS_ARR
                float cos_val = _cos_arr[i*block_total];  
                float sin_val = (i*block_total < n/4)?
                                (-sign*_cos_arr[i*block_total + n/4]):
                                (sign*_cos_arr[i*block_total - n/4]);
                #else
                float cos_val = cos(TAU*(float)i/(float)block_size);
                float sin_val = sign*sin(TAU*(float)i/(float)block_size);
                #endif
                struct Complex2 even, odd;
                struct Complex2 odd_exp_val;
                /*Get even and odd elements*/
                for (int k = 0; k < 4; k++) {
                    even.ind[k] = z[j + i].ind[k];
                    odd.ind[k] = z[block_size/2 + j + i].ind[k];
                }
                odd_exp_val.re1 = cos_val*odd.re1 - odd.im1*sin_val;
                odd_exp_val.im1 = cos_val*odd.im1 + sin_val*odd.re1;
                odd_exp_val.re2 = cos_val*odd.re2 - odd.im2*sin_val;
                odd_exp_val.im2 = cos_val*odd.im2 + sin_val*odd.re2;
                /* Butterfly */
                float n_val = 1.0;
                if (is_inverse && block_size == n) n_val = n;
                for (int k = 0; k < 4; k++) {
                    z[j + i].ind[k] = (even.ind[k] + odd_exp_val.ind[k])/n_val;
                    z[block_size/2 + j + i].ind[k]
                        = (even.ind[k] - odd_exp_val.ind[k])/n_val;
                }
            }
        }
    }
}

void inplace_fft(struct Complex2 *z, int n) {
    _fft(0, z, n);
}

void inplace_ifft(struct Complex2 *z, int n) {
    _fft(1, z, n);
}

void inplace_fft2(struct Complex2 *z, int w) {
    # pragma omp parallel for
    for (int i = 0; i < w; i++) {
        inplace_fft(&z[i*w], w);
    }
    square_transpose(z, w);
    # pragma omp parallel for
    for (int i = 0; i < w; i++) {
        inplace_fft(&z[i*w], w);
    }
    square_transpose(z, w);
}

void inplace_ifft2(struct Complex2 *z, int w) {
    # pragma omp parallel for
    for (int i = 0; i < w; i++) {
        inplace_ifft(&z[i*w], w);
    }
    square_transpose(z, w);
    # pragma omp parallel for
    for (int i = 0; i < w; i++) {
        inplace_ifft(&z[i*w], w);
    }
    square_transpose(z, w);
}

void fftfreq(float *arr, int n) {
    if (n % 2 == 0) {
        for (int i = 0; i <= n/2 - 1; i++) {
            arr[i] = i;
        }
        for (int i = n-1, j = -1; i >= n/2; i--, j--) {
            arr[i] = j;
        }
    } else {
        int k = 0;
        for (int i = 0; i <= (n-1)/2; i++) {
            arr[i] = k;
            k += 1;
        }
        k =  -k;
        for (int i = (n-1)/2 + 1; i < n; i++) {
            arr[i] = k;
            k -= 1;
        }
    }
}

void fftfreq2(float *horizontal, float *vertical,
              int w, int h) {
    for (int i = 0; i < h; i++) {
        fftfreq(&horizontal[h*i], w);
    }
    float *transpose_arr = (float *)malloc(w*h*sizeof(float));
    transpose(transpose_arr, vertical, w, h);
    for (int i = 0; i < w; i++) {
        fftfreq(&transpose_arr[w*i], h);
    }
    transpose(vertical, transpose_arr, h, w);
    free(transpose_arr);
}

