import { Server } from "./server";

export interface CustomeResponse{
    timeStamp: Date;
    statusCode: number;
    status: string;
    reason: string;
    message: string;
    devMessage: string;
    data:{
        servers? : Server[],
        server? : Server
    }
}