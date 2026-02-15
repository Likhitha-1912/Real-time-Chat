package com.chat.repository;

import com.chat.model.Group;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends MongoRepository<Group, String> {
    @Query("{ 'members.userId': ?0 }")
    List<Group> findByMembersUserId(String userId);
    
    Optional<Group> findByConversationId(String conversationId);
    
    List<Group> findByCreatedBy(String userId);
    
    @Query("{ 'admins': ?0 }")
    List<Group> findByAdminsContaining(String userId);
}
