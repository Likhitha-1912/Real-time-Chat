package com.chat.controller;

import com.chat.model.*;
import com.chat.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class RestApiController {

    private final UserService userService;
    private final ChatService chatService;

    // ==================== User Endpoints ====================

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> request) {
        try {
            User user = userService.createUser(
                    request.get("username"),
                    request.get("email"),
                    request.get("password"),
                    request.get("displayName")
            );
            log.info("Created user: {}", user.getUsername());
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("Error creating user: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }

    @GetMapping("/users/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        return userService.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        userService.updateUserStatus(id, request.get("status"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            User user = userService.updateUser(id, request.get("displayName"), request.get("avatar"));
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== Conversation Endpoints ====================

    @GetMapping("/conversations/{userId}")
    public ResponseEntity<List<Conversation>> getUserConversations(@PathVariable String userId) {
        return ResponseEntity.ok(chatService.getUserConversations(userId));
    }

    @GetMapping("/conversations/detail/{conversationId}")
    public ResponseEntity<?> getConversation(@PathVariable String conversationId) {
        try {
            Conversation conv = chatService.getConversationById(conversationId);
            return ResponseEntity.ok(conv);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/conversations/private")
    public ResponseEntity<Conversation> createPrivateConversation(@RequestBody Map<String, String> request) {
        Conversation conv = chatService.getOrCreatePrivateConversation(
                request.get("user1Id"),
                request.get("user2Id")
        );
        log.info("Created/retrieved private conversation: {}", conv.getId());
        return ResponseEntity.ok(conv);
    }

    @PutMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String conversationId,
            @RequestBody Map<String, String> request) {
        chatService.markConversationAsRead(conversationId, request.get("userId"));
        return ResponseEntity.ok().build();
    }

    // ==================== Message Endpoints ====================

    @GetMapping("/messages/{conversationId}")
    public ResponseEntity<List<Message>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getMessages(conversationId, page, size));
    }

    // ==================== Group Endpoints ====================

    @PostMapping("/groups")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> memberIds = (List<String>) request.get("memberIds");
            Group group = chatService.createGroup(
                    (String) request.get("name"),
                    (String) request.get("creatorId"),
                    memberIds
            );
            log.info("Created group: {} with {} members", group.getName(), group.getMembers().size());
            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            log.error("Error creating group: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/groups/{groupId}")
    public ResponseEntity<?> getGroup(@PathVariable String groupId) {
        return ResponseEntity.ok(chatService.getUserGroups(groupId));
    }

    @GetMapping("/groups/user/{userId}")
    public ResponseEntity<List<Group>> getUserGroups(@PathVariable String userId) {
        return ResponseEntity.ok(chatService.getUserGroups(userId));
    }

    @PostMapping("/groups/{groupId}/members")
    public ResponseEntity<?> addMember(
            @PathVariable String groupId,
            @RequestBody Map<String, String> request) {
        try {
            Group group = chatService.addMemberToGroup(groupId, request.get("userId"));
            log.info("Added member {} to group {}", request.get("userId"), groupId);
            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/groups/{groupId}/members/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable String groupId,
            @PathVariable String userId,
            @RequestParam String requesterId) {
        try {
            Group group = chatService.removeMemberFromGroup(groupId, userId, requesterId);
            log.info("Removed member {} from group {}", userId, groupId);
            return ResponseEntity.ok(group);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== Health Check ====================

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP", "message", "Chat API is running"));
    }
}
