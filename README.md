# Quantum Mechanics in 2D
This [WebGL program](https://marl0ny.github.io/QM-Simulator-2D/index.html) simulates the quantum mechanics of a single particle confined to a 2D box,  where inside this box the user can draw new potential barriers and scatter gaussian wavepackets off them. The full instructions for using this app are found [here](https://github.com/marl0ny/QM-Simulator-2D/blob/main/INSTRUCTIONS.md).

The simulation uses a method described in page 690 of An Introduction to Computer Simulation Methods
by Gould H. et al., which involves splitting the wavefunction into its real and imaginary components,
performing a half-step to advance the real component in time, then using these updated real values to update the imaginary part.

# References
 - Gould, H., Tobochnik J., Christian W. (2007). Quantum Systems.
 In <em>An Introduction to Computer Simulation Methods</em>, 
chapter 16. Pearson Addison-Wesley.
 - Schroeder D. [Quantum Scattering in Two Dimensions](https://physics.weber.edu/schroeder/software/QuantumScattering2D.html).
