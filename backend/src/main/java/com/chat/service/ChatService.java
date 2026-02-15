package com.chat.service;

import com.chat.dto.ChatMessage;
import com.chat.model.*;
import com.chat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public Message saveMessage(ChatMessage chatMessage) {
        Message message = Message.builder()
                .conversationId(chatMessage.getConversationId())
                .senderId(chatMessage.getSenderId())
                .senderName(chatMessage.getSenderName())
                .content(chatMessage.getContent())
                .messageType(Message.MessageType.TEXT)
                .timestamp(Instant.now())
                .createdAt(Instant.now())
                .readBy(new ArrayList<>())
                .edited(false)
                .deleted(false)
                .build();

        Message saved = messageRepository.save(message);

        // Update conversation's last message
        conversationRepository.findById(chatMessage.getConversationId())
                .ifPresent(conv -> {
                    conv.setLastMessage(Conversation.LastMessage.builder()
                            .content(chatMessage.getContent())
                            .senderId(chatMessage.getSenderId())
                            .timestamp(Instant.now())
                            .build());
                    conv.setUpdatedAt(Instant.now());
                    
                    // Increment unread count for other participants
                    Map<String, Integer> unreadCount = conv.getUnreadCount();
                    if (unreadCount == null) {
                        unreadCount = new HashMap<>();
                    }
                    for (String participantId : conv.getParticipants()) {
                        if (!participantId.equals(chatMessage.getSenderId())) {
                            unreadCount.put(participantId, unreadCount.getOrDefault(participantId, 0) + 1);
                        }
                    }
                    conv.setUnreadCount(unreadCount);
                    
                    conversationRepository.save(conv);
                });

        return saved;
    }

    public List<Message> getMessages(String conversationId, int page, int size) {
        return messageRepository.findByConversationIdOrderByTimestampDesc(
                conversationId, PageRequest.of(page, size));
    }

    public Conversation getOrCreatePrivateConversation(String user1Id, String user2Id) {
        List<String> participants = Arrays.asList(user1Id, user2Id);
        Collections.sort(participants);

        return conversationRepository.findByParticipantsAndType(
                        participants, Conversation.ConversationType.PRIVATE)
                .orElseGet(() -> {
                    Conversation conv = Conversation.builder()
                            .type(Conversation.ConversationType.PRIVATE)
                            .participants(participants)
                            .unreadCount(new HashMap<>())
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();
                    return conversationRepository.save(conv);
                });
    }

    public List<Conversation> getUserConversations(String userId) {
        List<Conversation> conversations = conversationRepository
                .findByParticipantsContainingOrderByUpdatedAtDesc(userId);
        
        // Enrich conversations with user/group details
        for (Conversation conv : conversations) {
            if (conv.getType() == Conversation.ConversationType.PRIVATE) {
                // Find the other user
                for (String participantId : conv.getParticipants()) {
                    if (!participantId.equals(userId)) {
                        userRepository.findById(participantId).ifPresent(otherUser -> {
                            // Store other user info in a way frontend can access
                            conv.setGroupName(otherUser.getDisplayName() != null ? 
                                    otherUser.getDisplayName() : otherUser.getUsername());
                            conv.setGroupAvatar(otherUser.getAvatar());
                        });
                        break;
                    }
                }
            }
        }
        
        return conversations;
    }

    public Conversation getConversationById(String conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
    }

    public Group createGroup(String name, String creatorId, List<String> memberIds) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Group.GroupMember> members = new ArrayList<>();
        members.add(Group.GroupMember.builder()
                .userId(creatorId)
                .username(creator.getUsername())
                .joinedAt(Instant.now())
                .role(Group.MemberRole.ADMIN)
                .build());

        Set<String> addedMembers = new HashSet<>();
        addedMembers.add(creatorId);

        for (String memberId : memberIds) {
            if (!addedMembers.contains(memberId)) {
                userRepository.findById(memberId).ifPresent(member -> {
                    members.add(Group.GroupMember.builder()
                            .userId(memberId)
                            .username(member.getUsername())
                            .joinedAt(Instant.now())
                            .role(Group.MemberRole.MEMBER)
                            .build());
                    addedMembers.add(memberId);
                });
            }
        }

        // Create conversation for group
        List<String> participantIds = new ArrayList<>(addedMembers);

        Conversation conversation = Conversation.builder()
                .type(Conversation.ConversationType.GROUP)
                .participants(participantIds)
                .groupName(name)
                .unreadCount(new HashMap<>())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        conversation = conversationRepository.save(conversation);

        Group group = Group.builder()
                .name(name)
                .createdBy(creatorId)
                .admins(List.of(creatorId))
                .members(members)
                .conversationId(conversation.getId())
                .settings(Group.GroupSettings.builder()
                        .onlyAdminsCanPost(false)
                        .onlyAdminsCanAddMembers(false)
                        .muteNotifications(false)
                        .build())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        group = groupRepository.save(group);

        // Update conversation with group ID
        conversation.setGroupId(group.getId());
        conversationRepository.save(conversation);

        return group;
    }

    public Group addMemberToGroup(String groupId, String userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Check if user is already a member
        boolean alreadyMember = group.getMembers().stream()
                .anyMatch(m -> m.getUserId().equals(userId));
        
        if (alreadyMember) {
            throw new RuntimeException("User is already a member of this group");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        group.getMembers().add(Group.GroupMember.builder()
                .userId(userId)
                .username(user.getUsername())
                .joinedAt(Instant.now())
                .role(Group.MemberRole.MEMBER)
                .build());
        group.setUpdatedAt(Instant.now());

        // Add to conversation participants
        conversationRepository.findById(group.getConversationId())
                .ifPresent(conv -> {
                    if (!conv.getParticipants().contains(userId)) {
                        conv.getParticipants().add(userId);
                        conversationRepository.save(conv);
                    }
                });

        return groupRepository.save(group);
    }

    public Group removeMemberFromGroup(String groupId, String userId, String requesterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Check if requester is admin
        if (!group.getAdmins().contains(requesterId) && !requesterId.equals(userId)) {
            throw new RuntimeException("Only admins can remove members");
        }
        
        group.getMembers().removeIf(m -> m.getUserId().equals(userId));
        group.getAdmins().remove(userId);
        group.setUpdatedAt(Instant.now());

        // Remove from conversation participants
        conversationRepository.findById(group.getConversationId())
                .ifPresent(conv -> {
                    conv.getParticipants().remove(userId);
                    conversationRepository.save(conv);
                });

        return groupRepository.save(group);
    }

    public List<Group> getUserGroups(String userId) {
        return groupRepository.findByMembersUserId(userId);
    }

    public void markConversationAsRead(String conversationId, String userId) {
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            Map<String, Integer> unreadCount = conv.getUnreadCount();
            if (unreadCount != null) {
                unreadCount.put(userId, 0);
                conv.setUnreadCount(unreadCount);
                conversationRepository.save(conv);
            }
        });
    }
}
