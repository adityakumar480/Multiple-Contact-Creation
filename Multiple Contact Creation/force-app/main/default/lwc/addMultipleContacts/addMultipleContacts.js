import { LightningElement, api, wire } from "lwc";
import { CloseActionScreenEvent } from "lightning/actions";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getPicklistValues, getObjectInfo } from "lightning/uiObjectInfoApi";

import CONTACT_OBJECT from "@salesforce/schema/Contact";
import LEAD_SOURCE_FIELD from "@salesforce/schema/Contact.LeadSource";

import createContacts from "@salesforce/apex/ContactCreationController.createContacts";

export default class AddMultipleContacts extends LightningElement {
  @api recordId;
  contacts = [];
  isDisplaySpinner = false;

  @wire(getObjectInfo, { objectApiName: CONTACT_OBJECT })
  contactObjectInfo;

  @wire(getPicklistValues, {
    recordTypeId: "$contactObjectInfo.data.defaultRecordTypeId",
    fieldApiName: LEAD_SOURCE_FIELD
  })
  leadSourcePicklistValues;

  get leadSourcePicklist() {
    return this.leadSourcePicklistValues?.data?.values ?? [];
  }

  connectedCallback() {
    this.handleAddClick();
  }

  handleAddClick() {
    this.contacts.push({
      tempId: Date.now()
    });
  }

  handleDeleteClick(event) {
    const contacts = this.contacts ?? [];

    if (contacts.length === 1) {
      this.handleNotification(
        "ERROR",
        "Atleast one contact can be added.",
        "error"
      );
      return;
    }

    const { tempId } = event.target?.dataset || {};

    this.contacts = contacts.filter((contact) => contact.tempId !== tempId);
  }

  handleElementChange(event) {
    const {
      name,
      value,
      dataset: { tempId }
    } = event.target;
    const contacts = this.contacts;

    this.contacts = contacts.map((contact) => {
      if (Number(contact.tempId) === Number(tempId)) {
        return {
          ...contact,
          [name]: value
        };
      }
      return contact;
    });

    if (name === "LastName") {
      this.validateAllInputs();
    }
  }

  handleSubmitClick() {
    if (this.validateAllInputs()) {
      this.handleContactCreation();
    } else {
      this.handleNotification("ERROR", "Fill all the detail(s)...", "info");
    }
  }

  handleContactCreation() {
    this.isDisplaySpinner = true;

    this.contacts.forEach((contact) => (contact.AccountId = this.recordId));

    createContacts({ contacts: this.contacts })
      .then((response) => {
        const contactResponse = JSON.parse(JSON.stringify(response));

        if (contactResponse.type === "success") {
          this.handleNotification(
            "SUCCESS !!",
            contactResponse.message,
            contactResponse.type
          );
          this.dispatchEvent(new CloseActionScreenEvent());
        } else {
          this.handleNotification(
            "ERROR !!",
            contactResponse.message,
            contactResponse.type
          );
        }
      })
      .catch((error) => {
        this.handleNotification("ERROR", error, "error");
      })
      .finally(() => {
        this.isDisplaySpinner = false;
      });
  }

  handleNotification(title, message, variant, mode = "dismissable") {
    this.dispatchEvent(
      new ShowToastEvent({
        title,
        message,
        variant,
        mode
      })
    );
  }

  validateAllInputs() {
    var isValid = false;

    this.template.querySelectorAll(".first-class").forEach((field) => {
      if (!field.checkValidity() && !field?.value) {
        field.setCustomValidity(" ");
        isValid = false;
      } else {
        field.setCustomValidity("");
        isValid = true;
      }

      field.reportValidity();
    });

    return isValid;
  }
}
