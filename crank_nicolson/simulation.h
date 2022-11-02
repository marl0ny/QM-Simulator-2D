#include "gl_wrappers/gl_wrappers.h"
#include "complex2/complex2.h"

#ifdef __cplusplus
//extern "C" {
#endif

#ifndef _SIMULATION_
#define _SIMULATION_

#define SQUARE_SIDE_LENGTH 256
#define MAX_WIDTH 512
#define MAX_HEIGHT 512
#define START_WIDTH SQUARE_SIDE_LENGTH
#define START_HEIGHT SQUARE_SIDE_LENGTH


struct SimParams {
    int steps_per_frame;
    int texel_width, texel_height;
    struct Complex2 dt;
    float hbar;
    float m;
    float width, height;
    float dx, dy;
    struct {
        float amplitude;
        float sigma_x, sigma_y;
        float u0, v0;
        float nx, ny;
        struct Complex2 spin;

    } init_wavepacket;
};

struct Programs {
    GLuint zero, copy, resize_copy, copy2, scale;
    GLuint add2, add3, multiply, inner_product;
    GLuint init_dist, preset_potential;
    GLuint explicit_part, implicit_part;
    GLuint view;
};

#define N_SIM_FRAMES 3
#define N_ITER_FRAMES 13
#define SUM_FRAMES 8

struct Frames {
    union {
        struct {
            frame_id main_view;
            frame_id secondary_view;
            frame_id wavefunc[2];
            frame_id potential;
            frame_id bicgstab[N_ITER_FRAMES];
            frame_id summation_iter8[SUM_FRAMES];
        };
        struct {
            frame_id views[2];
            frame_id simulation[N_SIM_FRAMES];
            frame_id iter_solver[N_ITER_FRAMES];
            frame_id summations[SUM_FRAMES];
        };
    };
};


void init_sim_params(struct SimParams *params);

void init_programs(struct Programs *programs);

void init_frames(struct Frames *quads, const struct SimParams *params);

void set_dx_dy_width_height(float dx, float dy, float width, float height);

void timestep(const struct SimParams *params,
              const struct Programs *programs, struct Frames *quads);

#endif

#ifdef __cplusplus
// }
#endif
