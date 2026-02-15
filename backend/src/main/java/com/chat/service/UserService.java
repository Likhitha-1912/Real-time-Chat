package com.chat.service;

import com.chat.model.User;
import com.chat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User createUser(String username, String email, String password, String displayName) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = User.builder()
                .username(username)
                .email(email)
                .password(password) // In production, hash this password!
                .displayName(displayName != null ? displayName : username)
                .status("offline")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        
        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public List<User> searchUsers(String query) {
        return userRepository.findByUsernameContainingIgnoreCase(query);
    }

    public void updateUserStatus(String userId, String status) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setStatus(status);
            user.setLastSeen(Instant.now());
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);
        });
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(String userId, String displayName, String avatar) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (displayName != null) {
            user.setDisplayName(displayName);
        }
        if (avatar != null) {
            user.setAvatar(avatar);
        }
        user.setUpdatedAt(Instant.now());
        
        return userRepository.save(user);
    }
}
