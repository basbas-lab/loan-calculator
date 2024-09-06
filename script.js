// Language translations
const translations = {
    en: {
        title: "SACCO Loan Calculator",
        loanAmount: "Loan Amount (KES):",
        interestRate: "Interest Rate:",
        loanTerm: "Loan Term:",
        repaymentFrequency: "Repayment Frequency:",
        additionalFees: "Additional Fees (KES):",
        extraPayment: "Extra Payment (KES):",
        calculate: "Calculate",
        reset: "Reset",
        switchLang: "Switch to Swahili",
        loanSummary: "Loan Summary",
        regularPayment: "Regular Payment:",
        totalInterest: "Total Interest:",
        totalRepayment: "Total Amount to Repay:",
        payoffDate: "Loan Payoff Date:",
        amortizationSchedule: "Amortization Schedule",
        paymentNo: "Payment No.",
        paymentDate: "Payment Date",
        paymentAmount: "Payment Amount",
        principal: "Principal",
        interest: "Interest",
        remainingBalance: "Remaining Balance"
    },
    sw: {
        title: "Kihesabu Mkopo wa SACCO",
        loanAmount: "Kiasi cha Mkopo (KES):",
        interestRate: "Riba:",
        loanTerm: "Muda wa Mkopo:",
        repaymentFrequency: "Mara ya Kulipa:",
        additionalFees: "Ada za Ziada (KES):",
        extraPayment: "Malipo ya Ziada (KES):",
        calculate: "Hesabu",
        reset: "Rekebisha",
        switchLang: "Switch to English",
        loanSummary: "Muhtasari wa Mkopo",
        regularPayment: "Malipo ya Kawaida:",
        totalInterest: "Riba Jumla:",
        totalRepayment: "Jumla ya Kurudi:",
        payoffDate: "Tarehe ya Malipo ya Mkopo:",
        amortizationSchedule: "Ratiba ya Malipo",
        paymentNo: "Nambari ya Malipo",
        paymentDate: "Tarehe ya Malipo",
        paymentAmount: "Kiasi cha Malipo",
        principal: "Pincipal",
        interest: "Riba",
        remainingBalance: "Salio Lililobaki"
    }
};

let currentLang = 'en';

// Update language function
const updateLanguage = () => {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
    document.getElementById('langToggle').textContent = translations[currentLang].switchLang;
};

// Toggle language
document.getElementById('langToggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'sw' : 'en';
    updateLanguage();
});

// Validate input values
const validateInputs = () => {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const loanTerm = parseInt(document.getElementById('loanTerm').value);
    
    if (loanAmount <= 0 || isNaN(loanAmount)) return false;
    if (interestRate < 0 || isNaN(interestRate)) return false;
    if (loanTerm <= 0 || isNaN(loanTerm)) return false;

    return true;
};

// Calculate loan function
const calculateLoan = (event) => {
    event.preventDefault();

    if (!validateInputs()) {
        alert(translations[currentLang].invalidInput || 'Invalid input values. Please check and try again.');
        return;
    }

    // Retrieve and parse input values
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    let interestRate = parseFloat(document.getElementById('interestRate').value);
    const interestType = document.getElementById('interestType').value;
    let loanTerm = parseInt(document.getElementById('loanTerm').value);
    const termType = document.getElementById('termType').value;
    const repaymentFrequency = document.getElementById('repaymentFrequency').value;
    const additionalFees = parseFloat(document.getElementById('additionalFees').value) || 0;
    const extraPayment = parseFloat(document.getElementById('extraPayment').value) || 0;
    const extraPaymentFrequency = document.getElementById('extraPaymentFrequency').value;

    // Adjust interest rate based on type
    interestRate = interestType === 'annual' ? interestRate / 12 / 100 : interestRate / 100;

    // Convert loan term to months
    loanTerm = termType === 'years' ? loanTerm * 12 : loanTerm;

    // Calculate payment details based on frequency
    const { numberOfPayments, ratePerPeriod } = getPaymentDetails(repaymentFrequency, interestRate, loanTerm);

    // Calculate regular payment
    const regularPayment = calculateRegularPayment(loanAmount, ratePerPeriod, numberOfPayments);

    // Generate amortization schedule
    const { schedule, payoffDate, totalInterest } = generateAmortizationSchedule(
        loanAmount, regularPayment, ratePerPeriod, numberOfPayments, extraPayment, extraPaymentFrequency, repaymentFrequency
    );

    // Display results
    displayResults(regularPayment, totalInterest, loanAmount, additionalFees, payoffDate);
    
    // Update amortization schedule table
    updateAmortizationTable(schedule);

    document.getElementById('results').classList.remove('hidden');
};

// Calculate regular payment
const calculateRegularPayment = (loanAmount, ratePerPeriod, numberOfPayments) => {
    return (loanAmount * ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfPayments)) /
           (Math.pow(1 + ratePerPeriod, numberOfPayments) - 1);
};

// Calculate payment details based on frequency
const getPaymentDetails = (repaymentFrequency, interestRate, loanTerm) => {
    const frequencyMultiplier = { monthly: 1, biweekly: 2, weekly: 4 };
    const multiplier = frequencyMultiplier[repaymentFrequency] || 1;
    return {
        numberOfPayments: loanTerm * multiplier,
        ratePerPeriod: interestRate / multiplier
    };
};

// Generate amortization schedule
const generateAmortizationSchedule = (loanAmount, regularPayment, ratePerPeriod, numberOfPayments, extraPayment, extraPaymentFrequency, repaymentFrequency) => {
    let remainingBalance = loanAmount;
    let totalInterest = 0;
    const schedule = [];
    let payoffDate = new Date();

    for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = remainingBalance * ratePerPeriod;
        let principalPayment = regularPayment - interestPayment;
        
        // Apply extra payment
        if (extraPaymentFrequency === 'recurring' || (extraPaymentFrequency === 'once' && i === 1)) {
            principalPayment += extraPayment;
        }

        principalPayment = Math.min(principalPayment, remainingBalance);

        remainingBalance -= principalPayment;
        totalInterest += interestPayment;

        schedule.push({
            paymentNumber: i,
            paymentDate: new Date(payoffDate),
            paymentAmount: principalPayment + interestPayment,
            principal: principalPayment,
            interest: interestPayment,
            remainingBalance: remainingBalance
        });

        if (remainingBalance <= 0) break;

        // Update payoff date
        updatePayoffDate(payoffDate, repaymentFrequency);
    }

    return { schedule, payoffDate, totalInterest };
};

// Update payoff date based on repayment frequency
const updatePayoffDate = (date, frequency) => {
    const frequencyDays = { monthly: 30, biweekly: 14, weekly: 7 };
    date.setDate(date.getDate() + frequencyDays[frequency] || 30);
};

// Display results
const displayResults = (regularPayment, totalInterest, loanAmount, additionalFees, payoffDate) => {
    document.getElementById('regularPayment').textContent = formatCurrency(regularPayment);
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('totalRepayment').textContent = formatCurrency(loanAmount + totalInterest + additionalFees);
    document.getElementById('payoffDate').textContent = payoffDate.toLocaleDateString();
};

// Update amortization table
const updateAmortizationTable = (schedule) => {
    const tableBody = document.querySelector('#amortizationSchedule tbody');
    tableBody.innerHTML = schedule.map(payment => `
        <tr>
            <td>${payment.paymentNumber}</td>
            <td>${payment.paymentDate.toLocaleDateString()}</td>
            <td>${formatCurrency(payment.paymentAmount)}</td>
            <td>${formatCurrency(payment.principal)}</td>
            <td>${formatCurrency(payment.interest)}</td>
            <td>${formatCurrency(payment.remainingBalance)}</td>
        </tr>
    `).join('');
};

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loanForm').addEventListener('submit', calculateLoan);
    document.getElementBy
