package com.chat.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.Instant;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String username;
    
    @Indexed(unique = true)
    private String email;
    
    private String password;
    private String displayName;
    private String avatar;
    private String status;
    private Instant lastSeen;
    private Instant createdAt;
    private Instant updatedAt;
}
