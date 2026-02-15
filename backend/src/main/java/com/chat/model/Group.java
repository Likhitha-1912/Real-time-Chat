package com.chat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Document(collection = "groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {
    @Id
    private String id;
    private String name;
    private String description;
    private String avatar;
    private String createdBy;
    private List<String> admins;
    private List<GroupMember> members;
    private String conversationId;
    private GroupSettings settings;
    private Instant createdAt;
    private Instant updatedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GroupMember {
        private String userId;
        private String username;
        private Instant joinedAt;
        private MemberRole role;
    }
    
    public enum MemberRole {
        ADMIN, MEMBER
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GroupSettings {
        private boolean onlyAdminsCanPost;
        private boolean onlyAdminsCanAddMembers;
        private boolean muteNotifications;
    }
}
