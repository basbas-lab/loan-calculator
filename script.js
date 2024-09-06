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
        title: "Kikokotoo cha Mkopo wa SACCO",
        loanAmount: "Kiasi cha Mkopo (KES):",
        interestRate: "Kiwango cha Riba:",
        loanTerm: "Muda wa Mkopo:",
        repaymentFrequency: "Mzunguko wa Malipo:",
        additionalFees: "Ada za Ziada (KES):",
        extraPayment: "Malipo ya Ziada (KES):",
        calculate: "Hesabu",
        switchLang: "Badili lugha kwa Kiingereza",
        loanSummary: "Muhtasari wa Mkopo",
        regularPayment: "Malipo ya Kawaida:",
        totalInterest: "Jumla ya Riba:",
        totalRepayment: "Jumla ya Kiasi cha Kulipa:",
        payoffDate: "Tarehe ya Kumalizika kwa Mkopo:",
        amortizationSchedule: "Ratiba ya Malipo",
        paymentNo: "Namba ya Malipo",
        paymentDate: "Tarehe ya Malipo",
        paymentAmount: "Kiasi cha Malipo",
        principal: "Mkopo Mkuu",
        interest: "Riba",
        remainingBalance: "Salio Lililobaki"
    }
};

let currentLang = 'en';

// Update language function
function updateLanguage() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = translations[currentLang][key];
    });
    document.getElementById('langToggle').textContent = translations[currentLang].switchLang;
}

// Toggle language
document.getElementById('langToggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'sw' : 'en';
    updateLanguage();
});

// Calculate loan function
function calculateLoan(event) {
    event.preventDefault();

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
    const regularPayment = (loanAmount * ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfPayments)) /
                           (Math.pow(1 + ratePerPeriod, numberOfPayments) - 1);

    // Generate amortization schedule
    const { schedule, payoffDate, totalInterest } = generateAmortizationSchedule(
        loanAmount, regularPayment, ratePerPeriod, numberOfPayments, extraPayment, extraPaymentFrequency
    );

    // Display results
    document.getElementById('regularPayment').textContent = formatCurrency(regularPayment);
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('totalRepayment').textContent = formatCurrency(loanAmount + totalInterest + additionalFees);
    document.getElementById('payoffDate').textContent = payoffDate.toLocaleDateString();
    
    // Update amortization schedule table
    updateAmortizationTable(schedule);

    document.getElementById('results').classList.remove('hidden');
}

// Calculate payment details based on frequency
function getPaymentDetails(repaymentFrequency, interestRate, loanTerm) {
    let numberOfPayments, ratePerPeriod;
    switch (repaymentFrequency) {
        case 'monthly':
            numberOfPayments = loanTerm;
            ratePerPeriod = interestRate;
            break;
        case 'biweekly':
            numberOfPayments = loanTerm * 2;
            ratePerPeriod = interestRate / 2;
            break;
        case 'weekly':
            numberOfPayments = loanTerm * 4;
            ratePerPeriod = interestRate / 4;
            break;
    }
    return { numberOfPayments, ratePerPeriod };
}

// Generate amortization schedule
function generateAmortizationSchedule(loanAmount, regularPayment, ratePerPeriod, numberOfPayments, extraPayment, extraPaymentFrequency) {
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

        if (principalPayment > remainingBalance) {
            principalPayment = remainingBalance;
        }

        remainingBalance -= principalPayment;
        totalInterest += interestPayment;

        schedule.push({
            paymentNumber: i,
            paymentDate: new Date(payoffDate.getTime()),
            paymentAmount: principalPayment + interestPayment,
            principal: principalPayment,
            interest: interestPayment,
            remainingBalance: remainingBalance
        });

        if (remainingBalance <= 0) {
            payoffDate = new Date(payoffDate.getTime());
            break;
        }

        // Update payoff date
        updatePayoffDate(payoffDate, repaymentFrequency);
    }

    return { schedule, payoffDate, totalInterest };
}

// Update payoff date based on repayment frequency
function updatePayoffDate(date, frequency) {
    switch (frequency) {
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'biweekly':
            date.setDate(date.getDate() + 14);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
    }
}

// Update amortization table
function updateAmortizationTable(schedule) {
    const tableBody = document.querySelector('#amortizationSchedule tbody');
    tableBody.innerHTML = '';
    schedule.forEach(payment => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = payment.paymentNumber;
        row.insertCell().textContent = payment.paymentDate.toLocaleDateString();
        row.insertCell().textContent = formatCurrency(payment.paymentAmount);
        row.insertCell().textContent = formatCurrency(payment.principal);
        row.insertCell().textContent = formatCurrency(payment.interest);
        row.insertCell().textContent = formatCurrency(payment.remainingBalance);
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
}

// Initialize
document.getElementById('loanForm').addEventListener('submit', calculateLoan);
updateLanguage();
