#ifndef _SIMULATION_H_
#define _SIMULATION_H_

#include "gl_wrappers/gl_wrappers.h"
#include "summation_gl.h"
#include <complex.h>


struct SimPrograms {
    int zero, copy, scale;
    int scale_add2;
    int complex_abs2;
    int init;
    int iter;
};

#define MAX_ITER_FRAMES 10
struct IterRes {
    int number_of;
    frame_id ind[MAX_ITER_FRAMES];
};

struct SimFrames {
    frame_id psi_potential[3];
    frame_id abs_psi2;
    struct IterRes iter_res;
    frame_id temps[3];
    SummationFrames summation;
};

struct SimParams {
    double complex dt;
    int time_accuracy;
    int spatial_accuracy;
    int step_count;
    float dx, dy, width, height;
    int texel_width, texel_height;
    float hbar, m;
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

/*
 The time stepping scheme follows equations 3.9 to 3.10 on pg 39-40
 of this article:

 Ira Moxley III, F. (2013).
 Generalized finite-difference time-domain schemes for solving
 nonlinear Schrödinger equations. Dissertation, 290.
 https://digitalcommons.latech.edu/cgi/viewcontent.cgi
 ?article=1284&context=dissertations)
 
*/
void timestep(SimFrames *frames, SimPrograms *programs, SimParams *params);

#endif
