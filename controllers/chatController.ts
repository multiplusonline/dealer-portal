import { MessageModel } from "@/models/messageModel"
import type { Message } from "@/lib/types"

export class ChatController {
  static async sendMessage(senderId: string, receiverId: string, message: string): Promise<Message> {
    return await MessageModel.send({
      sender_id: senderId,
      receiver_id: receiverId,
      message,
    })
  }

  static async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await MessageModel.getConversation(userId1, userId2)
  }
}
