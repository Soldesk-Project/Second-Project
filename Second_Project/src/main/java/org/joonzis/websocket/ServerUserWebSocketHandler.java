package org.joonzis.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ServerUserWebSocketHandler extends TextWebSocketHandler {

    // 서버 ID -> (세션 -> 유저ID) 매핑
    private final Map<String, Map<WebSocketSession, String>> serverSessions = new ConcurrentHashMap<>();

    @Autowired
    private ObjectMapper objectMapper; // Jackson 사용

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();

        // ✅ JSON을 안전하게 파싱
        Map<String, String> data = objectMapper.readValue(payload, Map.class);

        String action = data.get("action");
        String server = data.get("server");
        String userId = data.get("userId");

        if ("join".equals(action) && server != null && userId != null) {
            // 1) 기존 세션 제거
            removeSessionFromAllServers(session);

            // 2) 새 서버에 세션 추가
            serverSessions.putIfAbsent(server, new ConcurrentHashMap<>());
            serverSessions.get(server).put(session, userId);

            // 3) 해당 서버에 접속한 유저 목록 전송
            broadcastUserList(server);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        removeSessionFromAllServers(session);
    }

    private void removeSessionFromAllServers(WebSocketSession session) throws Exception {
        for (Map.Entry<String, Map<WebSocketSession, String>> entry : serverSessions.entrySet()) {
            String server = entry.getKey();
            Map<WebSocketSession, String> sessions = entry.getValue();

            if (sessions.remove(session) != null) {
                broadcastUserList(server);
            }
        }
    }

    private void broadcastUserList(String server) throws Exception {
        Map<WebSocketSession, String> sessions = serverSessions.get(server);
        if (sessions == null) return;

        List<String> userList = new ArrayList<>(sessions.values());

        // 응답 JSON 생성
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "userList");
        payload.put("server", server);
        payload.put("users", userList);

        String json = objectMapper.writeValueAsString(payload);
        TextMessage msg = new TextMessage(json);

        // 모든 세션에 전송
        for (WebSocketSession sess : sessions.keySet()) {
            if (sess.isOpen()) {
                sess.sendMessage(msg);
            }
        }
    }
}
