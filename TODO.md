
## Possible New Features

### Schrodinger Simulation
 - [x] Include other numerical schemes.
 - [ ] Implement the 3-vector potential A.
 - [ ] Absorbing boundary conditions.
 - [ ] Find a way to visually show expectation values such as \<x\> or \<v\>.
 - [ ] Add a text-based way to initialize the wavefunction.
 - [ ] View wavefunction in momentum space
 - [ ] Compute and visualize energy eigenstates for arbitrary potentials. Construct wavefunctions from their superpositions. Add a measure energy feature.

### Dirac Simulation
 - [ ] Include the 3-vector potential as well.
 - [ ] Add the ability to initialize the wavefunction in terms of a linear combination of the different spinor components. 

 ### Visualization Options
 - [ ] Use colour for displaying the potential. The viable options are to use a colour height map, or to use a colour image where somehow its RGBA values gets mapped into a single value. In the latter option each of the individual RGBA values are just for show and don't have any actual physical meaning.
 - [ ] Make the potential and wavefunction probability density visualizations transparent in regions where their values are zero. This allows for adding a background image.
 - [ ] Have optical effects from the potential or wavefunction that change the background image.
 - [ ] Create a viewing mode where the potential is completely dark, but where the wavefunction 'lights up' the potential.

### Other Options
- [ ] Add an undo/redo button for potential barrier sketching.
