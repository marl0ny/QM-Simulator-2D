# Quantum Mechanics in 2D
This [WebGL program](https://marl0ny.github.io/QM-Simulator-2D/index.html) simulates the quantum mechanics of a single particle confined to a 2D box, where inside this box the user can draw new potential barriers and scatter gaussian wavepackets off them. The full instructions for using this app are found [here](https://github.com/marl0ny/QM-Simulator-2D/blob/main/INSTRUCTIONS.md).

The simulation uses an integration method described in page 690 of <em>An Introduction to Computer Simulation Methods</em> by H. Gould et al (which references an [article](https://aip.scitation.org/doi/pdf/10.1063/1.168415) by P. Visscher). This method involves splitting the complex-valued wavefunction into its real and imaginary components, where each component is updated separately for each time step. 
<!-- An option to use the Crank-Nicholson with Jacobi iteration to solve the sytem of equations is used as well. !-->

# References
 - Gould, H., Tobochnik J., Christian W. (2007). Quantum Systems.
 In <em>An Introduction to Computer Simulation Methods</em>, 
chapter 16. Pearson Addison-Wesley.

 - Visscher, P. (1991). A fast explicit algorithm for the time‐dependent Schrödinger equation. <em>Computers in Physics, 5</em>, 596-598. [https://doi.org/10.1063/1.168415](https://doi.org/10.1063/1.168415)
 

 - Schroeder D. [Quantum Scattering in Two Dimensions](https://physics.weber.edu/schroeder/software/QuantumScattering2D.html).

 ###
 Names of the Different Boundary Conditions:
 - Wikipedia contributors. (2021, March 7). [Boundary value problem](https://en.wikipedia.org/wiki/Boundary_value_problem). In <em>Wikipedia, The Free Encyclopedia</em>.
