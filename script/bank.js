class Bank {
    constructor() {
        this.clientsArray = clients;
        this.billsArray = bills;
    }

    getAmountDebtorAndAllSumDebt(isActive) {
        let sumAllDebt = 0;
        let countDebtor = 0;
        let result = {};

        for (let item of this.clientsArray) {
            if (item.isActive === isActive) {
                let bill = item.bill;

                for (let data of this.billsArray) {
                    if (data.bill === bill) {

                        for (let card of data.cards) {
                            if (card.viewCard === 'credit') {
                                countDebtor++;
                                sumAllDebt += card.limit - card.funds;
                            }
                        }
                    }
                }
            }
        }
        result = {
            [countDebtor]: sumAllDebt,
        };

        return result;
    }

    async getCurrentRates() {
        let coefficientArray = [];

        for await (let settings of this.serverRequest()) {
            coefficientArray = settings;
        }

        return coefficientArray;
    }

    async *serverRequest() {
        yield fetch('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5')
            .then(response => response.json());
    }

    async getCurrentCoefficient(currency) {
        // debugger
        let coefficientArray = await this.getCurrentRates();
        let coefficient = 0;

        for (let rates of coefficientArray) {
            if (rates.ccy === currency) {
                coefficient = Number(rates.buy);
                break;
            }
        }

        return coefficient;
    }

    async getSumAllMoneyBank(currency) {
        // debugger
        let sumAllMoneyBank = 0;
        let sumMoneyInHryvnia = 0;
        let sumAllMoneyClient = 0;

        for (let bill of this.billsArray) {
            for (let card of bill.cards) {

                if (card.currency === 'UAH') {
                    sumMoneyInHryvnia += card.personalFunds + card.funds;
                } else {
                    sumAllMoneyClient = card.personalFunds + card.funds;
                    sumMoneyInHryvnia += sumAllMoneyClient * await this.getCurrentCoefficient(card.currency);
                }
            }
        }
        sumAllMoneyBank = sumMoneyInHryvnia / await this.getCurrentCoefficient(currency);

        return sumAllMoneyBank.toFixed(2);
    }

    async getSumAllDebtAccounts(currency) {
        let sumAllDebtClient = 0;
        let sumDebtInHryvnia = 0;
        let sumDebtClient = 0;

        for (let bill of this.billsArray) {
            for (let card of bill.cards) {
                if (card.currency === 'UAH') {
                    sumDebtInHryvnia += card.limit - card.funds;
                } else {
                    sumDebtClient = card.limit - card.funds;
                    sumDebtInHryvnia += sumDebtClient * await this.getCurrentCoefficient(card.currency);
                }
            }
        }
        sumAllDebtClient = sumDebtInHryvnia / await this.getCurrentCoefficient(currency);

        return sumAllDebtClient.toFixed(2);
    }

}

const bank = new Bank();
