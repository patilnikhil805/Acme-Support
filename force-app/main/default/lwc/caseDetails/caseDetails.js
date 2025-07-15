import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import searchKnowledge from '@salesforce/apex/CaseDetailsController.searchKnowledge';
import { updateRecord } from 'lightning/uiRecordApi';


// Field imports
import SUBJECT from '@salesforce/schema/Case.Subject';
import STATUS from '@salesforce/schema/Case.Status';
import PRIORITY from '@salesforce/schema/Case.Priority';
import REGISTRATION from '@salesforce/schema/Case.Registration__c';
import SERIAL_NUMBER from '@salesforce/schema/Registration__c.Serial_Number__c';
import REG_DATE from '@salesforce/schema/Registration__c.Registration_Date__c';
import DESCRIPTION from '@salesforce/schema/Case.Description';
import getRegistration from '@salesforce/apex/CaseDetailsController.getRegistration';


const CASE_FIELDS = [SUBJECT, STATUS, PRIORITY, REGISTRATION];
const REG_FIELDS = [SERIAL_NUMBER, REG_DATE];

export default class CaseDetails extends LightningElement {
    @api recordId;
    caseData;
    registrationData;
    error;

    @track searchTerm = '';
    @track searchResults = [];
    @track searchError;
    @track selectedStatus;
    @track internalComments = '';
    @track statusOptions = [
    { label: 'New', value: 'New' },
    { label: 'Working', value: 'Working' },
    { label: 'Escalated', value: 'Escalated' },
    { label: 'Closed', value: 'Closed' }
    ]; // Or dynamically load via picklistValues


    @wire(getRecord, { recordId: '$recordId', fields: CASE_FIELDS })
    wiredCase({ error, data }) {
        if (data) {
            this.caseData = data.fields;
            const regId = data.fields.Registration__c?.value;
            this.selectedStatus = data.fields.Status.value;

            if (regId) {
                this.fetchRegistration(regId);
            }
        } else if (error) {
            this.error = error;
        }
    }

    fetchRegistration(regId) {
        getRegistration({ regId })
    .then(result => {
        this.registrationData = {
            Serial_Number__c: { value: result.Serial_Number__c },
            Registration_Date__c: { value: result.Registration_Date__c }
        };
    })
    .catch(err => {
        this.error = err;
    });
    }

    handleSearchInput(event) {
        this.searchTerm = event.target.value;
    }
    
    handleStatusChange(event) {
    this.selectedStatus = event.detail.value;
    }

    handleCommentsChange(event) {
    this.internalComments = event.detail.value;
    }


    handleSearchClick() {
        searchKnowledge({ searchTerm: this.searchTerm })
            .then(data => {
                this.searchResults = data;
                this.searchError = undefined;
            })
            .catch(err => {
                this.searchError = err;
                this.searchResults = [];
            });
    }
    handleSave() {
    const newDesc = '[Agent Comment] ' + this.internalComments;
    const fields = {
        Id: this.recordId,
        Status: this.selectedStatus,
        Description: this.caseData.Description?.value
            ? this.caseData.Description.value + '\n' + newDesc
            : newDesc
    };

    const recordInput = { fields };

    updateRecord(recordInput)
        .then(() => {
            this.internalComments = '';
            this.dispatchEvent(
                new CustomEvent('toast', {
                    detail: { message: 'Case updated successfully.' }
                })
            );
        })
        .catch(error => {
            console.error('Save error:', error);
            this.error = error;
        });
}

}
