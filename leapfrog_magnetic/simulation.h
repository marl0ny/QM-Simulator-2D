#include "complex2/complex2.h"
#include "gl_wrappers/gl_wrappers.h"

#ifdef __cplusplus
extern "C" {
#endif

#ifndef _SIMULATION_
#define _SIMULATION_


#define SQUARE_SIDE_LENGTH 128
#define MAX_WIDTH SQUARE_SIDE_LENGTH
#define MAX_HEIGHT SQUARE_SIDE_LENGTH
#define START_WIDTH SQUARE_SIDE_LENGTH
#define START_HEIGHT SQUARE_SIDE_LENGTH


struct SimParams {
    int use_gpu_for_timestep;
    int is_initial_step;
    int enable_spin_interaction;
    int use_ft_for_momentum_terms;
    int steps_per_frame;
    int texel_width, texel_height;
    float dt;
    float m, hbar, c, q;
    float width, height, dx, dy;
    struct {
        float amplitude;
        float sigma_x, sigma_y;
        float u0, v0;
        float nx, ny;
        struct Vec3 spin_direction;
        struct Complex2 spin;
    } init_wavepacket;
    struct {
        int which;
        float x_amplitude;
        float y_amplitude;
    } preset_potential;
};

struct Programs {
    GLuint zero, copy, resize_copy, copy2, scale, complex_multiply;
    GLuint init_dist;
    GLuint leapfrog;
    GLuint current;
    GLuint preset_potential;
    GLuint preset_magnetic_field;
    GLuint curl;
    GLuint fft_iter, rearrange;
    GLuint view;
};

struct Frames {
    union {
        struct {
            frame_id view;
            frame_id secondary_view;
            frame_id wavefunc[3];
            frame_id px, py, p2;
            frame_id wavefunc_p;
            frame_id gradx_wavefunc_p, grady_wavefunc_p;
            frame_id p2_wavefunc_p;
            frame_id gradx_wavefunc, grady_wavefunc;
            frame_id p2_wavefunc;
            frame_id potential;
            frame_id magnetic_field;
            frame_id current;
            frame_id bit_sort_table;
            frame_id fft_iter2[2];
            frame_id summation_iter8[8];
        };
        struct {
            frame_id main_view;
            frame_id sub_view;
            frame_id simulation[16];
            frame_id fft[3];
            frame_id summations[8];
        };
    };
};

struct Bufs {
    struct Complex2 *wavefunc[3];
    struct Complex2 *wavefunc_p;
    struct Complex2 *gradx_wavefunc_p, *grady_wavefunc_p;
    struct Complex2 *p2_wavefunc_p;
    struct Complex2 *gradx_wavefunc, *grady_wavefunc;
    struct Complex2 *p2_wavefunc;
    struct Complex2 *px, *py, *p2;
    struct Vec4 *potential;
    struct Vec4 *magnetic_field;
    float *freq_h;
    float *freq_v;
};

void init_sim_params(struct SimParams *sim_params);

void init_programs(struct Programs *programs);

void init_frames(struct Frames *quads,
                 const struct SimParams *sim_params);

void init_bufs(struct Bufs *bufs);

void set_uniforms_dx_dy_width_height(float dx, float dy,
                                     float width, float height);

void init_momentum_frames(const struct SimParams *params,
                          const struct Frames *quads,
                          const struct Bufs *bufs);

void init_wavepacket(GLuint init_wavepacket_program,
                     const struct SimParams *params,
                     frame_id frame1, frame_id frame2);

void init_preset_potential(const struct SimParams *params,
                           const struct Programs *programs,
                           const struct Frames *quads,
                           const struct Bufs *bufs);

void swap3(frame_id *f1, frame_id *f2, frame_id *f3);

frame_id ft(const struct SimParams *params,
            const struct Programs *programs,
            const struct Frames *quads, frame_id initial);

frame_id ift(const struct SimParams *params,
            const struct Programs *programs,
            const struct Frames *quads, frame_id initial);

void timestep(const struct SimParams *params,
              const struct Programs *programs,
              const struct Frames *quads);

void timestep_cpu(const struct SimParams *params,
                  const struct Programs *programs,
                  const struct Frames *quads,
                  struct Bufs *bufs);

#endif

#ifdef __cplusplus
}
#endif
