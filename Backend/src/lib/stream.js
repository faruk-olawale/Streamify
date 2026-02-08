import {StreamChat} from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
    console.log("Stream Api key or Secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUser({
      id: userData.id,
      name: userData.name,
      image: userData.image,
      role: 'admin' // ← Change to admin for full permissions
    });
  } catch (error) {
    console.error('Error upserting Stream user:', error);
    throw error;
  }
};

export const generateStreamToken = (userId) => {
    try {
        const userIdStr = userId.toString();
        return streamClient.createToken(userIdStr);
    } catch (error) {
      console.error("Error generating Stream token", error);
    }
};

// Create a custom group channel
export const createCustomGroupChannel = async (channelId, channelData, creatorId) => {
  try {
    const channel = streamClient.channel("messaging", channelId, {
      name: channelData.name,
      image: channelData.image,
      created_by_id: creatorId.toString(),
      members: [creatorId.toString()], // Creator is first member
    });

    await channel.create();
    return channel;
  } catch (error) {
    console.log("Error creating custom group channel:", error);
    throw error;
  }
};

// Add members to a channel
export const addMembersToChannel = async (channelId, userIds) => {
  try {
    const channel = streamClient.channel("messaging", channelId);
    await channel.addMembers(userIds.map(id => id.toString()));
  } catch (error) {
    console.log("Error adding members to channel:", error);
    throw error;
  }
};

// Remove member from channel
export const removeMemberFromChannel = async (channelId, userId) => {
  try {
    const channel = streamClient.channel("messaging", channelId);
    await channel.removeMembers([userId.toString()]);
  } catch (error) {
    console.log("Error removing member from channel:", error);
    throw error;
  }
};

// Delete a channel
export const deleteChannel = async (channelId) => {
  try {
    const channel = streamClient.channel("messaging", channelId);
    await channel.delete();
  } catch (error) {
    console.log("Error deleting channel:", error);
    throw error;
  }
};

// Update channel data
export const updateChannelData = async (channelId, updates) => {
  try {
    const channel = streamClient.channel("messaging", channelId);
    await channel.update(updates);
  } catch (error) {
    console.log("Error updating channel:", error);
    throw error;
  }
};