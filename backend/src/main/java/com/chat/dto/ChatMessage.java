package com.chat.dto;

import lombok.*;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private MessageType type;
    private Instant timestamp;
    
    public enum MessageType {
        CHAT, JOIN, LEAVE, TYPING, STOP_TYPING
    }
}
