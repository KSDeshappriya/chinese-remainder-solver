document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('crt-form');
    const addButton = document.getElementById('add-equation');
    const clearButton = document.getElementById('clear-form');
    const equationsContainer = document.getElementById('equations-container');
    const resultSection = document.getElementById('result-section');
    const resultContent = document.getElementById('result-content');
    const stepsContent = document.getElementById('steps-content');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    
    // Add initial equation rows
    addEquationRow();
    addEquationRow();
    
    // Event listeners
    addButton.addEventListener('click', addEquationRow);
    clearButton.addEventListener('click', clearForm);
    form.addEventListener('submit', solveSystem);
    equationsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-equation')) {
            removeEquationRow(e.target);
        }
    });
    
    /**
     * Adds a new equation row to the form
     */
    function addEquationRow() {
        const row = document.createElement('div');
        row.className = 'equation-row mb-3';
        row.innerHTML = `
            <div class="input-group">
                <span class="input-group-text">x ≡</span>
                <input type="number" class="form-control remainder" placeholder="Remainder" required>
                <span class="input-group-text">(mod</span>
                <input type="number" class="form-control modulus" placeholder="Modulus" required min="1">
                <span class="input-group-text">)</span>
                <button type="button" class="btn btn-danger remove-equation">✕</button>
            </div>
        `;
        equationsContainer.appendChild(row);
    }
    
    /**
     * Removes an equation row from the form
     */
    function removeEquationRow(button) {
        const row = button.closest('.equation-row');
        if (document.querySelectorAll('.equation-row').length > 1) {
            row.remove();
        } else {
            showError('You need at least one equation');
        }
    }
    
    /**
     * Clears all form inputs and resets to initial state
     */
    function clearForm() {
        hideResults();
        hideError();
        
        // Remove all equation rows
        while (equationsContainer.firstChild) {
            equationsContainer.removeChild(equationsContainer.firstChild);
        }
        
        // Add two initial rows
        addEquationRow();
        addEquationRow();
    }
    
    /**
     * Solves the system of congruences using CRT
     */
    function solveSystem(e) {
        e.preventDefault();
        hideResults();
        hideError();
        
        const remainderInputs = document.querySelectorAll('.remainder');
        const modulusInputs = document.querySelectorAll('.modulus');
        
        const remainders = [];
        const moduli = [];
        
        // Collect form data
        for (let i = 0; i < remainderInputs.length; i++) {
            const remainder = parseInt(remainderInputs[i].value);
            const modulus = parseInt(modulusInputs[i].value);
            
            if (isNaN(remainder) || isNaN(modulus)) {
                showError('All fields must contain valid numbers');
                return;
            }
            
            if (modulus <= 0) {
                showError('All moduli must be positive integers');
                return;
            }
            
            remainders.push(remainder);
            moduli.push(modulus);
        }
        
        // Solve using Chinese Remainder Theorem
        try {
            const solution = ChineseRemainderTheorem.solve(remainders, moduli);
            displayResults(solution, remainders, moduli);
        } catch (error) {
            showError(error.message);
        }
    }
    
    /**
     * Displays the solution and calculation steps
     */
    function displayResults(solution, remainders, moduli) {
        const { result, steps, N } = solution;
        
        // Display the main result
        resultContent.innerHTML = `
            <h3 class="text-center mb-3">x ≡ <span class="solution-highlight">${result}</span> (mod ${N})</h3>
            <p>This means: x = ${result} + ${N}k for any integer k</p>
            <p>The first few solutions are: ${result}, ${result + N}, ${result + 2*N}, ${result + 3*N}, ...</p>
        `;
        
        // Display calculation steps
        stepsContent.innerHTML = '<h5>Calculation Steps:</h5>';
        
        // Step 1: Show the system of congruences
        let systemHTML = '<div class="steps-item"><strong>Step 1:</strong> System of congruences<ul>';
        for (let i = 0; i < remainders.length; i++) {
            systemHTML += `<li>x ≡ ${remainders[i]} (mod ${moduli[i]})</li>`;
        }
        systemHTML += '</ul></div>';
        
        // Step 2: Calculate N (product of all moduli)
        const stepNHTML = `
            <div class="steps-item">
                <strong>Step 2:</strong> Calculate N = product of all moduli<br>
                N = ${moduli.join(' × ')} = ${N}
            </div>
        `;
        
        // Step 3: Calculate each term and sum
        let termsHTML = '<div class="steps-item"><strong>Step 3:</strong> Calculate each term and sum<ul>';
        let sumExpression = [];
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            termsHTML += `
                <li>
                    For x ≡ ${remainders[i]} (mod ${moduli[i]}):<br>
                    N<sub>i</sub> = N / ${moduli[i]} = ${N} / ${moduli[i]} = ${step.Ni}<br>
                    Find inverse of ${step.Ni} modulo ${moduli[i]}: ${step.inverse}<br>
                    Term = ${remainders[i]} × ${step.Ni} × ${step.inverse} = ${step.term}
                </li>
            `;
            sumExpression.push(step.term);
        }
        
        termsHTML += '</ul></div>';
        
        // Step 4: Final calculation
        const stepFinalHTML = `
            <div class="steps-item">
                <strong>Step 4:</strong> Calculate final result<br>
                x ≡ (${sumExpression.join(' + ')}) mod ${N} ≡ ${result} (mod ${N})
            </div>
        `;
        
        stepsContent.innerHTML += systemHTML + stepNHTML + termsHTML + stepFinalHTML;
        
        // Show the result section
        resultSection.classList.remove('d-none');
        resultSection.classList.add('show');
    }
    
    /**
     * Shows an error message
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorSection.classList.remove('d-none');
        errorSection.classList.add('show');
    }
    
    /**
     * Hides the error message section
     */
    function hideError() {
        errorSection.classList.add('d-none');
        errorSection.classList.remove('show');
    }
    
    /**
     * Hides the results section
     */
    function hideResults() {
        resultSection.classList.add('d-none');
        resultSection.classList.remove('show');
    }
});