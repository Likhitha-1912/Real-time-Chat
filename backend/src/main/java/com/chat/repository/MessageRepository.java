package com.chat.repository;

import com.chat.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByConversationIdOrderByTimestampDesc(String conversationId, Pageable pageable);
    List<Message> findByConversationIdOrderByTimestampAsc(String conversationId);
    List<Message> findBySenderId(String senderId);
    long countByConversationId(String conversationId);
}
