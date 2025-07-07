package org.joonzis.service.match;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class MatchService implements ApplicationContextAware {

    private static final String MATCH_QUEUE_KEY = "match-queue";

    @Autowired
    private StringRedisTemplate redisTemplate;

    private MatchScheduler matchScheduler;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.matchScheduler = applicationContext.getBean(MatchScheduler.class);
    }

    public void enqueue(String userId) {
        redisTemplate.opsForList().leftPush(MATCH_QUEUE_KEY, userId);
        System.out.println("✅ 큐에 추가됨 → " + userId);

        Long size = redisTemplate.opsForList().size(MATCH_QUEUE_KEY);
        System.out.println("📦 현재 큐 사이즈: " + size);

        if (size != null && size >= 4) {
            System.out.println("🚀 즉시 매칭 시도 (enqueue에서)");
            if (matchScheduler != null) {
                matchScheduler.checkMatchQueue();
            } else {
                System.err.println("❌ matchScheduler가 아직 주입되지 않았습니다.");
            }
        }
    }
    
    public List<String> dequeue(int count) {
        Long size = redisTemplate.opsForList().size(MATCH_QUEUE_KEY);
        if (size == null || size < count) {
            System.out.println("❗ 큐 크기 부족: " + size);
            return new ArrayList<>();
        }

        List<String> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String userId = redisTemplate.opsForList().rightPop(MATCH_QUEUE_KEY);
            if (userId != null) {
                users.add(userId);
            } else {
                break;
            }
        }

        if (users.size() == count) {
            return users;
        } else {
            // 롤백 처리
            for (String userId : users) {
                redisTemplate.opsForList().rightPush(MATCH_QUEUE_KEY, userId);
            }
            System.out.println("❌ 매칭 인원 부족 → 롤백 수행");
            return new ArrayList<>();
        }
    }
    
    public Long queueSize() {
        return redisTemplate.opsForList().size(MATCH_QUEUE_KEY);
    }
}
