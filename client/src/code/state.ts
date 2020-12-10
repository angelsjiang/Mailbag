import * as Contacts from "./Contacts";
import { config } from "./config";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";

export function createState(inParentComponent) {
    return {
        pleaseWaitVisible: false,
        contacts : [ ],
        mailboxes : [ ],
        messages : [ ],

        currentView : "welcome",
        currentMailbox: null,
        
        messageID : null,
        messageDate : null,
        messageFrom : null,
        messageTo : null,
        messageSubject : null,
        messageBody : null,
        contactID : null,
        contactName : null,
        contactEmail : null,

        showHidePleaseWait : function(inVisible: boolean) : void {
            this.setState({ pleaseWaitVisible: inVisible });
        }.bind(inParentComponent),


        addMailboxToList : function(inMailbox: IMAP.IMailbox): void {
            const cl: IMAP.IMailbox[] = this.state.mailboxes.slice(0);
            cl.push(inMailbox);
            this.setState({ mailboxes : cl });
        }.bind(inParentComponent),


        addContactToList : function(inContact: Contacts.IContact): void {
            const cl = this.state.contacts.slice(0);
            cl.push({ _id : inContact._id,
                name : inContact.name, email : inContact.email
            });
            this.setState({ contacts : cl });
        }.bind(inParentComponent),


        showComposeMessage : function(inType: string): void {
            console.log("state.showComposeMessage()");
            switch (inType) {
                case "new":
                    this.setState({ currentView : "compose",
                        messageTo : "", 
                        messageSubject : "", 
                        messageBody : "",
                        messageFrom : config.userEmail
                });
                break;

                case "reply":
                    this.setState({ currentView : "compose",
                        messageTo : this.state.messageFrom,
                        messageSubject : `Re: ${this.state.messageSubject}`,
                        messageBody : `\n\n---- Original Message ----\n\n${this.state.messageBody}`,
                        messageFrom : config.userEmail,
                });
                break;

                case "contact":
                    this.setState({ currentView : "compose",
                        messageTo : this.state.contactEmail,
                        messageSubject : "",
                        messageBody : "",
                        messageFrom : config.userEmail
                });
                break;
            }
        }.bind(inParentComponent),

        showAddContact : function(): void {
            console.log("state.showAddContact()");
            this.setState({ 
                currentView : "contactAdd", 
                contactID : null, 
                contactName : "",
                contactEmail : ""
            });
        }.bind(inParentComponent),


        // set the currentMailbox value
        setCurrentMailbox : function(inPath: string): void {
            console.log("state.setCurrentMailbox()", inPath);

            this.setState({ 
                currentView : "welcome", 
                currentMailbox : inPath 
            });
            this.state.getMessages(inPath);
        }.bind(inParentComponent),


        // get messages after setcurrentmailbox
        getMessages : async function(inPath: string): Promise<void> {
            console.log("state.getMessages()");

            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            const messages: IMAP.IMessage[] = await imapWorker.listMessages(inPath);
            this.state.showHidePleaseWait(false);

            this.state.clearMessages();
            messages.forEach((inMessage: IMAP.IMessage) => {
                this.state.addMessageToList(inMessage);
            });
        }.bind(inParentComponent),


        // clear the list of message that's currently in display
        clearMessages : function(): void {
            console.log("state.clearMessages()");
            this.setState({ messages : [ ] });
        }.bind(inParentComponent),


        // adding messages to list
        addMessageToList : function(inMessage: IMAP.IMessage): void {
            console.log("state.addMessageToList()", inMessage);

            // copy current list through slicing from the start of the array
            const cl = this.state.messages.slice(0);
            console.log("what's cl? ", cl);
            // push new message into the array
            cl.push({ 
                id: inMessage.id,
                date: inMessage.date,
                from: inMessage.from,
                subject: inMessage.subject
            });

            // re-set the state with each updated messagelist array
            this.setState({ messages : cl });
            console.log("---- main.ts----- \n", this.state.messages);
        }.bind(inParentComponent),


        // show contact
        showContact : function(inID: string, inName: string, inEmail: string): void {
            console.log("state.showContact()", inID, inName, inEmail);

            this.setState({ 
                currentView : "contact",
                contactID: inID,
                contactName: inName,
                contactEmail: inEmail
            });
        }.bind(inParentComponent),

        // fired any time when user types in an editable field
        fieldChangeHandler : function(inEvent: any): void {
            console.log("state.fieldChangeHandler()", inEvent.target.id, inEvent.target.value);

            if(inEvent.target.id === "contactName" && inEvent.target.value.length > 16) { return; }

            console.log(inEvent.target.id, " ", inEvent.target.value)
            this.setState({ [inEvent.target.id] : inEvent.target.value });

        }.bind(inParentComponent),


        // save new contact
        saveContact : async function(): Promise<void> {
            console.log("state.saveContact()", this.state.contactID, 
                this.state.contactName, this.state.contactEmail);

            const cl = this.state.contacts.slice(0);
            this.state.showHidePleaseWait(true);
            const contactsWorker: Contacts.Worker= new Contacts.Worker();
            const contact: Contacts.IContact = 
                await contactsWorker.addContact({ name: this.state.contactName, email : this.state.contactEmail });
            this.state.showHidePleaseWait(false);

            cl.push(contact);

            this.setState({ contacts: cl, contactID: null, contactName: "", contactEmail: "" });
        }.bind(inParentComponent),


        // updating a contact
        updateContact : async function(): Promise<void> {

            console.log("state.updateContact()", this.state.contactID);

            const cl = this.state.contacts.slice(0);
            this.state.showHidePleaseWait(true);
            // update database
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const updatedNumber = 
                await contactsWorker.updateContact(this.state.contactID, 
                    { 
                        name: this.state.contactName,
                        email: this.state.contactEmail
                    });
            console.log(updatedNumber, " updated.");
            this.state.showHidePleaseWait(false);

            // update the list on the page - might not need to do anything, already set state
            let currentContact = cl.find((inElem) => inElem.id == this.state.contactID );
            console.log(currentContact);
            let index = cl.indexOf(currentContact);

            console.log("this.contactName: ", this.state.contactName);
            // update this contact
            currentContact.name = this.state.contactName;
            currentContact.email = this.state.contactEmail;

            cl[index] = currentContact;
            
            this.setState({
                contacts: cl
            });

        }.bind(inParentComponent),


        // delete a contact
        deleteContact : async function(): Promise<void> {
            console.log("state.deleteContact()", this.state.contactID);

            this.state.showHidePleaseWait(true);
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            await contactsWorker.deleteContact(this.state.contactID);
            this.state.showHidePleaseWait(false);

            // filter for all the contacts that are not equal to the current contactID
            const cl = this.state.contacts.filter((inElement) => inElement._id != this.state.contactID);

            // update the list && clear the form (although can also populate with the next up)
            this.setState({ 
                contacts: cl, 
                contactID: null, 
                contactName: "", 
                contactEmail: "",
                currentView: "welcome"
            });
        }.bind(inParentComponent),



        // show clicked message
        showMessage : async function(inMessage: IMAP.IMessage): Promise<void> {
            console.log("state.showMessage()", inMessage);

            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            const mb: String = await imapWorker.getMessageBody(inMessage.id, this.state.currentMailbox);
            this.state.showHidePleaseWait(false);

            this.setState({
                currentView: "message",
                messageID: inMessage.id,
                messageDate: inMessage.date,
                messageFrom: inMessage.from,
                // should this be user Email?
                messageTo: "",
                messageSubject: inMessage.subject,
                messageBody: mb
            });
        }.bind(inParentComponent),


        // send message
        sendMessage: async function(): Promise<void> {
            console.log("state.sendMessage()", this.state.messageTo, this.state.messageFrom,
            this.state.messageSubject, this.state.messageBody);

            this.state.showHidePleaseWait(true);
            const smtpWorker: SMTP.Worker = new SMTP.Worker();
            await smtpWorker.sendMessage(
                this.state.messageTo, 
                this.state.messageFrom,
                this.state.messageSubject,
                this.state.messageBody
            );
            this.state.showHidePleaseWait(false);

            this.setState({ currentView : "welcome" });

        }.bind(inParentComponent),


        // delete message
        deleteMessage: async function(): Promise<void> {
            
            console.log("state.deleteMessage()", this.state.messageID);

            this.state.showHidePleaseWait(true);
            const imapWorker: IMAP.Worker = new IMAP.Worker();
            await imapWorker.deleteMessage(this.state.messageID, this.state.currentMailbox);
            this.state.showHidePleaseWait(false);

            const cl = this.state.messages.filter((inElement) => inElement.id != this.state.messageID);

            this.setState({ messages: cl, currentView: "welcome" });

        }.bind(inParentComponent)

    }
}