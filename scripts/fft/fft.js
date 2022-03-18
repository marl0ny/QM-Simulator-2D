

function bitReverse2(arr, start, end, size) {
    let n = end - start;
    let u, d, rev;
    for(let i = 0; i < n; i++) {
        u = 1;
        d = n >> 1;
        rev = 0;
        while (u < n) {
            rev += d*((i&u)/u);
            u <<= 1;
            d >>= 1;
        }
        if (rev >= i) {
            for (let k = 0; k < size; k++) {
                let tmp = arr[size*(start + i) + k];
                arr[size*(start + i) + k] = arr[size*(start + rev) + k];
                arr[size*(start + rev) + k] = tmp;
            }
        }
    }
}

function transpose(dest, src, w, h, size) {
    for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
            for (let k = 0; k < size; k++) {
                dest[size*(i*h + j) + k] = src[size*(j*w + i) + k];
            }
        }
    }
}

function flip_vert(arr, w, h, size) {
    for (let j = 0; j < h/2; j++) {
        for (let i = 0; i < w; i++) {
            for (let k = 0; k < size; k++) {
                let tmp = arr[size*(j*w + i) + k];
                arr[size*(j*w + i) + k]
                 = arr[size*((h - j - 1)*w + i) + k];
                arr[size*((h - j - 1)*w + i) + k] = tmp;
            }
        }
    }
}

function fftFreq(arr, start, end) {
    let n = end - start;
    if (n % 2 === 0) {
        for (let i = 0; i <= n/2 - 1; i++) {
            arr[start + i] = i;
        }
        for (let i = n - 1, j = -1; i >= n/2; i--, j--) {
            arr[start + i] = j;
        }
    } else {
        let k = 0;
        for (let i = 0; i < (n-1)/2; i++) {
            arr[start + i] = k;
            k += 1;
        }
        k = -k;
        for (let i = (n-1)/2 + 1; i < n; i++) {
            arr[start + i] = k;
            k -= 1;
        }
    }
}
/*
A Cooley-Tukey Radix-2 FFT implementation.


References:

Wikipedia - Cooley–Tukey FFT algorithm:
https://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm

Press W. et al. (1992). Fast Fourier Transform.
In Numerical Recipes in Fortran 77, chapter 12
https://websites.pmc.ucsc.edu/~fnimmo/eart290c_17/NumericalRecipesinF77.pdf

MathWorld Wolfram - Fast Fourier Transform:
http://mathworld.wolfram.com/FastFourierTransform.html 
*/
function fft(arr, start, end, isInverse=false) {
    bitReverse2(arr, start, end, 4);
    let n = end - start;
    // let blockTotal;
    sign = (isInverse)? -1.0: 1.0;
    for (let blockSize = 2; blockSize <= n; blockSize *= 2) {
        for (let j = 0; j < n; j += blockSize) {
            for (let i = 0; i < blockSize/2; i++) {
                let cosVal = Math.cos(2.0*Math.PI*i/blockSize);
                let sinVal = sign*Math.sin(2.0*Math.PI*i/blockSize);
                let reEven = arr[(start + j + i)*4];
                let imEven = arr[(start + j + i)*4 + 1];
                let reOdd = arr[(start + j + i + blockSize/2)*4];
                let imOdd = arr[(start + j + i + blockSize/2)*4 + 1];
                let reExp = cosVal*reOdd - imOdd*sinVal;
                let imExp = cosVal*imOdd + sinVal*reOdd;
                let nVal = (isInverse && blockSize === n)? n: 1.0;
                arr[(start + j + i)*4] = (reEven + reExp)/nVal;
                arr[(start + j + i)*4 + 1] = (imEven + imExp)/nVal;
                arr[(start + j + i + blockSize/2)*4] = (reEven - reExp)/nVal;
                arr[(start + j + i + 
                     blockSize/2)*4 + 1] = (imEven - imExp)/nVal;
            }
        }
    }
}