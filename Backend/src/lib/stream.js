import {StreamChat} from "stream-chat";

import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY
const apiSecret = process.env.STREAM_API_SECRET


if (!apiKey || !apiSecret) {
    console.log("Stream Api key or Secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
    try {
        await streamClient.upsertUsers([userData]);
        return userData;
    } catch (error) {
        console.log("Error upserting strem user:", error);
        
    }
};

export const generateStreamToken =  (userId) => {
    try {
        const userIdStr = userId.toString();
        return streamClient.createToken(userIdStr);
    } catch (error) {
      console.error("Error generating Stream token", error);
         
    }
};

export const createGroupChannel = async () => {
  try {
    const channel = streamClient.channel("messaging", "global-chat", {
      name: "Global Group Chat",
      image: "https://getstream.io/random_png/?id=global&name=Global%20Chat",
      members: [],        // nobody joins until approved
      created_by_id: "admin", // optional if you want
    });

    await channel.create();
    return channel;
  } catch (error) {
    console.log("Error creating group channel:", error);
  }
};

export const addUserToGroup = async (userId) => {
  try {
    const channel = streamClient.channel("messaging", "global-chat");
    await channel.addMembers([userId]);
  } catch (error) {
    console.log("Error adding user to group:", error);
  }
};
