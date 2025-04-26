/**
 * Chinese Remainder Theorem solver
 */
class ChineseRemainderTheorem {
    /**
     * Compute the greatest common divisor of two integers
     */
    static gcd(a, b) {
        if (b === 0) return a;
        return this.gcd(b, a % b);
    }
    
    /**
     * Compute the least common multiple of two integers
     */
    static lcm(a, b) {
        return (a * b) / this.gcd(a, b);
    }
    
    /**
     * Find the modular multiplicative inverse of 'a' modulo 'm'
     * using the Extended Euclidean Algorithm
     */
    static modInverse(a, m) {
        // Ensure a is positive
        a = ((a % m) + m) % m;
        
        for (let x = 1; x < m; x++) {
            if ((a * x) % m === 1) {
                return x;
            }
        }
        return 1;
    }
    
    /**
     * Check if the system has a solution
     * (moduli must be pairwise coprime)
     */
    static checkCompatibility(moduli) {
        for (let i = 0; i < moduli.length; i++) {
            for (let j = i + 1; j < moduli.length; j++) {
                if (this.gcd(moduli[i], moduli[j]) !== 1) {
                    return {
                        compatible: false,
                        conflictPair: [moduli[i], moduli[j]]
                    };
                }
            }
        }
        return { compatible: true };
    }
    
    /**
     * Solve the system of congruences using the Chinese Remainder Theorem
     */
    static solve(remainders, moduli) {
        // Validate inputs
        if (remainders.length !== moduli.length) {
            throw new Error("The number of remainders must equal the number of moduli");
        }
        
        if (remainders.length === 0) {
            throw new Error("At least one congruence is required");
        }
        
        // Check if moduli are pairwise coprime
        const compatibilityCheck = this.checkCompatibility(moduli);
        if (!compatibilityCheck.compatible) {
            throw new Error(`Moduli ${compatibilityCheck.conflictPair[0]} and ${compatibilityCheck.conflictPair[1]} are not coprime`);
        }
        
        // Calculate product of all moduli
        const N = moduli.reduce((acc, val) => acc * val, 1);
        
        // Store intermediate calculation steps
        const steps = [];
        
        let result = 0;
        for (let i = 0; i < remainders.length; i++) {
            // Ensure remainders are within their respective moduli
            remainders[i] = ((remainders[i] % moduli[i]) + moduli[i]) % moduli[i];
            
            // Calculate Ni = N / moduli[i]
            const Ni = N / moduli[i];
            
            // Calculate the modular multiplicative inverse of Ni modulo moduli[i]
            const inverse = this.modInverse(Ni, moduli[i]);
            
            // Add to the result
            const term = remainders[i] * Ni * inverse;
            result += term;
            
            steps.push({
                remainder: remainders[i],
                modulus: moduli[i],
                Ni,
                inverse,
                term
            });
        }
        
        // Return the result modulo N
        result = ((result % N) + N) % N;
        
        return {
            result,
            steps,
            N
        };
    }
}