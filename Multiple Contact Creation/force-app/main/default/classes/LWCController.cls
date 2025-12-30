public without sharing class ContactCreationController {

  @AuraEnabled
  public static ContactResponse createContacts(List<Contact> contacts) {
    if (contacts.IsEmpty()) {
      return new ContactResponse('error', 'No Contacts found...');
    }

    List<String> errorMessages = new List<String>();
    List<Database.SaveResult> results = Database.insert(contacts, false);

    for (Integer index = 0; index < results.size(); index++) {
      Database.SaveResult result = results[index];

      String message = '';
      if (!result.isSuccess()) {
        message = '[' + (index + 1) + '] - failed due to: ';

        List<String> fieldErrors = new List<String>();
        for (Database.Error err : result.getErrors()) {
          fieldErrors.add(err.getMessage());
        }

        message += String.join(fieldErrors, ' | ');
        errorMessages.add(message.removeEnd(' | '));
      }
    }

    if (errorMessages.IsEmpty()) {
      return new ContactResponse('success', 'Contacts created successfully...');
    } else {
      return new ContactResponse(
        'error',
        String.join(errorMessages, ' || ').removeEnd(' || ')
      );
    }
  }

  public class ContactResponse {
    @AuraEnabled
    public String type;
    @AuraEnabled
    public String message;

    public ContactResponse(String type, String message) {
      this.type = type;
      this.message = message;
    }
  }

}
