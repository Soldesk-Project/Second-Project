package org.joonzis.service.match;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MatchScheduler {

    @Autowired
    private MatchService matchService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedDelay = 2000) // 2초마다 주기적으로 큐 확인
    public void scheduledCheck() {
        System.out.println("🕒 [Scheduler] 큐 점검 중...");
        checkMatchQueue(); // 수동 호출과 동일 메서드 사용
    }

    public void checkMatchQueue() {
        Long size = matchService.queueSize();
        System.out.println("⏱️ 현재 큐 사이즈: " + size);

        if (size != null && size >= 4) {
            processMatchingIfPossible();
        } else {
            System.out.println("⛔ 큐 사이즈 부족, dequeue 건너뜀");
        }
    }

    private void processMatchingIfPossible() {
        System.out.println("✅ 큐 사이즈가 4 이상이므로 dequeue 시도");
        List<String> users = matchService.dequeue(4);
        System.out.println("🎯 dequeue 결과: " + users);

        if (users.size() == 4) {
            for (String userId : users) {
                try {
                    messagingTemplate.convertAndSendToUser(userId, "/queue/match", "ACCEPT_MATCH");
                    System.out.println("🔔 수락 알림 전송 → " + userId);
                } catch (Exception e) {
                    System.err.println("❌ 메시지 전송 실패 → " + userId);
                    e.printStackTrace();
                }
            }
        } else {
            System.out.println("⚠️ dequeue로 받은 유저 수 부족. 매칭 보류. 현재 수: " + users.size());
        }
    }
}
