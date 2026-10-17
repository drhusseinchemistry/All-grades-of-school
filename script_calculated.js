document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const expressionDisplay = document.querySelector('.expression-display');
    const resultDisplay = document.querySelector('.result-display');
    const buttons = document.querySelector('.buttons');
    const allButtons = document.querySelectorAll('.buttons button');
    const indicators = {
        shift: document.getElementById('shift-indicator'),
        alpha: document.getElementById('alpha-indicator'),
        sto: document.getElementById('sto-indicator'),
        rcl: document.getElementById('rcl-indicator'),
    };
    // History Modal Elements
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    const closeHistoryBtn = document.getElementById('close-history-btn');

    // State Variables
    let memory = { M: 0, A: 0, B: 0, C: 0, X: 0, Y: 0 };
    let currentExpression = '';
    let lastAns = '0';
    let calculationHistory = [];
    let cursorPosition = 0;
    let state = {
        shift: false,
        alpha: false,
        storing: false,
        recalling: false,
    };

    function storeOriginalButtonValues() {
        allButtons.forEach(button => {
            button.dataset.originalValue = button.innerHTML;
        });
    }

    function updateButtonLabels() {
        allButtons.forEach(button => {
            const originalValue = button.dataset.originalValue;
            let shiftValue = button.dataset.shiftValue || button.dataset.shiftKey;
            if (state.shift && shiftValue) {
                let displayText = shiftValue.replace(/\($/, '');
                button.innerHTML = displayText;
            } else {
                button.innerHTML = originalValue;
            }
        });
    }

    window.toRadians = deg => deg * (Math.PI / 180);
    window.toDegrees = rad => rad * (180 / Math.PI);
    window.factorial = n => {
        if (n < 0 || n % 1 !== 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    };
    
    window.sin = deg => Math.sin(window.toRadians(deg));
    window.cos = deg => Math.cos(window.toRadians(deg));
    window.tan = deg => Math.tan(window.toRadians(deg));
    window.asin_d = val => window.toDegrees(Math.asin(val));
    window.acos_d = val => window.toDegrees(Math.acos(val));
    window.atan_d = val => window.toDegrees(Math.atan(val));
    window.log10 = val => Math.log10(val);
    window.ln = val => Math.log(val);
    window.cbrt = val => Math.cbrt(val);

    buttons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (!button) return;

        let value = button.dataset.value;
        let key = button.dataset.key;
        
        const originalKey = key; 

        if (state.shift) {
            value = button.dataset.shiftValue || value;
            key = button.dataset.shiftKey || key;
        }

        if (state.storing && "ABCXYM".includes(key)) {
             memory[key] = parseFloat(lastAns) || 0;
             resetState('storing', 'alpha', 'shift');
        } else if (state.recalling && "ABCXYM".includes(key)) {
            insertText(key);
            resetState('recalling', 'alpha', 'shift');
        } else if (value !== undefined) {
            insertText(value);
        } else if (key !== undefined) {
            handleKey(key);
        }
        
        if (state.shift && originalKey !== 'shift') {
            resetState('shift');
            updateButtonLabels();
        }
        if (state.alpha && originalKey !== 'alpha') {
            resetState('alpha');
        }
        
        updateDisplay();
    });

    function insertText(text) {
        currentExpression = `${currentExpression.slice(0, cursorPosition)}${text}${currentExpression.slice(cursorPosition)}`;
        cursorPosition += text.length;
    }

    function handleKey(key) {
        switch (key) {
            case 'ac': case 'on': resetCalculator(); break;
            case 'del':
                if (cursorPosition > 0) {
                    currentExpression = currentExpression.slice(0, cursorPosition - 1) + currentExpression.slice(cursorPosition);
                    cursorPosition--;
                }
                break;
            case '=': calculate(); break;
            case '%': insertText('%'); calculate(); break;
            case 'ans': insertText('Ans'); break;
            case 'shift': 
                state.shift = !state.shift; 
                state.alpha = false; 
                updateButtonLabels();
                break;
            case 'alpha': state.alpha = !state.alpha; state.shift = false; updateButtonLabels(); break;
            case 'left': if (cursorPosition > 0) cursorPosition--; break;
            case 'right': if (cursorPosition < currentExpression.length) cursorPosition++; break;
            case 'sto': state.storing = true; state.shift = false; break;
            case 'rcl': state.recalling = true; state.shift = false; break;
            case 'm-plus': calculate(true); memory.M += parseFloat(lastAns) || 0; break;
            case 'm-minus': calculate(true); memory.M -= parseFloat(lastAns) || 0; break;
            case 'negate': insertText('-'); break;
            case 'off': document.body.innerHTML = ''; break;
            case 'mode': resetCalculator(); break;
            case 'history': showHistory(); break;
            default: if (key && "ABCXYM".includes(key) && state.alpha) insertText(key); break;
        }
    }
    
    function calculate(silent = false) {
        if (currentExpression.trim() === '') return;
        try {
            const exprToCalc = currentExpression;
            const translated = translateExpression(exprToCalc);
            const result = eval(translated);

            if (isNaN(result) || !isFinite(result)) throw new Error("Invalid result");
            
            const formattedResult = parseFloat(result.toPrecision(12)).toString();
            lastAns = formattedResult;

            if (!silent) {
                resultDisplay.textContent = formattedResult;
                calculationHistory.push({ expression: exprToCalc, result: formattedResult });
                currentExpression = '';
                cursorPosition = 0;
            }
        } catch (error) {
            if (!silent) resultDisplay.textContent = 'Error';
            console.error("Calculation Error:", error, "on expression:", currentExpression, "Translated:", translateExpression(currentExpression));
        }
    }
    
    function translateExpression(expr) {
        let translatedExpr = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/Ans/g, `(${lastAns})`)
            .replace(/([A-Y]|M)/g, (match) => `(memory.${match})`);

        translatedExpr = translatedExpr
            .replace(/(\d|\))π/g, '$1*Math.PI')
            .replace(/π/g, 'Math.PI');

        return translatedExpr
            .replace(/³√\(/g, 'window.cbrt(') 
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/(\d+\.?\d*)!/g, 'window.factorial($1)')
            .replace(/log\(/g, 'window.log10(')
            .replace(/ln\(/g, 'window.ln(')
            .replace(/10\^\(/g, '(10**')
            .replace(/e\^\(/g, 'Math.exp(')
            .replace(/sin\(/g, 'window.sin(')
            .replace(/cos\(/g, 'window.cos(')
            .replace(/tan\(/g, 'window.tan(')
            .replace(/sin⁻¹\(/g, 'window.asin_d(')
            .replace(/cos⁻¹\(/g, 'window.acos_d(')
            .replace(/tan⁻¹\(/g, 'window.atan_d(')
            .replace(/E/g, '*10**')
            .replace(/\^/g, '**')
            .replace(/%/g, '/100');
    }

    function resetCalculator() {
        currentExpression = '';
        resultDisplay.textContent = '0';
        cursorPosition = 0;
        resetState('shift', 'alpha', 'storing', 'recalling');
        updateButtonLabels();
    }
    
    function resetState(...keys) {
        keys.forEach(key => {
            if (state.hasOwnProperty(key)) {
                state[key] = false;
            }
        });
    }

    function updateDisplay() {
        expressionDisplay.innerHTML = `${currentExpression.slice(0, cursorPosition)}<span class="cursor"></span>${currentExpression.slice(cursorPosition)}`;
        Object.keys(indicators).forEach(key => {
            const indicatorEl = indicators[key];
            if (indicatorEl) {
                indicatorEl.textContent = state[key] ? key.charAt(0).toUpperCase() : '';
            }
        });
        const cursorEl = expressionDisplay.querySelector('.cursor');
        if (cursorEl) cursorEl.scrollIntoView({ block: 'nearest' });
    }

    function showHistory() {
        historyList.innerHTML = '';
        if (calculationHistory.length === 0) {
            historyList.innerHTML = '<li>No history yet.</li>';
        } else {
            [...calculationHistory].reverse().forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.expression} =</span> <strong>${item.result}</strong>`;
                li.addEventListener('click', () => {
                    currentExpression = item.result;
                    cursorPosition = item.result.length;
                    hideHistory();
                    updateDisplay();
                });
                historyList.appendChild(li);
            });
        }
        historyModal.style.display = 'flex';
    }

    function hideHistory() {
        historyModal.style.display = 'none';
    }

    closeHistoryBtn.addEventListener('click', hideHistory);
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            hideHistory();
        }
    });

    storeOriginalButtonValues();
    resetCalculator();
});
