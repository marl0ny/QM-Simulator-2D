#include "complex2/complex2.h"
#include "gl_wrappers/gl_wrappers.h"


struct Programs {
    GLuint zero;
    GLuint copy;
    GLuint scale;
    GLuint leapfrog;
    GLuint new_wavepacket;
    GLuint surface_vert;
    GLuint view;
};

struct SimParams {
    int enable_spin_interaction;
    int steps_per_frame;
    int is_initial_step;
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
    } new_wavepacket;
};

struct Frames {
    struct {
        frame_id main;
        frame_id secondary[3];
    } view;
    struct {
        frame_id wavefunc[3];
        frame_id potential;
        frame_id magnetic_field;
        frame_id current;
    } sim;
};


void init_sim_params(struct SimParams *params);

void init_programs(struct Programs *programs);

void init_frames(struct Frames *frames, const struct SimParams *params);

void set_uniforms_dx_dy_width_height(float dx, float dy,
                                     float width, float height);

void new_wavepacket(GLuint new_wavepacket_program,
                    const struct SimParams *params, frame_id f1, frame_id f2);

void swap3(frame_id *f0, frame_id *f1, frame_id *f2);

void timestep(const struct SimParams *params, const struct Programs *programs,
              const struct Frames *quads);
