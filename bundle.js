(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"cuint":3}],2:[function(require,module,exports){
window.CDKeyGen = require('./cd-keygen');

},{"./cd-keygen":1}],3:[function(require,module,exports){
exports.UINT32 = require('./lib/uint32')
exports.UINT64 = require('./lib/uint64')
},{"./lib/uint32":4,"./lib/uint64":5}],4:[function(require,module,exports){
/**
	C-like unsigned 32 bits integers in Javascript
	Copyright (C) 2013, Pierre Curto
	MIT license
 */
;(function (root) {

	// Local cache for typical radices
	var radixPowerCache = {
		36: UINT32( Math.pow(36, 5) )
	,	16: UINT32( Math.pow(16, 7) )
	,	10: UINT32( Math.pow(10, 9) )
	,	2:  UINT32( Math.pow(2, 30) )
	}
	var radixCache = {
		36: UINT32(36)
	,	16: UINT32(16)
	,	10: UINT32(10)
	,	2:  UINT32(2)
	}

	/**
	 *	Represents an unsigned 32 bits integer
	 * @constructor
	 * @param {Number|String|Number} low bits     | integer as a string 		 | integer as a number
	 * @param {Number|Number|Undefined} high bits | radix (optional, default=10)
	 * @return 
	 */
	function UINT32 (l, h) {
		if ( !(this instanceof UINT32) )
			return new UINT32(l, h)

		this._low = 0
		this._high = 0
		this.remainder = null
		if (typeof h == 'undefined')
			return fromNumber.call(this, l)

		if (typeof l == 'string')
			return fromString.call(this, l, h)

		fromBits.call(this, l, h)
	}

	/**
	 * Set the current _UINT32_ object with its low and high bits
	 * @method fromBits
	 * @param {Number} low bits
	 * @param {Number} high bits
	 * @return ThisExpression
	 */
	function fromBits (l, h) {
		this._low = l | 0
		this._high = h | 0

		return this
	}
	UINT32.prototype.fromBits = fromBits

	/**
	 * Set the current _UINT32_ object from a number
	 * @method fromNumber
	 * @param {Number} number
	 * @return ThisExpression
	 */
	function fromNumber (value) {
		this._low = value & 0xFFFF
		this._high = value >>> 16

		return this
	}
	UINT32.prototype.fromNumber = fromNumber

	/**
	 * Set the current _UINT32_ object from a string
	 * @method fromString
	 * @param {String} integer as a string
	 * @param {Number} radix (optional, default=10)
	 * @return ThisExpression
	 */
	function fromString (s, radix) {
		var value = parseInt(s, radix || 10)

		this._low = value & 0xFFFF
		this._high = value >>> 16

		return this
	}
	UINT32.prototype.fromString = fromString

	/**
	 * Convert this _UINT32_ to a number
	 * @method toNumber
	 * @return {Number} the converted UINT32
	 */
	UINT32.prototype.toNumber = function () {
		return (this._high * 65536) + this._low
	}

	/**
	 * Convert this _UINT32_ to a string
	 * @method toString
	 * @param {Number} radix (optional, default=10)
	 * @return {String} the converted UINT32
	 */
	UINT32.prototype.toString = function (radix) {
		return this.toNumber().toString(radix || 10)
	}

	/**
	 * Add two _UINT32_. The current _UINT32_ stores the result
	 * @method add
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.add = function (other) {
		var a00 = this._low + other._low
		var a16 = a00 >>> 16

		a16 += this._high + other._high

		this._low = a00 & 0xFFFF
		this._high = a16 & 0xFFFF

		return this
	}

	/**
	 * Subtract two _UINT32_. The current _UINT32_ stores the result
	 * @method subtract
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.subtract = function (other) {
		//TODO inline
		return this.add( other.clone().negate() )
	}

	/**
	 * Multiply two _UINT32_. The current _UINT32_ stores the result
	 * @method multiply
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.multiply = function (other) {
		/*
			a = a00 + a16
			b = b00 + b16
			a*b = (a00 + a16)(b00 + b16)
				= a00b00 + a00b16 + a16b00 + a16b16

			a16b16 overflows the 32bits
		 */
		var a16 = this._high
		var a00 = this._low
		var b16 = other._high
		var b00 = other._low

/* Removed to increase speed under normal circumstances (i.e. not multiplying by 0 or 1)
		// this == 0 or other == 1: nothing to do
		if ((a00 == 0 && a16 == 0) || (b00 == 1 && b16 == 0)) return this

		// other == 0 or this == 1: this = other
		if ((b00 == 0 && b16 == 0) || (a00 == 1 && a16 == 0)) {
			this._low = other._low
			this._high = other._high
			return this
		}
*/

		var c16, c00
		c00 = a00 * b00
		c16 = c00 >>> 16

		c16 += a16 * b00
		c16 &= 0xFFFF		// Not required but improves performance
		c16 += a00 * b16

		this._low = c00 & 0xFFFF
		this._high = c16 & 0xFFFF

		return this
	}

	/**
	 * Divide two _UINT32_. The current _UINT32_ stores the result.
	 * The remainder is made available as the _remainder_ property on
	 * the _UINT32_ object. It can be null, meaning there are no remainder.
	 * @method div
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.div = function (other) {
		if ( (other._low == 0) && (other._high == 0) ) throw Error('division by zero')

		// other == 1
		if (other._high == 0 && other._low == 1) {
			this.remainder = new UINT32(0)
			return this
		}

		// other > this: 0
		if ( other.gt(this) ) {
			this.remainder = this.clone()
			this._low = 0
			this._high = 0
			return this
		}
		// other == this: 1
		if ( this.eq(other) ) {
			this.remainder = new UINT32(0)
			this._low = 1
			this._high = 0
			return this
		}

		// Shift the divisor left until it is higher than the dividend
		var _other = other.clone()
		var i = -1
		while ( !this.lt(_other) ) {
			// High bit can overflow the default 16bits
			// Its ok since we right shift after this loop
			// The overflown bit must be kept though
			_other.shiftLeft(1, true)
			i++
		}

		// Set the remainder
		this.remainder = this.clone()
		// Initialize the current result to 0
		this._low = 0
		this._high = 0
		for (; i >= 0; i--) {
			_other.shiftRight(1)
			// If shifted divisor is smaller than the dividend
			// then subtract it from the dividend
			if ( !this.remainder.lt(_other) ) {
				this.remainder.subtract(_other)
				// Update the current result
				if (i >= 16) {
					this._high |= 1 << (i - 16)
				} else {
					this._low |= 1 << i
				}
			}
		}

		return this
	}

	/**
	 * Negate the current _UINT32_
	 * @method negate
	 * @return ThisExpression
	 */
	UINT32.prototype.negate = function () {
		var v = ( ~this._low & 0xFFFF ) + 1
		this._low = v & 0xFFFF
		this._high = (~this._high + (v >>> 16)) & 0xFFFF

		return this
	}

	/**
	 * Equals
	 * @method eq
	 * @param {Object} other UINT32
	 * @return {Boolean}
	 */
	UINT32.prototype.equals = UINT32.prototype.eq = function (other) {
		return (this._low == other._low) && (this._high == other._high)
	}

	/**
	 * Greater than (strict)
	 * @method gt
	 * @param {Object} other UINT32
	 * @return {Boolean}
	 */
	UINT32.prototype.greaterThan = UINT32.prototype.gt = function (other) {
		if (this._high > other._high) return true
		if (this._high < other._high) return false
		return this._low > other._low
	}

	/**
	 * Less than (strict)
	 * @method lt
	 * @param {Object} other UINT32
	 * @return {Boolean}
	 */
	UINT32.prototype.lessThan = UINT32.prototype.lt = function (other) {
		if (this._high < other._high) return true
		if (this._high > other._high) return false
		return this._low < other._low
	}

	/**
	 * Bitwise OR
	 * @method or
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.or = function (other) {
		this._low |= other._low
		this._high |= other._high

		return this
	}

	/**
	 * Bitwise AND
	 * @method and
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.and = function (other) {
		this._low &= other._low
		this._high &= other._high

		return this
	}

	/**
	 * Bitwise NOT
	 * @method not
	 * @return ThisExpression
	 */
	UINT32.prototype.not = function() {
		this._low = ~this._low & 0xFFFF
		this._high = ~this._high & 0xFFFF

		return this
	}

	/**
	 * Bitwise XOR
	 * @method xor
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.xor = function (other) {
		this._low ^= other._low
		this._high ^= other._high

		return this
	}

	/**
	 * Bitwise shift right
	 * @method shiftRight
	 * @param {Number} number of bits to shift
	 * @return ThisExpression
	 */
	UINT32.prototype.shiftRight = UINT32.prototype.shiftr = function (n) {
		if (n > 16) {
			this._low = this._high >> (n - 16)
			this._high = 0
		} else if (n == 16) {
			this._low = this._high
			this._high = 0
		} else {
			this._low = (this._low >> n) | ( (this._high << (16-n)) & 0xFFFF )
			this._high >>= n
		}

		return this
	}

	/**
	 * Bitwise shift left
	 * @method shiftLeft
	 * @param {Number} number of bits to shift
	 * @param {Boolean} allow overflow
	 * @return ThisExpression
	 */
	UINT32.prototype.shiftLeft = UINT32.prototype.shiftl = function (n, allowOverflow) {
		if (n > 16) {
			this._high = this._low << (n - 16)
			this._low = 0
			if (!allowOverflow) {
				this._high &= 0xFFFF
			}
		} else if (n == 16) {
			this._high = this._low
			this._low = 0
		} else {
			this._high = (this._high << n) | (this._low >> (16-n))
			this._low = (this._low << n) & 0xFFFF
			if (!allowOverflow) {
				// Overflow only allowed on the high bits...
				this._high &= 0xFFFF
			}
		}

		return this
	}

	/**
	 * Bitwise rotate left
	 * @method rotl
	 * @param {Number} number of bits to rotate
	 * @return ThisExpression
	 */
	UINT32.prototype.rotateLeft = UINT32.prototype.rotl = function (n) {
		var v = (this._high << 16) | this._low
		v = (v << n) | (v >>> (32 - n))
		this._low = v & 0xFFFF
		this._high = v >>> 16

		return this
	}

	/**
	 * Bitwise rotate right
	 * @method rotr
	 * @param {Number} number of bits to rotate
	 * @return ThisExpression
	 */
	UINT32.prototype.rotateRight = UINT32.prototype.rotr = function (n) {
		var v = (this._high << 16) | this._low
		v = (v >>> n) | (v << (32 - n))
		this._low = v & 0xFFFF
		this._high = v >>> 16

		return this
	}

	/**
	 * Clone the current _UINT32_
	 * @method clone
	 * @return {Object} cloned UINT32
	 */
	UINT32.prototype.clone = function () {
		return new UINT32(this._low, this._high)
	}

	if (typeof define != 'undefined' && define.amd) {
		// AMD / RequireJS
		define([], function () {
			return UINT32
		})
	} else if (typeof module != 'undefined' && module.exports) {
		// Node.js
		module.exports = UINT32
	} else {
		// Browser
		root['UINT32'] = UINT32
	}

})(this)

},{}],5:[function(require,module,exports){
/**
	C-like unsigned 64 bits integers in Javascript
	Copyright (C) 2013, Pierre Curto
	MIT license
 */
;(function (root) {

	// Local cache for typical radices
	var radixPowerCache = {
		16: UINT64( Math.pow(16, 5) )
	,	10: UINT64( Math.pow(10, 5) )
	,	2:  UINT64( Math.pow(2, 5) )
	}
	var radixCache = {
		16: UINT64(16)
	,	10: UINT64(10)
	,	2:  UINT64(2)
	}

	/**
	 *	Represents an unsigned 64 bits integer
	 * @constructor
	 * @param {Number} first low bits (8)
	 * @param {Number} second low bits (8)
	 * @param {Number} first high bits (8)
	 * @param {Number} second high bits (8)
	 * or
	 * @param {Number} low bits (32)
	 * @param {Number} high bits (32)
	 * or
	 * @param {String|Number} integer as a string 		 | integer as a number
	 * @param {Number|Undefined} radix (optional, default=10)
	 * @return 
	 */
	function UINT64 (a00, a16, a32, a48) {
		if ( !(this instanceof UINT64) )
			return new UINT64(a00, a16, a32, a48)

		this.remainder = null
		if (typeof a00 == 'string')
			return fromString.call(this, a00, a16)

		if (typeof a16 == 'undefined')
			return fromNumber.call(this, a00)

		fromBits.apply(this, arguments)
	}

	/**
	 * Set the current _UINT64_ object with its low and high bits
	 * @method fromBits
	 * @param {Number} first low bits (8)
	 * @param {Number} second low bits (8)
	 * @param {Number} first high bits (8)
	 * @param {Number} second high bits (8)
	 * or
	 * @param {Number} low bits (32)
	 * @param {Number} high bits (32)
	 * @return ThisExpression
	 */
	function fromBits (a00, a16, a32, a48) {
		if (typeof a32 == 'undefined') {
			this._a00 = a00 & 0xFFFF
			this._a16 = a00 >>> 16
			this._a32 = a16 & 0xFFFF
			this._a48 = a16 >>> 16
			return this
		}

		this._a00 = a00 | 0
		this._a16 = a16 | 0
		this._a32 = a32 | 0
		this._a48 = a48 | 0

		return this
	}
	UINT64.prototype.fromBits = fromBits

	/**
	 * Set the current _UINT64_ object from a number
	 * @method fromNumber
	 * @param {Number} number
	 * @return ThisExpression
	 */
	function fromNumber (value) {
		this._a00 = value & 0xFFFF
		this._a16 = value >>> 16
		this._a32 = 0
		this._a48 = 0

		return this
	}
	UINT64.prototype.fromNumber = fromNumber

	/**
	 * Set the current _UINT64_ object from a string
	 * @method fromString
	 * @param {String} integer as a string
	 * @param {Number} radix (optional, default=10)
	 * @return ThisExpression
	 */
	function fromString (s, radix) {
		radix = radix || 10

		this._a00 = 0
		this._a16 = 0
		this._a32 = 0
		this._a48 = 0

		/*
			In Javascript, bitwise operators only operate on the first 32 bits 
			of a number, even though parseInt() encodes numbers with a 53 bits 
			mantissa.
			Therefore UINT64(<Number>) can only work on 32 bits.
			The radix maximum value is 36 (as per ECMA specs) (26 letters + 10 digits)
			maximum input value is m = 32bits as 1 = 2^32 - 1
			So the maximum substring length n is:
			36^(n+1) - 1 = 2^32 - 1
			36^(n+1) = 2^32
			(n+1)ln(36) = 32ln(2)
			n = 32ln(2)/ln(36) - 1
			n = 5.189644915687692
			n = 5
		 */
		var radixUint = radixPowerCache[radix] || new UINT64( Math.pow(radix, 5) )

		for (var i = 0, len = s.length; i < len; i += 5) {
			var size = Math.min(5, len - i)
			var value = parseInt( s.slice(i, i + size), radix )
			this.multiply(
					size < 5
						? new UINT64( Math.pow(radix, size) )
						: radixUint
				)
				.add( new UINT64(value) )
		}

		return this
	}
	UINT64.prototype.fromString = fromString

	/**
	 * Convert this _UINT64_ to a number (last 32 bits are dropped)
	 * @method toNumber
	 * @return {Number} the converted UINT64
	 */
	UINT64.prototype.toNumber = function () {
		return (this._a16 * 65536) + this._a00
	}

	/**
	 * Convert this _UINT64_ to a string
	 * @method toString
	 * @param {Number} radix (optional, default=10)
	 * @return {String} the converted UINT64
	 */
	UINT64.prototype.toString = function (radix) {
		radix = radix || 10
		var radixUint = radixCache[radix] || new UINT64(radix)

		if ( !this.gt(radixUint) ) return this.toNumber().toString(radix)

		var self = this.clone()
		var res = new Array(64)
		for (var i = 63; i >= 0; i--) {
			self.div(radixUint)
			res[i] = self.remainder.toNumber().toString(radix)
			if ( !self.gt(radixUint) ) break
		}
		res[i-1] = self.toNumber().toString(radix)

		return res.join('')
	}

	/**
	 * Add two _UINT64_. The current _UINT64_ stores the result
	 * @method add
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.add = function (other) {
		var a00 = this._a00 + other._a00

		var a16 = a00 >>> 16
		a16 += this._a16 + other._a16

		var a32 = a16 >>> 16
		a32 += this._a32 + other._a32

		var a48 = a32 >>> 16
		a48 += this._a48 + other._a48

		this._a00 = a00 & 0xFFFF
		this._a16 = a16 & 0xFFFF
		this._a32 = a32 & 0xFFFF
		this._a48 = a48 & 0xFFFF

		return this
	}

	/**
	 * Subtract two _UINT64_. The current _UINT64_ stores the result
	 * @method subtract
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.subtract = function (other) {
		return this.add( other.clone().negate() )
	}

	/**
	 * Multiply two _UINT64_. The current _UINT64_ stores the result
	 * @method multiply
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.multiply = function (other) {
		/*
			a = a00 + a16 + a32 + a48
			b = b00 + b16 + b32 + b48
			a*b = (a00 + a16 + a32 + a48)(b00 + b16 + b32 + b48)
				= a00b00 + a00b16 + a00b32 + a00b48
				+ a16b00 + a16b16 + a16b32 + a16b48
				+ a32b00 + a32b16 + a32b32 + a32b48
				+ a48b00 + a48b16 + a48b32 + a48b48

			a16b48, a32b32, a48b16, a48b32 and a48b48 overflow the 64 bits
			so it comes down to:
			a*b	= a00b00 + a00b16 + a00b32 + a00b48
				+ a16b00 + a16b16 + a16b32
				+ a32b00 + a32b16
				+ a48b00
				= a00b00
				+ a00b16 + a16b00
				+ a00b32 + a16b16 + a32b00
				+ a00b48 + a16b32 + a32b16 + a48b00
		 */
		var a00 = this._a00
		var a16 = this._a16
		var a32 = this._a32
		var a48 = this._a48
		var b00 = other._a00
		var b16 = other._a16
		var b32 = other._a32
		var b48 = other._a48

		var c00 = a00 * b00

		var c16 = c00 >>> 16
		c16 += a00 * b16
		var c32 = c16 >>> 16
		c16 &= 0xFFFF
		c16 += a16 * b00

		c32 += c16 >>> 16
		c32 += a00 * b32
		var c48 = c32 >>> 16
		c32 &= 0xFFFF
		c32 += a16 * b16
		c48 += c32 >>> 16
		c32 &= 0xFFFF
		c32 += a32 * b00

		c48 += c32 >>> 16
		c48 += a00 * b48
		c48 &= 0xFFFF
		c48 += a16 * b32
		c48 &= 0xFFFF
		c48 += a32 * b16
		c48 &= 0xFFFF
		c48 += a48 * b00

		this._a00 = c00 & 0xFFFF
		this._a16 = c16 & 0xFFFF
		this._a32 = c32 & 0xFFFF
		this._a48 = c48 & 0xFFFF

		return this
	}

	/**
	 * Divide two _UINT64_. The current _UINT64_ stores the result.
	 * The remainder is made available as the _remainder_ property on
	 * the _UINT64_ object. It can be null, meaning there are no remainder.
	 * @method div
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.div = function (other) {
		if ( (other._a16 == 0) && (other._a32 == 0) && (other._a48 == 0) ) {
			if (other._a00 == 0) throw Error('division by zero')

			// other == 1: this
			if (other._a00 == 1) {
				this.remainder = new UINT64(0)
				return this
			}
		}

		// other > this: 0
		if ( other.gt(this) ) {
			this.remainder = this.clone()
			this._a00 = 0
			this._a16 = 0
			this._a32 = 0
			this._a48 = 0
			return this
		}
		// other == this: 1
		if ( this.eq(other) ) {
			this.remainder = new UINT64(0)
			this._a00 = 1
			this._a16 = 0
			this._a32 = 0
			this._a48 = 0
			return this
		}

		// Shift the divisor left until it is higher than the dividend
		var _other = other.clone()
		var i = -1
		while ( !this.lt(_other) ) {
			// High bit can overflow the default 16bits
			// Its ok since we right shift after this loop
			// The overflown bit must be kept though
			_other.shiftLeft(1, true)
			i++
		}

		// Set the remainder
		this.remainder = this.clone()
		// Initialize the current result to 0
		this._a00 = 0
		this._a16 = 0
		this._a32 = 0
		this._a48 = 0
		for (; i >= 0; i--) {
			_other.shiftRight(1)
			// If shifted divisor is smaller than the dividend
			// then subtract it from the dividend
			if ( !this.remainder.lt(_other) ) {
				this.remainder.subtract(_other)
				// Update the current result
				if (i >= 48) {
					this._a48 |= 1 << (i - 48)
				} else if (i >= 32) {
					this._a32 |= 1 << (i - 32)
				} else if (i >= 16) {
					this._a16 |= 1 << (i - 16)
				} else {
					this._a00 |= 1 << i
				}
			}
		}

		return this
	}

	/**
	 * Negate the current _UINT64_
	 * @method negate
	 * @return ThisExpression
	 */
	UINT64.prototype.negate = function () {
		var v = ( ~this._a00 & 0xFFFF ) + 1
		this._a00 = v & 0xFFFF
		v = (~this._a16 & 0xFFFF) + (v >>> 16)
		this._a16 = v & 0xFFFF
		v = (~this._a32 & 0xFFFF) + (v >>> 16)
		this._a32 = v & 0xFFFF
		this._a48 = (~this._a48 + (v >>> 16)) & 0xFFFF

		return this
	}

	/**

	 * @method eq
	 * @param {Object} other UINT64
	 * @return {Boolean}
	 */
	UINT64.prototype.equals = UINT64.prototype.eq = function (other) {
		return (this._a48 == other._a48) && (this._a00 == other._a00)
			 && (this._a32 == other._a32) && (this._a16 == other._a16)
	}

	/**
	 * Greater than (strict)
	 * @method gt
	 * @param {Object} other UINT64
	 * @return {Boolean}
	 */
	UINT64.prototype.greaterThan = UINT64.prototype.gt = function (other) {
		if (this._a48 > other._a48) return true
		if (this._a48 < other._a48) return false
		if (this._a32 > other._a32) return true
		if (this._a32 < other._a32) return false
		if (this._a16 > other._a16) return true
		if (this._a16 < other._a16) return false
		return this._a00 > other._a00
	}

	/**
	 * Less than (strict)
	 * @method lt
	 * @param {Object} other UINT64
	 * @return {Boolean}
	 */
	UINT64.prototype.lessThan = UINT64.prototype.lt = function (other) {
		if (this._a48 < other._a48) return true
		if (this._a48 > other._a48) return false
		if (this._a32 < other._a32) return true
		if (this._a32 > other._a32) return false
		if (this._a16 < other._a16) return true
		if (this._a16 > other._a16) return false
		return this._a00 < other._a00
	}

	/**
	 * Bitwise OR
	 * @method or
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.or = function (other) {
		this._a00 |= other._a00
		this._a16 |= other._a16
		this._a32 |= other._a32
		this._a48 |= other._a48

		return this
	}

	/**
	 * Bitwise AND
	 * @method and
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.and = function (other) {
		this._a00 &= other._a00
		this._a16 &= other._a16
		this._a32 &= other._a32
		this._a48 &= other._a48

		return this
	}

	/**
	 * Bitwise XOR
	 * @method xor
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.xor = function (other) {
		this._a00 ^= other._a00
		this._a16 ^= other._a16
		this._a32 ^= other._a32
		this._a48 ^= other._a48

		return this
	}

	/**
	 * Bitwise NOT
	 * @method not
	 * @return ThisExpression
	 */
	UINT64.prototype.not = function() {
		this._a00 = ~this._a00 & 0xFFFF
		this._a16 = ~this._a16 & 0xFFFF
		this._a32 = ~this._a32 & 0xFFFF
		this._a48 = ~this._a48 & 0xFFFF

		return this
	}

	/**
	 * Bitwise shift right
	 * @method shiftRight
	 * @param {Number} number of bits to shift
	 * @return ThisExpression
	 */
	UINT64.prototype.shiftRight = UINT64.prototype.shiftr = function (n) {
		n %= 64
		if (n >= 48) {
			this._a00 = this._a48 >> (n - 48)
			this._a16 = 0
			this._a32 = 0
			this._a48 = 0
		} else if (n >= 32) {
			n -= 32
			this._a00 = ( (this._a32 >> n) | (this._a48 << (16-n)) ) & 0xFFFF
			this._a16 = (this._a48 >> n) & 0xFFFF
			this._a32 = 0
			this._a48 = 0
		} else if (n >= 16) {
			n -= 16
			this._a00 = ( (this._a16 >> n) | (this._a32 << (16-n)) ) & 0xFFFF
			this._a16 = ( (this._a32 >> n) | (this._a48 << (16-n)) ) & 0xFFFF
			this._a32 = (this._a48 >> n) & 0xFFFF
			this._a48 = 0
		} else {
			this._a00 = ( (this._a00 >> n) | (this._a16 << (16-n)) ) & 0xFFFF
			this._a16 = ( (this._a16 >> n) | (this._a32 << (16-n)) ) & 0xFFFF
			this._a32 = ( (this._a32 >> n) | (this._a48 << (16-n)) ) & 0xFFFF
			this._a48 = (this._a48 >> n) & 0xFFFF
		}

		return this
	}

	/**
	 * Bitwise shift left
	 * @method shiftLeft
	 * @param {Number} number of bits to shift
	 * @param {Boolean} allow overflow
	 * @return ThisExpression
	 */
	UINT64.prototype.shiftLeft = UINT64.prototype.shiftl = function (n, allowOverflow) {
		n %= 64
		if (n >= 48) {
			this._a48 = this._a00 << (n - 48)
			this._a32 = 0
			this._a16 = 0
			this._a00 = 0
		} else if (n >= 32) {
			n -= 32
			this._a48 = (this._a16 << n) | (this._a00 >> (16-n))
			this._a32 = (this._a00 << n) & 0xFFFF
			this._a16 = 0
			this._a00 = 0
		} else if (n >= 16) {
			n -= 16
			this._a48 = (this._a32 << n) | (this._a16 >> (16-n))
			this._a32 = ( (this._a16 << n) | (this._a00 >> (16-n)) ) & 0xFFFF
			this._a16 = (this._a00 << n) & 0xFFFF
			this._a00 = 0
		} else {
			this._a48 = (this._a48 << n) | (this._a32 >> (16-n))
			this._a32 = ( (this._a32 << n) | (this._a16 >> (16-n)) ) & 0xFFFF
			this._a16 = ( (this._a16 << n) | (this._a00 >> (16-n)) ) & 0xFFFF
			this._a00 = (this._a00 << n) & 0xFFFF
		}
		if (!allowOverflow) {
			this._a48 &= 0xFFFF
		}

		return this
	}

	/**
	 * Bitwise rotate left
	 * @method rotl
	 * @param {Number} number of bits to rotate
	 * @return ThisExpression
	 */
	UINT64.prototype.rotateLeft = UINT64.prototype.rotl = function (n) {
		n %= 64
		if (n == 0) return this
		if (n >= 32) {
			// A.B.C.D
			// B.C.D.A rotl(16)
			// C.D.A.B rotl(32)
			var v = this._a00
			this._a00 = this._a32
			this._a32 = v
			v = this._a48
			this._a48 = this._a16
			this._a16 = v
			if (n == 32) return this
			n -= 32
		}

		var high = (this._a48 << 16) | this._a32
		var low = (this._a16 << 16) | this._a00

		var _high = (high << n) | (low >>> (32 - n))
		var _low = (low << n) | (high >>> (32 - n))

		this._a00 = _low & 0xFFFF
		this._a16 = _low >>> 16
		this._a32 = _high & 0xFFFF
		this._a48 = _high >>> 16

		return this
	}

	/**
	 * Bitwise rotate right
	 * @method rotr
	 * @param {Number} number of bits to rotate
	 * @return ThisExpression
	 */
	UINT64.prototype.rotateRight = UINT64.prototype.rotr = function (n) {
		n %= 64
		if (n == 0) return this
		if (n >= 32) {
			// A.B.C.D
			// D.A.B.C rotr(16)
			// C.D.A.B rotr(32)
			var v = this._a00
			this._a00 = this._a32
			this._a32 = v
			v = this._a48
			this._a48 = this._a16
			this._a16 = v
			if (n == 32) return this
			n -= 32
		}

		var high = (this._a48 << 16) | this._a32
		var low = (this._a16 << 16) | this._a00

		var _high = (high >>> n) | (low << (32 - n))
		var _low = (low >>> n) | (high << (32 - n))

		this._a00 = _low & 0xFFFF
		this._a16 = _low >>> 16
		this._a32 = _high & 0xFFFF
		this._a48 = _high >>> 16

		return this
	}

	/**
	 * Clone the current _UINT64_
	 * @method clone
	 * @return {Object} cloned UINT64
	 */
	UINT64.prototype.clone = function () {
		return new UINT64(this._a00, this._a16, this._a32, this._a48)
	}

	if (typeof define != 'undefined' && define.amd) {
		// AMD / RequireJS
		define([], function () {
			return UINT64
		})
	} else if (typeof module != 'undefined' && module.exports) {
		// Node.js
		module.exports = UINT64
	} else {
		// Browser
		root['UINT64'] = UINT64
	}

})(this)

},{}]},{},[2]);
