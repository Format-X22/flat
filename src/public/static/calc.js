function calc() {
    const form = document.forms.calc;
    const values = Object.fromEntries(new FormData(form));
    const capital = parseInt(values.capital);
    const risk = parseInt(values.risk);
    const riskAverage = parseInt(values.riskAverage.split(' ')[2]);
    const squeeze = parseFloat(values.squeeze);

    if (!capital || !risk || !squeeze) {
        return;
    }

    const deals = 3.5;
    const stop = 1.75;
    const enterSqueeze = 0.25;
    const exitSqueeze = enterSqueeze + 0.25;
    const byDeal = (risk / (stop + enterSqueeze)) * (stop * riskAverage - exitSqueeze);
    const dealPercent = (100 + byDeal) / 100;
    const resultPercent = 100 * dealPercent ** deals;
    const resultAmount = capital * dealPercent ** deals;
    const formatPercent = new Intl.NumberFormat('ru', {
        maximumFractionDigits: 2,
        style: 'percent',
    }).format(resultPercent / 100);
    const formatAmount = new Intl.NumberFormat('ru', {
        maximumFractionDigits: 2,
    }).format(resultAmount);

    document.getElementById('calc-result-percent').value = formatPercent;
    document.getElementById('calc-result-amount').value = formatAmount;
}
