import axios, { AxiosResponse } from "axios";
import { config } from "./config";

export interface IMailbox { 
    name: string, path: string 
}

export interface IMessage {
    id: string,
    date: string,
    from: string,
    subject: string,
    body?: string
}

export class Worker {

    // list mailboxes
    public async listMailboxes(): Promise<IMailbox[]> {
        const res: AxiosResponse = await axios.get(
            `${config.serverAddress}/mailboxes`
        );
        return res.data;
    }

    // list messages
    public async listMessages(inMailbox: string): Promise<IMessage[]> {
        const res: AxiosResponse = await axios.get(
            `${config.serverAddress}/mailboxes/${inMailbox}`
        );
        return res.data;
    }

    // get message body
    public async getMessageBody(inID: string, inMailbox: string): Promise<string> {
        const res: AxiosResponse = await axios.get(
            `${config.serverAddress}/messages/${inMailbox}/${inID}`
        );
        return res.data;
    }

    // deleteing a message
    public async deleteMessage(inID: string, inMailbox: string): Promise<void> {
        await axios.delete(
            `${config.serverAddress}/messages/${inMailbox}/${inID}`
        );
    }

}