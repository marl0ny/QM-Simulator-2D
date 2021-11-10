
## Possible New Features

### Schrodinger Simulation
 - [x] Include other numerical schemes.
 - [ ] Implement the 3-vector potential A.
 - [ ] Find a way to visually show expectation values such as \<x\> or \<v\>.
 - [ ] Add a text-based way to initialize the wavefunction.
 - [ ] View wavefunction in momentum space
 - [ ] Compute and visualize energy eigenstates for arbitrary potentials. Construct wavefunctions from their superpositions. Add a measure energy feature.
 - [ ] Add iteration controls and error tolerance to the CN Jacobi method.
 - [ ] For the different methods need to change the default time step and grid sizes. For the Split-Op method need to make periodic the only possible boundary condition.
 - [ ] Add new potentials (like Coulomb) for the Split-Step and CN Jacobi methods which Leapfrog was not able to handle. When using Leapfrog these potentials should not be available.
 - [ ] Add a method option which uses the exact analytical formulas (only analytical potentials would be available).

### Dirac Simulation
 - [ ] Include the 3-vector potential as well.
 - [ ] Add the ability to initialize the wavefunction in terms of a linear combination of the different spinor components. 

 ## Bugs
  - In the Split-Op. simulation, when switching to a different power of two grid size, the simulation does not work properly.
  This is not an issue when first using the other methods with the new power of two texture and switching to the Split-Op. method.
  - Need to now fix that when changing to a non-square dimension the actual dimensions remain a square.
  - The transmission and reflection for Split-Operator and the other methods are different, with Split-Operator admitting more transmittance. This is evident with the default step potential example.

##
- Find clearer ways to organize and name the widgets
