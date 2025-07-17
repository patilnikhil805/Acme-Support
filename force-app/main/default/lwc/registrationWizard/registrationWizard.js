import { LightningElement, track, wire } from 'lwc';
import getRegistrations from '@salesforce/apex/RegistrationController.getRegistrations';
import { createRecord, getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRegistrationNameById from '@salesforce/apex/RegistrationController.getRegistrationNameById';

export default class RegistrationWizard extends LightningElement {
    @track step = 1;
    @track registrations = [];

    @track registrationDraft = {
        Email__c: '',
        Serial_Number__c: '',
        Registration_Date__c: '',
        Registration_Type__c: '',
        Account__c: null,
        Product__c: null
    };

    typeOptions = [
        { label: 'Standard', value: 'Standard' },
        { label: 'Premium', value: 'Premium' }
    ];

    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Email', fieldName: 'Email__c' },
        { label: 'Type', fieldName: 'Registration_Type__c' },
        { label: 'Date', fieldName: 'Registration_Date__c' }
    ];

    get isStep1() { return this.step === 1; }
    get isStep2() { return this.step === 2; }
    get isStep3() { return this.step === 3; }

    @wire(getRegistrations)
    loadRegistrations({ data, error }) {
        if (data) {
            this.registrations = data;
        }
    }

    goToStep1 = () => { this.step = 1; }
    goToStep2 = () => { this.step = 2; }
    goToStep3 = () => { this.step = 3; }

    get hasRegistrations() {
    return this.registrations && this.registrations.length > 0;
}


    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;

        this.registrationDraft.Email__c = fields.Email__c;
        this.registrationDraft.Serial_Number__c = fields.Serial_Number__c;
        this.registrationDraft.Registration_Date__c = fields.Registration_Date__c;
        this.registrationDraft.Account__c = fields.Account__c;
        this.registrationDraft.Product__c = fields.Product__c;

        this.step = 3;
    }

    handleTypeChange(event) {
        this.registrationDraft.Registration_Type__c = event.detail.value;
    }

    submitRegistration() {
        const f = this.registrationDraft;

        if (!f.Email__c || !f.Registration_Type__c || !f.Account__c) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Missing Required Fields',
                message: 'Please complete all required fields.',
                variant: 'error'
            }));
            return;
        }

        const fields = {
            Email__c: f.Email__c,
            Serial_Number__c: f.Serial_Number__c,
            Registration_Date__c: f.Registration_Date__c,
            Registration_Type__c: f.Registration_Type__c,
            Account__c: f.Account__c,
            Product__c: f.Product__c
        };

        createRecord({ apiName: 'Registration__c', fields })
            .then(record => {
                const newId = record.id;

                // Fetch the auto-generated Name
                 getRegistrationNameById({ registrationId: newId })
                .then(regName => {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Registration Created',
                        message: `Name: ${regName}`,
                        variant: 'success'
                    }));

                        this.step = 1;
                    })
                    .catch(err => {
                        console.error('Error fetching Name field:', err);

                        this.dispatchEvent(new ShowToastEvent({
                            title: 'Registration Created',
                            message: `Record ID: ${newId} (Name fetch failed)`,
                            variant: 'info'
                        }));

                        this.step = 1;
                    });
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: error.body?.message || 'Something went wrong.',
                    variant: 'error'
                }));
            });
    }

    handleError(event) {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: event.detail.message || 'Form submission failed.',
            variant: 'error'
        }));
    }
}
