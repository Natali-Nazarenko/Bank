class Bank {
    constructor() {
        this.clients = clients;
        this.bills = bills;
        this.setClientsToLocalStorage();
        this.setCardsToLocalStorage();
        this.choiseCurrency();
        this.editClient();
    }

    setClientsToLocalStorage(data) {
        data = data || this.clients;
        localStorage.clients = JSON.stringify(data);
    }

    getClientsFromLocalStorage() {
        const arrayClients = localStorage.clients;
        return JSON.parse(arrayClients || null);
    }

    setCardsToLocalStorage(data) {
        data = data || this.bills;
        localStorage.bills = JSON.stringify(data);
    }

    getCardsFromLocalStorage() {
        const arrayBills = localStorage.bills;
        return JSON.parse(arrayBills || null);
    }

    deleteClient(id) {
        const clients = this.getClientsFromLocalStorage();
        const updatedClients = clients.map(item => {
            if (item.id === Number(id)) {
                item.isActive = false;
            }
            return item;
        })
        this.setClientsToLocalStorage(updatedClients);
        new Clients();
    }

    deleteCard(numberCard, billClient) {
        const cards = this.getCardsFromLocalStorage();
        const clients = this.getClientsFromLocalStorage();
        const updatedCards = cards.map(item => {
            if (item.bill === billClient) {
                item.cards.find(data => {
                    if (data.numberCard === Number(numberCard)) {
                        data.isActive = false;
                    }
                })
            }
            return item;
        })
        this.setCardsToLocalStorage(updatedCards);
        clients.find(item => {
            if (item.bill === billClient) {
                new ModalInfoClient().createModal(item);
            }
        })
    }

    editClient() {
        const editClient = document.querySelector('.add');
        editClient.addEventListener('click', (event) => {
            event.preventDefault();
            new ModalAddDataClient().createEditForm();
        })
    }

    choiseCurrency() {
        const inputChoiceFirst = document.querySelector('.choiceFirst');
        inputChoiceFirst.onchange = ({ target }) => {
            const result = this.getSumAllMoneyBank(target.value);
            return result;
        }

        const inpuChoiceSecond = document.querySelector('.choiceSecond');
        inpuChoiceSecond.onchange = ({ target }) => {
            const result = this.getSumAllDebtAccounts(target.value);
            return result;
        }

        const inputAmount = document.querySelector('.amount');
        inputAmount.onchange = ({ target }) => {
            let result = '';
            const data = true;
            if (target.value === 'active') {
                result = this.getAmountDebtorAndAllSumDebt(data);
            } else {
                result = this.getAmountDebtorAndAllSumDebt(!data);
            }

            return result;
        }
    }

    getAmountDebtorAndAllSumDebt(isActive) {
        let sumAllDebt = 0;
        let countDebtor = 0;
        let result = {};

        const clientsArray = this.getClientsFromLocalStorage();
        const billsArray = this.getCardsFromLocalStorage();
        const resultAmountClient = document.querySelector('.resultAmountClient');
        const resultSumClient = document.querySelector('.resultSumClient');

        for (let item of clientsArray) {
            if (item.isActive === isActive) {
                let bill = item.bill;

                for (let data of billsArray) {
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
        resultAmountClient.innerText = countDebtor;
        resultSumClient.innerText = sumAllDebt;
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
        let sumMoneyInHryvnia = 0;
        let sumAllMoneyClient = 0;

        const billsArray = this.getCardsFromLocalStorage();
        const resultAllSum = document.querySelector('.resultAllSum');

        for (let bill of billsArray) {
            for (let card of bill.cards) {

                if (card.currency === 'UAH') {
                    sumMoneyInHryvnia += card.personalFunds + card.funds;
                } else {
                    sumAllMoneyClient = card.personalFunds + card.funds;
                    sumMoneyInHryvnia += sumAllMoneyClient * await this.getCurrentCoefficient(card.currency);
                }
            }
        }
        resultAllSum.innerText = (sumMoneyInHryvnia / await this.getCurrentCoefficient(currency)).toFixed(2);

        return resultAllSum;
    }

    async getSumAllDebtAccounts(currency) {
        let sumDebtInHryvnia = 0;
        let sumDebtClient = 0;

        const billsArray = this.getCardsFromLocalStorage();
        const resultArrears = document.querySelector('.resultArrears');

        for (let bill of billsArray) {
            for (let card of bill.cards) {
                if (card.currency === 'UAH') {
                    sumDebtInHryvnia += card.limit - card.funds;
                } else {
                    sumDebtClient = card.limit - card.funds;
                    sumDebtInHryvnia += sumDebtClient * await this.getCurrentCoefficient(card.currency);
                }
            }
        }
        resultArrears.innerText = (sumDebtInHryvnia / await this.getCurrentCoefficient(currency)).toFixed(2);

        return resultArrears;
    }

}

const bank = new Bank();

class Clients {
    constructor() {
        this.block = document.querySelector('.blockClients');
        this.renderCardClient();
    }

    createCardDataClient(item) {
        const card = document.createElement('DIV');
        card.className = 'card';
        card.onclick = () => new ModalInfoClient().createModal(item);

        const titleCard = document.createElement('SPAN');
        titleCard.className = 'clientFIO';
        titleCard.innerText = `${item.surname} ${item.name} ${item.patronymic}`;

        const registration = document.createElement('SPAN');
        registration.innerText = `Дата регистрации : ${item.registration}`;

        const status = document.createElement('SPAN');
        status.innerText = `Текущий статус : ${item.isActive}`;

        const blockButton = document.createElement('DIV');

        const editClient = document.createElement('BUTTON');
        editClient.name = item.id;
        editClient.innerText = 'Edit';

        editClient.onclick = (event) => {
            event.stopPropagation();
            const arrayClients = bank.getClientsFromLocalStorage();
            const client = arrayClients.find(item => {
                if (String(item.id) === event.target.name) {
                    return item;
                }
            })
            new ModalAddDataClient().createEditForm(client);
        }

        const deleteClient = document.createElement('BUTTON');
        if (item.isActive) {
            deleteClient.disabled = false;
        } else {
            deleteClient.disabled = true;
        }
        deleteClient.innerText = 'Delete';
        deleteClient.name = item.id;

        deleteClient.onclick = (event) => {
            event.stopPropagation();
            bank.deleteClient(event.target.name);
        }

        blockButton.append(editClient, deleteClient);
        card.append(titleCard, registration, status, blockButton);
        return card;
    }

    renderCardClient() {
        this.block.innerHTML = '';
        const arrayClients = bank.getClientsFromLocalStorage();
        const cards = arrayClients.map(item => this.createCardDataClient(item));
        this.block.append(...cards);
    }

}

const list = new Clients();

class Cards {

    createCardDataCards(item, billClient) {

        const card = document.createElement('DIV');
        card.className = 'cardInfo';

        const bill = document.createElement('SPAN');
        bill.innerText = `Счёт: ${item.viewCard}`;

        const numberCard = document.createElement('SPAN');
        numberCard.innerText = `Номер карты: ${item.numberCard}`;

        const personalBalance = document.createElement('SPAN');
        personalBalance.innerText = `Личный баланс: ${item.personalFunds}`;

        const creditBalance = document.createElement('SPAN');
        creditBalance.innerText = `Кредитный баланс: ${item.funds}`;

        const creditLimit = document.createElement('SPAN');
        creditLimit.innerText = `Кредитный лимит: ${item.limit}`;

        const currency = document.createElement('SPAN');
        currency.innerText = `Валюта счета: ${item.currency}`;

        const status = document.createElement('SPAN');
        status.innerText = `Текущий статус: ${item.isActive}`;

        const validCard = document.createElement('SPAN');
        validCard.innerText = `Выдана до: ${item.expiryDate}`;

        const blockButton = document.createElement('DIV');

        const editCard = document.createElement('BUTTON');
        editCard.name = item.numberCard;
        editCard.innerText = 'Edit';

        editCard.onclick = (event) => {
            event.stopPropagation();
            new ModalAddDataCard().createEditForm(billClient, item);
        }

        const deleteCard = document.createElement('BUTTON');
        deleteCard.innerText = 'Delete';
        if (item.isActive) {
            deleteCard.disabled = false;
        } else {
            deleteCard.disabled = true;
        }

        deleteCard.name = item.numberCard;
        deleteCard.onclick = (event) => {
            event.stopPropagation();
            bank.deleteCard(event.target.name, billClient);
        }

        blockButton.append(editCard, deleteCard);
        card.append(bill, numberCard, personalBalance, creditBalance, creditLimit, currency, status, validCard, blockButton);

        return card;
    }

}

const listCards = new Cards();

class ModalInfoClient {
    constructor() {
        this.modal = document.querySelector('.modalInfo');
        this.modalContainer = document.querySelector('.modalContainer');
    }

    createModal(data) {
        this.modalContainer.innerHTML = '';
        this.modal.classList.add('active');

        const clientInfo = document.createElement('DIV');
        clientInfo.className = 'clientInfo';

        const titleCard = document.createElement('SPAN');
        titleCard.className = 'clientFIO';
        titleCard.innerText = `${data.surname} ${data.name} ${data.patronymic}`;

        const bill = document.createElement('DIV');
        bill.className = 'bill';
        bill.innerText = `Счет: ${data.bill}`;

        const registration = document.createElement('SPAN');
        registration.innerText = `Дата регистрации : ${data.registration}`;

        const status = document.createElement('SPAN');
        status.innerText = `Текущий статус : ${data.isActive}`;

        clientInfo.append(titleCard, bill, registration, status);

        const addNewCardClient = document.createElement('BUTTON');
        addNewCardClient.className = 'add';
        addNewCardClient.addEventListener('click', (event) => {
            event.preventDefault();
            new ModalAddDataCard().createEditForm(data.bill);
        })


        const cardsInfo = document.createElement('DIV');
        cardsInfo.className = 'blockCards';
        cardsInfo.innerHTML = '';
        const arrayCards = bank.getCardsFromLocalStorage();

        arrayCards.find(item => {
            if (item.bill === data.bill) {
                item.cards.map(element => cardsInfo.appendChild(listCards.createCardDataCards(element, data.bill)));
            }
        })

        this.modalContainer.append(clientInfo, addNewCardClient, cardsInfo);
        this.modal.onclick = (event) => {
            if (this.modal !== event.target) return;
            this.modal.classList.remove('active');
        }
    }

}

class ModalAddDataClient {
    constructor() {
        this.modal = document.querySelector('.EditClient');
        this.modalContainer = document.querySelector('.modalContainerEditClient');
        this.createEditForm();
    }

    createEditForm(client) {
        // debugger
        this.modalContainer.innerHTML = '';
        client = client || 0;
        this.modal.classList.add('active');

        const form = document.createElement('FORM');
        form.id = 'addClient';

        const inputId = document.createElement('input');
        inputId.type = 'number';
        inputId.className = 'idClient';
        inputId.name = 'id';
        inputId.value = client.id || '';

        const spanSurname = document.createElement('span');
        spanSurname.innerText = 'Фамилия: ';
        const surname = document.createElement('input');
        surname.setAttribute('required', 'true');
        surname.type = 'text';
        surname.name = 'surname';
        surname.value = client.surname || '';

        const spanName = document.createElement('span');
        spanName.innerText = 'Имя: ';
        const name = document.createElement('input');
        name.setAttribute('required', 'true');
        name.type = 'text';
        name.name = 'name';
        name.value = client.name || '';

        const spanPatronymic = document.createElement('span');
        spanPatronymic.innerText = 'Отчество: ';
        const patronymic = document.createElement('input');
        patronymic.setAttribute('required', 'true');
        patronymic.type = 'text';
        patronymic.name = 'patronymic';
        patronymic.value = client.patronymic || '';

        const spanIsActive = document.createElement('span');
        spanIsActive.innerText = 'Текущий статус: ';
        const isActive = document.createElement('input');
        isActive.setAttribute('required', 'true');
        isActive.type = 'text';
        isActive.name = 'isActive';
        isActive.value = client.isActive || '';

        const spanRegistration = document.createElement('span');
        spanRegistration.innerText = 'Дата регистрации: ';
        const registration = document.createElement('input');
        registration.setAttribute('required', 'true');
        registration.type = 'date';
        registration.name = 'registration';
        registration.value = client.registration || '';

        const spanBill = document.createElement('span');
        spanBill.innerText = 'Лицевой счет: ';
        const bill = document.createElement('input');
        bill.setAttribute('required', 'true');
        bill.type = 'number';
        bill.name = 'bill';
        bill.value = client.bill || '';

        const saveClient = document.createElement('INPUT');
        saveClient.type = 'submit';
        saveClient.value = 'Save';
        saveClient.className = 'button';

        form.append(
            inputId,
            spanSurname,
            surname,
            spanName,
            name,
            spanPatronymic,
            patronymic,
            spanIsActive,
            isActive,
            spanRegistration,
            registration,
            spanBill,
            bill,
            saveClient
        );

        form.onsubmit = (event) => {
            event.preventDefault();
            let formData = new FormData(form);
            let arrayClients = bank.getClientsFromLocalStorage();

            if (client !== 0) {
                arrayClients = arrayClients.map(item => {

                    if (item.id === Number(formData.get('id'))) {
                        item.name = formData.get('name');
                        item.surname = formData.get('surname');
                        item.patronymic = formData.get('patronymic');
                        item.isActive = formData.get('isActive');
                        item.registration = formData.get('registration');
                        item.bill = formData.get('bill');
                    }

                    return item;
                })
                bank.setClientsToLocalStorage(arrayClients);
            } else {
                const newClient = {
                    id: crypto.randomUUID(),
                    name: formData.get('name'),
                    surname: formData.get('surname'),
                    patronymic: formData.get('patronymic'),
                    isActive: true,
                    registration: formData.get('registration'),
                    bill: formData.get('bill'),
                };
                arrayClients.push(newClient);
                bank.setClientsToLocalStorage(arrayClients);
            }
            this.modal.classList.remove('active');
            new Clients();
        }
        this.modalContainer.appendChild(form);

        const cancel = document.createElement('button');
        cancel.innerText = 'Cancel';
        cancel.className = 'button';
        cancel.onclick = () => this.modal.classList.remove('active');

        this.modal.onclick = (event) => {
            if (this.modal !== event.target) return;
            this.modal.classList.remove('active');
        }
        this.modalContainer.append(cancel);
    }

}

class ModalAddDataCard {
    constructor() {
        this.modal = document.querySelector('.EditCard');
        this.modalContainer = document.querySelector('.modalContainerEditCard');
    }

    createEditForm(billClient, card) {
        this.modalContainer.innerHTML = '';
        card = card || 0;
        this.modal.classList.add('active');

        const form = document.createElement('FORM');
        form.id = 'addCard';

        const spanViewCard = document.createElement('SPAN');
        spanViewCard.innerText = 'Cчет: ';
        const viewCard = document.createElement('INPUT');
        viewCard.setAttribute('list', 'viewCard');
        viewCard.setAttribute('required', 'true');
        viewCard.name = 'viewCard';
        viewCard.value = card.viewCard || '';

        const datalistViewCard = document.createElement('DATALIST');
        datalistViewCard.id = 'viewCard';
        datalistViewCard.innerHTML = `
            <option>debit</option>
            <option>credit</option>
        `

        const spanNumberCard = document.createElement('SPAN');
        spanNumberCard.innerText = 'Номер карты: ';
        const numberCard = document.createElement('INPUT');
        numberCard.type = 'number';
        numberCard.setAttribute('required', 'true');
        numberCard.name = 'numberCard';
        numberCard.value = card.numberCard || '';

        const spanPersonalFunds = document.createElement('SPAN');
        spanPersonalFunds.innerText = 'Личный баланс: ';
        const personalFunds = document.createElement('INPUT');
        personalFunds.type = 'number';
        personalFunds.setAttribute('required', 'true');
        personalFunds.name = 'personalFunds';
        personalFunds.value = card.personalFunds || '';

        const spanFunds = document.createElement('SPAN');
        spanFunds.innerText = 'Кредитный баланс: ';
        const funds = document.createElement('INPUT');
        funds.type = 'number';
        funds.setAttribute('required', 'true');
        funds.name = 'funds';
        funds.value = card.value || 0;

        const spanLimit = document.createElement('SPAN');
        spanLimit.innerText = 'Кредитный лимит: ';
        const limit = document.createElement('INPUT');
        limit.type = 'number';
        limit.setAttribute('required', 'true');
        limit.name = 'limit';
        limit.value = card.value || 0;

        const spanCurrency = document.createElement('SPAN');
        spanCurrency.innerText = 'Валюта счета';
        const currency = document.createElement('INPUT');
        currency.setAttribute('list', 'currency');
        currency.setAttribute('required', 'true');
        currency.name = 'currency';
        currency.value = card.currency || '';

        const datalistCurrency = document.createElement('DATALIST');
        datalistCurrency.id = 'currency';
        datalistCurrency.innerHTML = `
            <option>USD</option>
            <option>UAH</option>
            <option>RUR</option>
            <option>EUR</option>
        `

        const spanIsActive = document.createElement('SPAN');
        spanIsActive.innerText = 'Текущий статус активен? ';
        const isActive = document.createElement('INPUT');
        isActive.setAttribute('list', 'isActive');
        isActive.setAttribute('required', 'true');
        isActive.name = 'isActive';
        isActive.value = card.isActive || '';

        const datalistIsActive = document.createElement('DATALIST');
        datalistIsActive.id = 'isActive';
        datalistIsActive.innerHTML = `
            <option>false</option>
            <option>true</option>
        `

        const spanExpiryDate = document.createElement('SPAN');
        spanExpiryDate.innerText = 'Выдана до: ';
        const expiryDate = document.createElement('INPUT');
        expiryDate.type = 'date';
        expiryDate.setAttribute('required', 'true');
        expiryDate.name = 'expiryDate';
        expiryDate.value = card.expiryDate || '';

        const saveCard = document.createElement('INPUT');
        saveCard.type = 'submit';
        saveCard.value = 'Save';
        saveCard.className = 'button';

        form.append(
            spanViewCard,
            viewCard,
            datalistViewCard,
            spanNumberCard,
            numberCard,
            spanPersonalFunds,
            personalFunds,
            spanFunds,
            funds,
            spanLimit,
            limit,
            spanCurrency,
            currency,
            datalistCurrency,
            spanIsActive,
            isActive,
            datalistIsActive,
            spanExpiryDate,
            expiryDate,
            saveCard
        );

        form.onsubmit = (event) => {
            event.preventDefault();
            let formData = new FormData(form);
            let arrayBills = bank.getCardsFromLocalStorage();

            arrayBills = arrayBills.map(item => {
                if (item.bill === billClient) {
                    if (card !== 0) {
                        item.cards = item.cards.map(data => {
                            if (data.numberCard === Number(formData.get('numberCard'))) {
                                data.viewCard = formData.get('viewCard');
                                data.numberCard = formData.get('numberCard');
                                data.personalFunds = formData.get('personalFunds');
                                data.funds = formData.get('funds');
                                data.limit = formData.get('limit');
                                data.expiryDate = formData.get('expiryDate');
                                data.isActive = formData.get('isActive');
                                data.currency = formData.get('currency');
                            }
                            
                            return data;
                        })
                    } else {
                        const newCard = {
                            viewCard: formData.get('viewCard'),
                            numberCard: formData.get('numberCard'),
                            personalFunds: formData.get('personalFunds'),
                            funds: formData.get('funds'),
                            limit: formData.get('limit'),
                            expiryDate: formData.get('expiryDate'),
                            isActive: formData.get('isActive'),
                            currency: formData.get('currency'),
                        };
                        item.cards.push(newCard);
                    }
                }
                return item;
            })
            bank.setCardsToLocalStorage(arrayBills);

            this.modal.classList.remove('active');
            const client = bank.getClientsFromLocalStorage().find(item => item.bill === billClient);
            new ModalInfoClient().createModal(client);
        }

        this.modalContainer.appendChild(form);

        const cancel = document.createElement('button');
        cancel.innerText = 'Cancel';
        cancel.className = 'button';
        cancel.onclick = () => this.modal.classList.remove('active');
        this.modal.onclick = (event) => {
            if (this.modal !== event.target) return;
            this.modal.classList.remove('active');
        }
        this.modalContainer.append(cancel);
    }

}
