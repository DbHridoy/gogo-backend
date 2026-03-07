import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });
}

export const getSocketServer = () => {
    if (!io) {
        throw new Error("Socket server not initialized");
    }
    return io;
};
