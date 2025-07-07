package org.joonzis.websocket;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.joonzis.service.match.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
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

    // userId → WebSocketSession (단일 세션 유지)
    private static final Map<String, WebSocketSession> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = extractUserId(session);
        if (userId == null) {
            System.out.println("⚠️ 연결 시 userId 누락");
            return;
        }

        // 기존 세션이 존재하면 닫기
        WebSocketSession existingSession = sessionMap.get(userId);
        if (existingSession != null && existingSession.isOpen()) {
            try {
                existingSession.close();
                System.out.println("🔁 기존 세션 종료: " + existingSession.getId());
            } catch (Exception e) {
                System.err.println("❌ 기존 세션 종료 실패: " + e.getMessage());
            }
        }

        sessionMap.put(userId, session);
        session.getAttributes().put("userId", userId);

        System.out.println("🔌 [연결됨] userId: " + userId + ", sessionId: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("📩 [받은 메시지]: " + payload);

        JsonNode node = objectMapper.readTree(payload);
        String action = node.get("action").asText();

        if ("quickMatch".equals(action)) {
            String userId = node.get("userId").asText();

            // 세션 등록 갱신
            session.getAttributes().put("userId", userId);
            sessionMap.put(userId, session);

            matchService.enqueue(userId);
            System.out.println("✅ [매칭 대기열 등록]: " + userId);
        }
    }

    public void sendToUser(String userId, Object messageObject) {
        WebSocketSession session = sessionMap.get(userId);
        if (session == null || !session.isOpen()) {
            System.out.println("⚠️ 세션 없음 또는 닫힘 → " + userId);
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(messageObject);
            session.sendMessage(new TextMessage(json));
            System.out.println("📤 [전송 완료 → " + userId + "] sessionId: " + session.getId());
        } catch (Exception e) {
            System.err.println("❌ 전송 실패: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userId = (String) session.getAttributes().get("userId");
        if (userId != null) {
            WebSocketSession currentSession = sessionMap.get(userId);
            if (currentSession != null && currentSession.getId().equals(session.getId())) {
                sessionMap.remove(userId);
                System.out.println("❎ 연결 해제됨 → " + userId + ", sessionId: " + session.getId());
            }
        }
    }

    private String extractUserId(WebSocketSession session) {
        // ?userId=xxx 방식에서 추출
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query == null) return null;

        for (String param : query.split("&")) {
            String[] parts = param.split("=");
            if (parts.length == 2 && parts[0].equals("userId")) {
                return parts[1];
            }
        }
        return null;
    }
}
