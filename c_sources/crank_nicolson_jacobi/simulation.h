#ifndef _SIMULATION_H_
#define _SIMULATION_H_

#include "gl_wrappers/gl_wrappers.h"
#include "summation_gl.h"
#include <complex.h>


struct SimPrograms {
    int zero, copy, scale;
    int complex_scale;
    int complex_add2;
    int complex_abs2;
    int init;
    int implicit_iter;
    int explicit_step;
    int potential_step;
};

struct SimFrames {
    frame_id psi_potential[2];
    frame_id abs_psi2;
    frame_id temps[2];
    SummationFrames summation;
};

struct SimParams {
    _Complex double dt;
    int step_count;
    float dx, dy, width, height;
    int texel_width, texel_height;
    float alpha;
    double norm;
};

typedef struct SimPrograms SimPrograms;
typedef struct SimFrames SimFrames;
typedef struct SimParams SimParams;

void init_sim_programs(SimPrograms *programs);

void init_sim_frames(SimFrames *frames, const SimParams *params);

void init_sim_params(SimParams *params);

void init_psi_potential(SimFrames *frames, SimPrograms *programs,
                        SimParams *params);

void timestep(SimFrames *frames, SimPrograms *programs, SimParams *params);

#endif
