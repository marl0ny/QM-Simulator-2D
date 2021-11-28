
## Possible New Features

### Schrodinger Simulation
 - [x] Include other numerical schemes.
 - [ ] Implement the 3-vector potential A.
 - [ ] Absorbing boundary conditions.
 - [ ] Find a way to visually show expectation values such as \<x\> or \<v\>.
 - [ ] Add a text-based way to initialize the wavefunction.
 - [ ] View wavefunction in momentum space
 - [ ] Compute and visualize energy eigenstates for arbitrary potentials. Construct wavefunctions from their superpositions. Add a measure energy feature.
 - [ ] Add iteration controls and error tolerance to the CN Jacobi method.
 - [ ] For the different methods need to change the default time step and grid sizes. For the Split-Op method need to make periodic the only possible boundary condition.
 - [ ] Add new potentials (like Coulomb) for the Split-Step and CN Jacobi methods which Leapfrog was not able to handle. When using Leapfrog these potentials should not be available.
 - [ ] Add a method option which uses the exact analytical formulas (only analytical potentials would be available).
 - [ ] Asynchronous programming to properly handle web workers for the Split-Step CPU implementation.

 #### Visualization Options
These proposed changes are only for visual effects and do not correspond to anything physical.
 - [ ] Use colour for displaying the potential. The viable options are to use a colour height map, or to use a colour image where somehow its RGBA values gets mapped into a single value. In the latter option each of the individual RGBA values are just for show and don't have any actual physical meaning.
 - [ ] Make the potential and wavefunction probability density visualizations transparent in regions where their values are zero. This allows for adding a background image.
 - [ ] Have optical effects from the potential or wavefunction that change the background image.
 - [ ] Create a viewing mode where the potential is completely dark, but where the wavefunction 'lights up' the potential.

 #### Other Options
- [ ] Add an undo/redo button for potential barrier sketching.

#### Refactoring
- Add helper methods for the base methods in SimulationManager base class.
- Use the non-staggered implementations as the base method for SimulationManager. The Leapfrog class will overwrite these with its staggered implementations.
- Instead of having many of the gui functions within the main function, perhaps put these outside instead in a better file.
- Add comments and descriptions for the shaders.
- Add tests

### Dirac Simulation
 - [x] Include the 3-vector potential as well.
 - [ ] Add the ability to initialize the wavefunction in terms of a linear combination of the different spinor components.
 - [ ] Add other methods like Split-Operator


 ## Bugs
  - <s>In the Split-Op. simulation, when switching to a different power of two grid size, the simulation does not work properly.
  This is not an issue when first using the other methods with the new power of two texture and switching to the Split-Op. method. This seems to now be mostly resolved.</s>
  - <s>Need to now fix that when changing to a non-square dimension the actual dimensions remain a square.</s>
  - <s>For Split-Op. Nonlinear, the potential changes when dt changes.</s>
  - The transmission and reflection for Split-Operator and the other methods are different, with Split-Operator admitting more transmittance. This is evident with the default step potential example.
 - The Split-Op. method does not work with WebGL 1. This is because when using WebGL 1 the interpolation is set to only LINEAR, which causes the rearrange shader program that handles reverse bit sorting to fail.
  - For the Dirac simulation, setting the interpolation to NEAREST causes the simulation to be instable, since with this setting the spinors are no longer accessed in a staggered fashion. Add parameters to the gl creation functions that set the interpolation instead of controlling it in the functions themselves.
  - Also for the Dirac simulation, the conserved probability density and current may not be calculated properly given the staggered grid. This may be the reason for the 'checkerboard' numerical artifacts that sometimes appear.
  - The Dirac simulation doesn't seem to be symmetric under time reversal, as can be seen when switching from a positive to a negative time step.
  - When using the dimensions of an image for the simulation need to update the grid size controls as well.
