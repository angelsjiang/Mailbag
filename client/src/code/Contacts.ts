import Axios from "axios";

import axios, { AxiosResponse } from "axios";
import { config } from "./config";


export interface IContact {
    _id?: number, name: string, email: string
}

export class Worker {

    public async listContacts(): Promise<IContact[]> {
        const res : AxiosResponse = await axios.get(`${config.serverAddress}/contacts`);
        return res.data;
    }

    // adding a contact
    public async addContact(inContact: IContact) : Promise<IContact> {
        const res: AxiosResponse = await axios.post(
            `${config.serverAddress}/contacts`, inContact
        );
        return res.data;
    }

    // deleting a contact, no need for return
    public  async deleteContact(inID) : Promise<void> {
        await axios.delete(`${config.serverAddress}/contacts/${inID}`);
    }

    // update a contact -- NOT COMPLETE, 
    public async updateContact(inID) : Promise<IContact> {
        // THIS IS NOT COMPLETED
        const res: AxiosResponse = await axios.put(
            `${config.serverAddress}/contacts/${inID}`
        );
        return res.data
    }

}