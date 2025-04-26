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
    
    // Add new DOM elements references
    const loadExampleButton = document.getElementById('load-example') || createLoadExampleButton();
    const copyResultButton = document.getElementById('copy-result') || document.createElement('button');
    const newCalculationButton = document.getElementById('new-calculation') || document.createElement('button');
    const darkModeToggle = document.getElementById('darkModeToggle') || createDarkModeToggle();
    
    // Initialize app with theme preference
    initTheme();
    
    // Add additional event listeners
    if (loadExampleButton) loadExampleButton.addEventListener('click', loadExample);
    if (copyResultButton) copyResultButton.addEventListener('click', copyResultToClipboard);
    if (newCalculationButton) newCalculationButton.addEventListener('click', resetForNewCalculation);
    if (darkModeToggle) darkModeToggle.addEventListener('change', toggleDarkMode);
    
    /**
     * Creates and adds the load example button if it doesn't exist
     */
    function createLoadExampleButton() {
        const button = document.createElement('button');
        button.id = 'load-example';
        button.className = 'btn btn-outline-secondary me-2';
        button.innerHTML = '<i class="bi bi-lightning-fill me-1"></i> Load Example';
        
        // Find a place to insert it (before the clear form button)
        if (clearButton && clearButton.parentNode) {
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex';
            clearButton.parentNode.insertBefore(wrapper, clearButton);
            wrapper.appendChild(button);
            wrapper.appendChild(clearButton);
        }
        
        return button;
    }
    
    /**
     * Creates and adds dark mode toggle if it doesn't exist
     */
    function createDarkModeToggle() {
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.id = 'darkModeToggle';
        toggle.className = 'form-check-input';
        
        const label = document.createElement('label');
        label.htmlFor = 'darkModeToggle';
        label.className = 'form-check-label ms-2';
        label.innerHTML = '<i class="bi bi-moon-fill"></i>';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check form-switch ms-auto me-3 d-flex align-items-center';
        wrapper.appendChild(toggle);
        wrapper.appendChild(label);
        
        // Add to the top of the form
        const formParent = form.parentNode;
        if (formParent) {
            formParent.insertBefore(wrapper, form);
        }
        
        return toggle;
    }
    
    /**
     * Initialize theme based on user preference
     */
    function initTheme() {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            if (darkModeToggle) darkModeToggle.checked = true;
        }
    }
    
    /**
     * Toggle dark/light mode
     */
    function toggleDarkMode() {
        if (darkModeToggle.checked) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }
    
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
            // Add a fade-out animation
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            row.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                row.remove();
                updateEquationNumbers();
            }, 300);
        } else {
            showError('You need at least one equation');
            
            // Add a shake animation to the row
            row.animate(
                [
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(0)' }
                ],
                {
                    duration: 400,
                    easing: 'ease-in-out'
                }
            );
        }
    }
    
    /**
     * Update equation numbers for all rows
     */
    function updateEquationNumbers() {
        const equationRows = document.querySelectorAll('.equation-row');
        equationRows.forEach((row, index) => {
            // Try to find an equation number element, create one if it doesn't exist
            let numberElement = row.querySelector('.equation-number');
            if (!numberElement) {
                numberElement = document.createElement('span');
                numberElement.className = 'equation-number';
                row.insertBefore(numberElement, row.firstChild);
            }
            numberElement.textContent = index + 1;
        });
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
     * Load example problem into the form
     */
    function loadExample() {
        clearForm();
        
        // Example: x ≡ 3 (mod 5), x ≡ 4 (mod 7), x ≡ 1 (mod 9)
        const exampleValues = [
            {remainder: 3, modulus: 5},
            {remainder: 4, modulus: 7},
            {remainder: 1, modulus: 9}
        ];
        
        // Add enough rows
        while (document.querySelectorAll('.equation-row').length < exampleValues.length) {
            addEquationRow();
        }
        
        // Set values
        const remainderInputs = document.querySelectorAll('.remainder');
        const modulusInputs = document.querySelectorAll('.modulus');
        
        for (let i = 0; i < exampleValues.length; i++) {
            remainderInputs[i].value = exampleValues[i].remainder;
            modulusInputs[i].value = exampleValues[i].modulus;
            
            // Highlight with animation
            const row = remainderInputs[i].closest('.equation-row');
            row.style.backgroundColor = 'rgba(58, 134, 255, 0.1)';
            setTimeout(() => {
                row.style.transition = 'background-color 0.5s ease';
                row.style.backgroundColor = '';
            }, 800);
        }
        
        // Create temporary confirmation message
        const confirmationMessage = document.createElement('div');
        confirmationMessage.className = 'alert alert-success mt-3';
        confirmationMessage.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Example loaded! Click "Solve" to see the result.';
        confirmationMessage.style.opacity = '0';
        confirmationMessage.style.transition = 'opacity 0.3s ease';
        
        form.appendChild(confirmationMessage);
        
        setTimeout(() => {
            confirmationMessage.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            confirmationMessage.style.opacity = '0';
            setTimeout(() => confirmationMessage.remove(), 300);
        }, 3000);
    }
    
    /**
     * Copy result to clipboard
     */
    function copyResultToClipboard() {
        if (!resultContent.textContent) return;
        
        // Create a temporary textarea element to copy from
        const textarea = document.createElement('textarea');
        textarea.value = 'Solution to Chinese Remainder Theorem:\n' + 
                        resultContent.textContent.replace(/<[^>]*>/g, '').trim();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        // Provide user feedback
        const originalText = copyResultButton.innerHTML;
        copyResultButton.innerHTML = '<i class="bi bi-check-lg me-1"></i> Copied!';
        copyResultButton.disabled = true;
        
        setTimeout(() => {
            copyResultButton.innerHTML = originalText;
            copyResultButton.disabled = false;
        }, 2000);
    }
    
    /**
     * Reset the form for a new calculation
     */
    function resetForNewCalculation() {
        // Hide results with a fade-out animation
        resultSection.style.opacity = '0';
        
        setTimeout(() => {
            hideResults();
            // Scroll to the form
            form.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }
    
    /**
     * Shows an error message with improved animation
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorSection.classList.remove('d-none');
        
        // Apply a slide-in animation
        errorSection.style.transform = 'translateY(-20px)';
        errorSection.style.opacity = '0';
        
        setTimeout(() => {
            errorSection.style.transition = 'all 0.3s ease';
            errorSection.style.transform = 'translateY(0)';
            errorSection.style.opacity = '1';
        }, 10);
    }
    
    /**
     * Hides the error message section with animation
     */
    function hideError() {
        if (errorSection.classList.contains('d-none')) return;
        
        errorSection.style.opacity = '0';
        setTimeout(() => {
            errorSection.classList.add('d-none');
            errorSection.style.transform = '';
        }, 300);
    }
    
    /**
     * Hides the results section with animation
     */
    function hideResults() {
        if (resultSection.classList.contains('d-none')) return;
        
        resultSection.style.opacity = '0';
        setTimeout(() => {
            resultSection.classList.add('d-none');
            resultSection.classList.remove('show');
        }, 300);
    }
    
    /**
     * Displays the solution and calculation steps with enhanced visuals
     */
    function displayResults(solution, remainders, moduli) {
        const { result, steps, N } = solution;
        
        // Display the main result with more engaging visuals
        resultContent.innerHTML = `
            <div class="text-center mb-4">
                <h3 class="mb-3">Solution</h3>
                <div class="solution-display p-3 mb-3">
                    x ≡ <span class="solution-highlight">${result}</span> (mod ${N})
                </div>
                <div class="solution-explanation">
                    <p>This means: x = ${result} + ${N}k for any integer k</p>
                    <p>The first few solutions are:</p>
                    <div class="solution-list">
                        ${result}, ${result + N}, ${result + 2*N}, ${result + 3*N}, ${result + 4*N}...
                    </div>
                </div>
            </div>
        `;
        
        // Create an improved steps display
        stepsContent.innerHTML = '<h5 class="mb-3"><i class="bi bi-list-ol me-2"></i>Calculation Steps</h5>';
        
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
        
        // Show the result section with animation
        resultSection.classList.remove('d-none');
        setTimeout(() => {
            resultSection.style.opacity = '1';
            resultSection.style.transform = 'translateY(0)';
        }, 10);
        
        // Scroll to result
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
    
    // Call updateEquationNumbers initially to add numbers to existing rows
    updateEquationNumbers();
});