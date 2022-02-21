const { UINT32 } = require('cuint');

const VALID_DIGITS = '26B0KEL1AFD9M38T5NPGZ7XHYV4WJRCS';

const generateKeyDigit = () => VALID_DIGITS[Math.floor(Math.random() * VALID_DIGITS.length)];

const translateKey7toOffsets = pid7 => {
    const offsets7 = new Int32Array(8);
    for (let i = 0; i < 8; i++) {
        if (i !== 4) {
            offsets7[i] = VALID_DIGITS.indexOf(pid7[i]);
        }
    }

    return offsets7;
}

// Need to use UINT32 here since the check digit calculation uses
// unsigned integer overflows (binary wrap around) as part of its algorithm
// https://en.wikipedia.org/wiki/Integer_overflow
function getCheckDigit(key7Offsets) {
    const multiplier = UINT32(0x2f);
    const checkDigit = UINT32(0);
    let index = 0;

    do {
        if (index != 4) {
            checkDigit.add(UINT32(key7Offsets[index] + 0x25).multiply(multiplier))
        }
        multiplier.multiply(multiplier);
        index++;
    } while (index < 8);


    const checkDigitInstances = [
        checkDigit.clone(),
        checkDigit.clone(),
        checkDigit.clone(),
        checkDigit.clone()
    ];

    const digitCharCode = ((checkDigitInstances[0].shiftRight(5).and(UINT32(0x7c00)).xor(checkDigitInstances[1].and(UINT32(0x7c00)))).shiftRight(5).xor(checkDigitInstances[2].and(UINT32(0x3e0)))).shiftRight(5).xor(checkDigitInstances[3].and(UINT32(0x1f)));

    return VALID_DIGITS.substr(digitCharCode, 1);
}

function generate() {
    let key = '';
    do {
        key += generateKeyDigit();
        if (key.length === 4) key += '-';
        if (key.length === 8) key += getCheckDigit(translateKey7toOffsets(key));
    } while (key.length < 9);

    return key;
}

function test() {
    // Each line contains a KNOWN valid CD key, only first 7 digits are used to generate the 8th
    // "check digit". Therefore, when the lines are printed, if the last digit from the generated
    // message matches the last digit from the known CD key then we know that the getCheckDigit() function
    // works as intended.
    `
HG7S-W0TT
ZPAS-T8YN
7PVG-VGNK
XXAC-V8DH
HMLS-WGF6
ZFXX-N8L3
HGNG-9W8R
`
        .split('\n')
        .filter(Boolean)
        .map(a => a.trim())
        .map(a => console.log(a, getCheckDigit(translateKey7toOffsets(a))));
}

function validate(cdKey) {
    if(!cdKey.replace('-','').split('').every(char => VALID_DIGITS.indexOf(char) >= 0)) return false;
    if (cdKey.length !== 9) return false;
    if (cdKey[4] !== '-') return false;

    return getCheckDigit(translateKey7toOffsets(cdKey)) === cdKey[8];
}

module.exports = {
    validate,
    generate,
    test,
};