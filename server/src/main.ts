import path from "path";
import express,
    { Express, NextFunction, Request, Response } from "express";
import { serverInfo } from "./ServerInfo";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import * as Contacts from "./contacts";
import { IContact } from "./contacts";
import { mainModule } from "process";


const app: Express = express();
app.use(express.json());
app.use("/",
    express.static(path.join(__dirname, "../../client/dist"))
);

// dealing with & getting through CORS policy
app.use(function(inRequest: Request, inResponse: Response, inNext: NextFunction) {
    inResponse.header("Access-Control-Allow-Origin", "*");
    inResponse.header("Access-Control-Allow-Methods",
        "GET,POST,DELETE,OPTIONS,PUT"
    );
    inResponse.header("Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept"
    );
    inNext();
});

// get a list of mailaboxes
app.get("/mailboxes",
    async (inRequest: Request, inResponse: Response) => {
        console.log("trying...")
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            console.log("created imapworker");
            const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
            inResponse.json(mailboxes);
        } catch (inError) {
            inResponse.send("error1");
        }
    }    
);

// getting a list of messages in a specific mailbox
app.get("/mailboxes/:mailbox",
    async(inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            const messages: IMAP.IMessage[] = await imapWorker.listMessages({
                mailbox: inRequest.params.mailbox
            });
            inResponse.json(messages);
        } catch (inError) {
            inResponse.send("error2");
        }
    }
);

// get the body contents of specific message
app.get("/messages/:mailbox/:id",
    async(inRequest: Request, inResponse: Response) => {
        try {
            const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
            console.log("got imapWorker");
            const messageBody: string | undefined = await imapWorker.getMessageBody({
                mailbox: inRequest.params.mailbox,
                id: parseInt(inRequest.params.id, 10)
            });
            console.log("got message body");
            console.log(messageBody);
            
            // send content to the client
            inResponse.send(messageBody);

        } catch (inError) {
            inResponse.send("error3");
        }
    }
);


// delete message
app.delete("/messages/:mailbox/:id",
    async (inRequest: Request, inResponse: Response) => {
        console.log("DELETE /messages");
        try {
        const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
        await imapWorker.deleteMessage({
            mailbox : inRequest.params.mailbox,
            id : parseInt(inRequest.params.id, 10)
        });
        console.log("DELETE /messages: Ok");
        inResponse.send("ok");
        } catch (inError) {
        console.log("DELETE /messages: Error", inError);
        inResponse.send("error");
        }
    }
);


// to send a message
app.post("/messages",
    async(req: Request, res: Response) => {
        console.log("POST /messages", req.body);
        try {
            const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo);
            console.log("here?");
            await smtpWorker.sendMessage(req.body);
            console.log("POST /messages: OK!");
            res.send("Message sent.");
        } catch (inError) {
            console.log("POST /messages: Error", inError);
            res.send("Error in sending message");
        }
    }
);

// get the list of contacts
app.get("/contacts",
    async(req: Request, res: Response) => {
        console.log("GET /contacts");
        try {
            const contactsWorker: Contacts.Worker = new Contacts.Worker;
            const contacts: IContact[] = await contactsWorker.listContacts();
            console.log("GET /contacts: OK", contacts);
            res.json(contacts);
        } catch (inError) {
            console.log("GET /contacts: Error", inError);
            res.send("Error during listing contacts");
        }
    }
);

// add a contact
app.post("/contacts",
    async(req: Request, res: Response) => {
        console.log("POST /contacts", req.body);
        try {
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const contact: IContact = await contactsWorker.addContact(req.body);
            console.log("POST /contacts: Ok", contact);
            res.json(contact);
        } catch (inError) {
            console.log("POST .contacts: Error", inError);
            res.send("error in adding a new contact");
        }
    }
);


// update a contact
app.put("/contacts/:id",
    async(req: Request, res: Response) => {
        console.log("PUT /contacts/", req.params.id, req.body);
        try {
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            const updatedNum: Number = await contactsWorker.updateContact(req.params.id, req.body);
            console.log("PUT Update successful");
            res.json(updatedNum);
        } catch (inError) {
            console.log("PUT .contacts: Error", inError);
            res.send("error in updating existing contact..");
        }
    }
)


// delete a contact
app.delete("/contacts/:id",
    async(inRequest: Request, inResponse: Response) => {
        try {
            const contactsWorker: Contacts.Worker = new Contacts.Worker();
            await contactsWorker.deleteContact(inRequest.params.id);
            inResponse.send("Ok");
        } catch (inError) {
            inResponse.send("error4");
        }
    }
);

app.listen(80, () => {
    console.log("Server running...");
});
