package com.chat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {
    @Id
    private String id;
    private ConversationType type;
    private List<String> participants;
    private LastMessage lastMessage;
    private Map<String, Integer> unreadCount;
    private String groupId;
    private String groupName;
    private String groupAvatar;
    private Instant createdAt;
    private Instant updatedAt;
    
    public enum ConversationType {
        PRIVATE, GROUP
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LastMessage {
        private String content;
        private String senderId;
        private Instant timestamp;
    }
}
