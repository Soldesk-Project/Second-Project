package org.joonzis.websocket;

import java.util.Map;
import java.util.Set;
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

    // userId → Set of WebSocketSession
    private static final Map<String, Set<WebSocketSession>> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        System.out.println("🌐 [연결 URI]: " + query);

        String userId = extractUserId(session);
        System.out.println("🌐 [추출된 userId]: " + userId);

        if (userId == null) {
            System.out.println("⚠️ 연결 시 userId 누락");
            return;
        }

        // 기존 세션 정리
        Set<WebSocketSession> sessions = sessionMap.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet());
        sessions.removeIf(s -> !s.isOpen() || s.getId().equals(session.getId()));

        // 새 세션 추가
        sessions.add(session);
        session.getAttributes().put("userId", userId);

        System.out.println("🔌 [연결됨] userId: " + userId + ", sessionId: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("📩 [받은 메시지]: " + payload);

        JsonNode node = objectMapper.readTree(payload);
        String action = node.get("action").asText();
        String userId = node.get("userId").asText();  // 공통적으로 사용됨

        // 세션 갱신 (공통)
        session.getAttributes().put("userId", userId);
        Set<WebSocketSession> sessions = sessionMap.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet());
        sessions.removeIf(s -> !s.isOpen() || s.getId().equals(session.getId()));
        sessions.add(session);

        switch (action) {
            case "quickMatch":
                matchService.enqueue(userId);
                System.out.println("✅ [매칭 대기열 등록]: " + userId);
                break;

            case "acceptMatch":
                matchService.acceptMatch(userId);
                System.out.println("✅ [수락 처리]: " + userId);
                break;

            case "rejectMatch":
                matchService.rejectMatch(userId);
                System.out.println("❌ [거절 처리]: " + userId);
                break;
                
            case "cancelMatch":
            	matchService.cancelMatch(userId);
            	System.out.println("매칭 취소:" + userId);
            	break;
            
            case "timeOut":
            	matchService.timeOut(userId);
            	System.out.println("타임아웃:" + userId);

            default:
                System.out.println("⚠️ 알 수 없는 액션: " + action);
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
                    System.out.println("📤 전송됨 → " + userId + ", sessionId: " + session.getId());
                } else {
                    System.out.println("❌ 세션 닫힘 → " + session.getId());
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
                if (sessions.isEmpty()) {
                    sessionMap.remove(userId);
                }
                System.out.println("❎ 연결 해제됨 → " + userId + ", sessionId: " + session.getId());
            }
        }
    }

    private String extractUserId(WebSocketSession session) {
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