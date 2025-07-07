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

    private static final String MATCH_QUEUE_KEY = "match-queue";

    public void enqueue(String userId) {
        redisTemplate.opsForList().leftPush(MATCH_QUEUE_KEY, userId);
    }

    public Long queueSize() {
        return redisTemplate.opsForList().size(MATCH_QUEUE_KEY);
    }

    public List<String> peekAndRemove(int count) {
        List<String> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String user = redisTemplate.opsForList().rightPop(MATCH_QUEUE_KEY);
            if (user != null) users.add(user);
        }
        return users;
    }
}
