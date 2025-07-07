package org.joonzis.websocket;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.joonzis.service.match.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class GameMatchWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private MatchService matchService;

    // 연결된 사용자 세션을 저장
    private final Map<String, WebSocketSession> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("🔌 [매칭소켓 연결됨] sessionId: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("📩 [받은 메시지]: " + payload);

        JsonNode node = objectMapper.readTree(payload);
        String action = node.get("action").asText();

        if ("quickMatch".equals(action)) {
            String userId = node.get("userId").asText();
            sessionMap.put(userId, session); // 세션 저장
            matchService.enqueue(userId);    // 큐에 추가
            System.out.println("✅ [매칭 대기열 등록]: " + userId);
        }
    }

    // 특정 유저에게 메시지 전송
    public void sendToUser(String userId, Object messageObject) {
        WebSocketSession session = sessionMap.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(messageObject);
                session.sendMessage(new TextMessage(json));
                System.out.println("📤 [전송 → " + userId + "]: " + json);
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            System.out.println("⚠️ 세션이 없거나 닫혀 있음 → " + userId);
        }
    }
}
