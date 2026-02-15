package com.chat.repository;

import com.chat.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByParticipantsContainingOrderByUpdatedAtDesc(String userId);
    
    @Query("{ 'participants': { $all: ?0 }, 'type': ?1 }")
    Optional<Conversation> findByParticipantsAndType(List<String> participants, Conversation.ConversationType type);
    
    List<Conversation> findByTypeOrderByUpdatedAtDesc(Conversation.ConversationType type);
    
    Optional<Conversation> findByGroupId(String groupId);
}
