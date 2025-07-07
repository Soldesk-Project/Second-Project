package org.joonzis.websocket;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentSkipListSet;

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

    // userId → session set
    private final Map<String, Set<WebSocketSession>> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = extractUserId(session);
        if (userId == null) {
            System.out.println("⚠️ 연결 시 userId 누락");
            return;
        }

        session.getAttributes().put("userId", userId);
        sessionMap.computeIfAbsent(userId, k -> new ConcurrentSkipListSet<>((a, b) -> a.getId().compareTo(b.getId())))
                  .add(session);

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

            session.getAttributes().put("userId", userId);
            sessionMap.computeIfAbsent(userId, k -> new ConcurrentSkipListSet<>((a, b) -> a.getId().compareTo(b.getId())))
                      .add(session);

            matchService.enqueue(userId);
            System.out.println("✅ [매칭 대기열 등록]: " + userId);

            Long size = matchService.queueSize();  // ✅ 현재 큐 사이즈 확인
            System.out.println("📏 현재 매칭 큐 사이즈: " + size);

            if (size != null && size >= 4) {
                // 직접 dequeue 실행
                List<String> matchedUsers = matchService.dequeue(4);
                System.out.println("🎯 즉시 매칭 대상 → " + matchedUsers);

                for (String uid : matchedUsers) {
                    sendToUser(uid, Map.of("type", "ACCEPT_MATCH"));
                }
            }
        }
    }

    public void sendToUser(String userId, Object messageObject) {
        Set<WebSocketSession> sessions = sessionMap.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            System.out.println("⚠️ 세션 없음 → " + userId);
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(messageObject);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                    System.out.println("📤 [전송 완료 → " + userId + "] sessionId: " + session.getId());
                } else {
                    System.out.println("⚠️ 닫힌 세션 → " + session.getId());
                }
            }
        } catch (Exception e) {
            System.err.println("❌ 전송 실패: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String userId = (String) session.getAttributes().get("userId");
        if (userId != null) {
            Set<WebSocketSession> sessions = sessionMap.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                System.out.println("❎ 연결 해제됨 → " + userId + ", sessionId: " + session.getId());
                if (sessions.isEmpty()) {
                    sessionMap.remove(userId);
                }
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
