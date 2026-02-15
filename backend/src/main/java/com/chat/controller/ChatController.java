package com.chat.controller;

import com.chat.dto.ChatMessage;
import com.chat.model.Message;
import com.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        log.info("Received message: {} from {} to conversation {}", 
                chatMessage.getContent(), chatMessage.getSenderId(), chatMessage.getConversationId());
        
        // Save message to database
        Message savedMessage = chatService.saveMessage(chatMessage);
        
        // Create response with saved message ID and timestamp
        chatMessage.setId(savedMessage.getId());
        chatMessage.setTimestamp(savedMessage.getTimestamp());
        chatMessage.setType(ChatMessage.MessageType.CHAT);
        
        // Broadcast to conversation topic
        messagingTemplate.convertAndSend(
                "/topic/conversation." + chatMessage.getConversationId(),
                chatMessage
        );
        
        log.info("Message sent to /topic/conversation.{}", chatMessage.getConversationId());
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload ChatMessage chatMessage) {
        log.debug("User {} is typing in conversation {}", 
                chatMessage.getSenderId(), chatMessage.getConversationId());
        
        chatMessage.setType(ChatMessage.MessageType.TYPING);
        
        messagingTemplate.convertAndSend(
                "/topic/conversation." + chatMessage.getConversationId() + ".typing",
                chatMessage
        );
    }

    @MessageMapping("/chat.stopTyping")
    public void stopTyping(@Payload ChatMessage chatMessage) {
        log.debug("User {} stopped typing in conversation {}", 
                chatMessage.getSenderId(), chatMessage.getConversationId());
        
        chatMessage.setType(ChatMessage.MessageType.STOP_TYPING);
        
        messagingTemplate.convertAndSend(
                "/topic/conversation." + chatMessage.getConversationId() + ".typing",
                chatMessage
        );
    }

    @MessageMapping("/chat.join")
    public void joinConversation(@Payload ChatMessage chatMessage) {
        log.info("User {} joined conversation {}", 
                chatMessage.getSenderId(), chatMessage.getConversationId());
        
        chatMessage.setType(ChatMessage.MessageType.JOIN);
        chatMessage.setContent(chatMessage.getSenderName() + " joined the chat");
        
        messagingTemplate.convertAndSend(
                "/topic/conversation." + chatMessage.getConversationId(),
                chatMessage
        );
    }

    @MessageMapping("/chat.leave")
    public void leaveConversation(@Payload ChatMessage chatMessage) {
        log.info("User {} left conversation {}", 
                chatMessage.getSenderId(), chatMessage.getConversationId());
        
        chatMessage.setType(ChatMessage.MessageType.LEAVE);
        chatMessage.setContent(chatMessage.getSenderName() + " left the chat");
        
        messagingTemplate.convertAndSend(
                "/topic/conversation." + chatMessage.getConversationId(),
                chatMessage
        );
    }
}
