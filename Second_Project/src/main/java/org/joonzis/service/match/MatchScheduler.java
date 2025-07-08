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
    private GameMatchWebSocketHandler gameMatchHandler;

    @Scheduled(fixedDelay = 2000)
    public void checkMatchQueue() {
        System.out.println("🕒 [Scheduler] 큐 점검 중...");

        Long size = matchService.queueSize();
        System.out.println("⏱️ 현재 큐 사이즈: " + size);

        if (size != null && size >= 2) {
            List<String> users = matchService.peekAndRemove(2);
            System.out.println("🎯 매칭 대상 → " + users);

            for (String userId : users) {
                System.out.println("🔔 수락 알림 전송 → " + userId);
                gameMatchHandler.sendToUser(userId, Map.of("type", "ACCEPT_MATCH"));
            }
        }
    }
}
