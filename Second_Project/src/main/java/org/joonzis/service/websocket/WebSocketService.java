package org.joonzis.service.websocket;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void notifyMatched(List<String> userIds) {
        for (String userId : userIds) {
            messagingTemplate.convertAndSendToUser(userId, "/queue/match", "MATCH_FOUND");
            System.out.println("📩 매칭 메시지 전송: " + userId);
        }
    }
}
