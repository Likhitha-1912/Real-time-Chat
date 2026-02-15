package com.chat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Document(collection = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {
    @Id
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String content;
    private MessageType messageType;
    private List<Attachment> attachments;
    private List<ReadReceipt> readBy;
    private String replyTo;
    private boolean edited;
    private Instant editedAt;
    private boolean deleted;
    private Instant deletedAt;
    private Instant timestamp;
    private Instant createdAt;
    
    public enum MessageType {
        TEXT, IMAGE, FILE, SYSTEM
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Attachment {
        private String type;
        private String url;
        private String name;
        private Long size;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReadReceipt {
        private String userId;
        private Instant readAt;
    }
}
