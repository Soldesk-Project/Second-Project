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

    @Scheduled(fixedDelay = 2000) // 2초마다 체크
    public void checkMatchQueue() {
        Long size = matchService.queueSize();
        if (size != null && size >= 4) {
            List<String> users = matchService.dequeue(4);
            for (String userId : users) {
                messagingTemplate.convertAndSendToUser(userId, "/queue/match", "ACCEPT_MATCH");
                System.out.println("🔔 수락 알림 전송 → " + userId);
            }
        }
    }
}
