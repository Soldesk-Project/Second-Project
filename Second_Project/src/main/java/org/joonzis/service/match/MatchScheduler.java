package org.joonzis.service.match;

import java.util.List;
import java.util.Map;

import org.joonzis.websocket.GameMatchWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MatchScheduler {

    @Autowired
    private MatchService matchService;

    @Autowired
    private GameMatchWebSocketHandler gameMatchWebSocketHandler;

    @Scheduled(fixedDelay = 5000)
    public void scheduledCheck() {
        System.out.println("🕒 [Scheduler] 큐 점검 중...");
        checkMatchQueue();
    }

    public void checkMatchQueue() {
        Long size = matchService.queueSize();
        System.out.println("⏱️ 현재 큐 사이즈: " + size);

        if (size != null && size >= 4) {
            processMatchingIfPossible();
        }
    }

    private void processMatchingIfPossible() {
        List<String> users = matchService.dequeue(4);
        System.out.println("🎯 dequeue 결과: " + users);

        if (users.size() == 4) {
            for (String userId : users) {
                gameMatchWebSocketHandler.sendToUser(userId, Map.of("type", "ACCEPT_MATCH"));
                System.out.println("🔔 수락 알림 전송 → " + userId);
            }
        }
    }
}
