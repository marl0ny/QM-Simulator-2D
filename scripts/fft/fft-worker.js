
function bitReverse2(arr, size) {
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
                let tmp = arr[size*i + k];
                arr[size*i + k] = arr[size*rev + k];
                arr[size*rev + k] = tmp;
            }
        }
    }
}

function fft(arr, isInverse=false) {
    let size = 4;
    bitReverse2(arr, size);
    let n = arr.length/size;
    sign = (isInverse)? -1.0: 1.0;
    for (let blockSize = 2; blockSize <= n; blockSize *= 2) {
        for (let j = 0; j < n; j += blockSize) {
            for (let i = 0; i < blockSize/2; i++) {
                let cosVal = Math.cos(2.0*Math.PI*i/blockSize);
                let sinVal = sign*Math.sin(2.0*Math.PI*i/blockSize);
                let reEven = arr[(j + i)*size];
                let imEven = arr[(j + i)*size + 1];
                let reOdd = arr[(j + i + blockSize/2)*size];
                let imOdd = arr[(j + i + blockSize/2)*size + 1];
                let reExp = cosVal*reOdd - imOdd*sinVal;
                let imExp = cosVal*imOdd + sinVal*reOdd;
                let nVal = (isInverse && blockSize === n)? n: 1.0;
                arr[(j + i)*size] = (reEven + reExp)/nVal;
                arr[(j + i)*size + 1] = (imEven + imExp)/nVal;
                arr[(j + i + blockSize/2)*size] = (reEven - reExp)/nVal;
                arr[(j + i + blockSize/2)*size + 1] = (imEven - imExp)/nVal;
            }
        }
    }
}


function onmessage(e) {
    let arr = e.data[0];
    let offset = e.data[1];
    let isInverse = e.data[2];
    fft(arr, isInverse);
    postMessage([arr, offset]);
}
