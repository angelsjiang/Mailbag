import * as path from "path";
const Datastore = require("nedb");

export interface IContact {
    _id?: number, name: string, email: string
}

export class Worker {
    private db: Nedb;
    constructor() {
        this.db = new Datastore({
            filename : path.join(__dirname, "contacts.db"),
            autoload : true
        });
    }

    // providing a list of contacts
    public listContacts(): Promise<IContact[]> {
        return new Promise((inResolve, inReject) => {
            this.db.find({ },
                (inError: Error, inDocs: IContact[]) => {
                    if(inError) {
                        inReject(inError);
                    } else {
                        inResolve(inDocs);
                    }
                }
            );
        });
    }

    // to add new contact
    public addContact(inContact: IContact): Promise<IContact> {
        return new Promise((inResolve, inReject) => {
            this.db.insert(inContact,
                (inError, inNewDoc: IContact) => {
                    if(inError) {
                        inReject(inError);
                    } else {
                        inResolve(inNewDoc);
                    }
                }
            );
        });
    }


    // update existing contact
    public updateContact(inID: string, inContact: IContact) : Promise<Number> {
        console.log("updating contact...", inID, inContact);
        return new Promise((inResolve, inReject) => {
            this.db.update(
                { _id : inID},
                { $set: inContact}, {},
            (inError, updatedDoc) => {
                if(inError) {
                    inReject(inError);
                } else {
                    inResolve(updatedDoc);
                }
            });
        });
    }



    // delete a contact
    public deleteContact(inID: string) : Promise<string> {
        return new Promise((inResolve, inReject) => {
            this.db.remove({ _id : inID }, { },
                (inError, inNumRemoved: number) => {
                    if(inError) {
                        inReject(inError);
                    } else {
                        inResolve(undefined);
                    }
                }
            );
        });
    }

}