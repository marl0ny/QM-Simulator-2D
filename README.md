# Quantum Mechanics in 2D
This [WebGL program](https://marl0ny.github.io/QM-Simulator-2D/index.html) simulates the quantum mechanics of a single particle confined in a 2D box, where inside this box the user can create new potential barriers and scatter gaussian wavepackets off them. The full instructions are found [here](https://github.com/marl0ny/QM-Simulator-2D/blob/main/INSTRUCTIONS.md).

The simulation uses an integration method described in page 690 of <em>An Introduction to Computer Simulation Methods</em> by H. Gould et al (which references an [article](https://aip.scitation.org/doi/pdf/10.1063/1.168415) by P. Visscher). This method involves splitting the complex-valued wavefunction into its real and imaginary components, where each component is updated separately for each time step. 

Also provided is a (work in progress) [simulation of a 2D relativistic quantum particle](https://marl0ny.github.io/QM-Simulator-2D/rel-qm.html) using the Dirac equation. This uses a numerical method that involves updating the two two-component spinors at staggered time and spatial steps, which is found in an [article](https://arxiv.org/abs/1306.5895) by R. Hammer and W. Pötz.

# References
 - Gould, H., Tobochnik J., Christian W. (2007). Quantum Systems.
 In <em>An Introduction to Computer Simulation Methods</em>, 
chapter 16. Pearson Addison-Wesley.

 - Visscher, P. (1991). A fast explicit algorithm for the time‐dependent Schrödinger equation. <em>Computers in Physics, 5</em>, 596-598. [https://doi.org/10.1063/1.168415](https://doi.org/10.1063/1.168415)
 
 - Schroeder D. [Quantum Scattering in Two Dimensions](https://physics.weber.edu/schroeder/software/QuantumScattering2D.html).

 Dirac Equation:

 - Wikipedia contributors. (2021, June 16). [Dirac equation](https://en.wikipedia.org/wiki/Dirac_equation). In <em>Wikipedia, The Free Encyclopedia</em>.

 - Wikipedia contributors. (2021, August 5). [Dirac spinor](https://en.wikipedia.org/wiki/Dirac_spinor). In <em>Wikipedia, The Free Encyclopedia</em>.

 - Hammer, R., Pötz W. (2014). Staggered grid leap-frog scheme for the (2 + 1)D Dirac equation. <em>Computer Physics Communications, 185(1)</em>, 40-53. [https://doi.org/10.1016/j.cpc.2013.08.013](https://doi.org/10.1016/j.cpc.2013.08.013)


 ###

Hartree Atomic Units:
 - Wikipedia contributors. (2021, May 14). [Hartree atomic units](https://en.wikipedia.org/wiki/Hartree_atomic_units). In <em>Wikipedia, The Free Encyclopedia</em>.

 Names of the Different Boundary Conditions:
 - Wikipedia contributors. (2021, March 7). [Boundary value problem](https://en.wikipedia.org/wiki/Boundary_value_problem). In <em>Wikipedia, The Free Encyclopedia</em>.
