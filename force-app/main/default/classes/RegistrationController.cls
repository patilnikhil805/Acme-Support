public with sharing class RegistrationController {
    @AuraEnabled(cacheable=true)
public static List<Registration__c> getRegistrations() {
    Id userId = UserInfo.getUserId();

    // Get the ContactId from the User
    User u = [SELECT ContactId FROM User WHERE Id = :userId LIMIT 1];

    // If no Contact is linked to the user, return nothing
    if (u.ContactId == null) {
        return new List<Registration__c>();
    }

    // Get the Account from the Contact
    Contact c = [SELECT AccountId FROM Contact WHERE Id = :u.ContactId LIMIT 1];

    // Now return all registrations for that account
    return [
        SELECT Id, Name, Email__c, Registration_Type__c, Registration_Date__c
        FROM Registration__c
        WHERE Account__c = :c.AccountId
        ORDER BY CreatedDate DESC
    ];
}


    @AuraEnabled
    public static String getRegistrationNameById(Id registrationId) {
        Registration__c reg = [SELECT Name FROM Registration__c WHERE Id = :registrationId LIMIT 1];
        return reg.Name;
    }
}
