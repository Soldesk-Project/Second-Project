package org.joonzis.service.match;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class MatchService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    public void enqueue(String userId) {
        redisTemplate.opsForList().leftPush("match-queue", userId);
    }

    public List<String> dequeue(int count) {
        List<String> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String userId = redisTemplate.opsForList().rightPop("match-queue");
            if (userId != null) users.add(userId);
        }
        return users;
    }

    public Long queueSize() {
        return redisTemplate.opsForList().size("match-queue");
    }
}
