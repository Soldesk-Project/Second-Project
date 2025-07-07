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
        // ✅ 중복 유저 체크
        List<String> existing = redisTemplate.opsForList().range(MATCH_QUEUE_KEY, 0, -1);
		/*
		 * if (existing != null && existing.contains(userId)) {
		 * System.out.println("⚠️ 이미 큐에 존재 → " + userId); return; }
		 */

        redisTemplate.opsForList().leftPush(MATCH_QUEUE_KEY, userId);
        System.out.println("✅ 큐에 추가됨 → " + userId);

        // ❌ 즉시 매칭 제거 → 스케줄러가 주기적으로 매칭하도록 변경
        // Long size = redisTemplate.opsForList().size(MATCH_QUEUE_KEY);
        // if (size != null && size >= 4 && matchScheduler != null) {
        //     matchScheduler.checkMatchQueue();
        // }
    }

    public List<String> dequeue(int count) {
        System.out.println("📥 [dequeue 진입] 요청 수: " + count);

        Long size = redisTemplate.opsForList().size(MATCH_QUEUE_KEY);
        List<String> current = redisTemplate.opsForList().range(MATCH_QUEUE_KEY, 0, -1);
        System.out.println("📦 현재 큐 상태: " + current);

        if (size == null || size < count) {
            System.out.println("❗ 큐 크기 부족: " + size);
            return new ArrayList<>();
        }

        List<String> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String userId = redisTemplate.opsForList().rightPop(MATCH_QUEUE_KEY);
            System.out.println("🔽 pop된 유저: " + userId);
            if (userId != null) {
                users.add(userId);
            } else {
                break;
            }
        }

        System.out.println("🧪 최종 pop 결과: " + users);

        if (users.size() == count) {
            return users;
        } else {
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
