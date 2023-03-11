#include "complex.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifndef _COMPLEX2_
#define _COMPLEX2_


struct Complex2 {
    union {
        struct {
            float x1, y1, x2, y2;
        };
        struct {
            float re1, im1, re2, im2;
        };
        struct {
            float _Complex z1, z2;
        };
        struct {
            float _Complex c2[2];
        };
        struct {
            float ind[4];
        };
    };
};


#endif

#ifdef __cplusplus
}
#endif
