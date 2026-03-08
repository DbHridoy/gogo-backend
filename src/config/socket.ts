import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { Types } from "mongoose";
import User from "../modules/user/user.model";
import { logger } from "../utils/logger";

let io: Server;
const socketToUserId = new Map<string, string>();
const userSockets = new Map<string, Set<string>>();
const latestLocations = new Map<
  string,
  { latitude: number; longitude: number; updatedAt: Date }
>();

const isValidLocation = (latitude: number, longitude: number) => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        socket.on("register_user", async (payload: { userId?: string }) => {
            try {
                const userId = payload?.userId;

                if (!userId || !Types.ObjectId.isValid(userId)) {
                    socket.emit("location_error", { message: "Invalid userId" });
                    return;
                }

                socketToUserId.set(socket.id, userId);

                const sockets = userSockets.get(userId) ?? new Set<string>();
                sockets.add(socket.id);
                userSockets.set(userId, sockets);

                const user = await User.findById(userId).select("location").lean();
                const savedLocation = user?.location;
                if (
                    savedLocation &&
                    typeof savedLocation.latitude === "number" &&
                    typeof savedLocation.longitude === "number"
                ) {
                    latestLocations.set(userId, {
                        latitude: savedLocation.latitude,
                        longitude: savedLocation.longitude,
                        updatedAt: savedLocation.updatedAt
                            ? new Date(savedLocation.updatedAt)
                            : new Date(),
                    });
                }

                const others = [...latestLocations.entries()]
                    .filter(([id]) => id !== userId)
                    .map(([id, location]) => ({ userId: id, location }));

                socket.emit("active_locations", others);
            } catch (error) {
                logger.error({ error }, "Socket register_user failed");
                socket.emit("location_error", { message: "Failed to register user" });
            }
        });

        socket.on(
            "update_location",
            async (payload: { latitude?: number; longitude?: number }) => {
                try {
                    const userId = socketToUserId.get(socket.id);
                    if (!userId) {
                        socket.emit("location_error", {
                            message: "User not registered for this socket",
                        });
                        return;
                    }

                    const latitude = payload?.latitude;
                    const longitude = payload?.longitude;

                    if (
                        typeof latitude !== "number" ||
                        typeof longitude !== "number" ||
                        !isValidLocation(latitude, longitude)
                    ) {
                        socket.emit("location_error", { message: "Invalid location data" });
                        return;
                    }

                    const location = { latitude, longitude, updatedAt: new Date() };

                    latestLocations.set(userId, location);
                    await User.findByIdAndUpdate(userId, { location });

                    socket.broadcast.emit("user_location_updated", { userId, location });
                } catch (error) {
                    logger.error({ error }, "Socket update_location failed");
                    socket.emit("location_error", { message: "Failed to update location" });
                }
            }
        );

        socket.on("get_active_locations", () => {
            const currentUserId = socketToUserId.get(socket.id);
            const locations = [...latestLocations.entries()]
                .filter(([id]) => id !== currentUserId)
                .map(([id, location]) => ({ userId: id, location }));

            socket.emit("active_locations", locations);
        });

        socket.on("disconnect", () => {
            const userId = socketToUserId.get(socket.id);
            if (userId) {
                socketToUserId.delete(socket.id);

                const sockets = userSockets.get(userId);
                if (sockets) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        userSockets.delete(userId);
                    }
                }
            }

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
