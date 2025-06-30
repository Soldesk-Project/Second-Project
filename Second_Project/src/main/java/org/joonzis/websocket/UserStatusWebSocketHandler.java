package org.joonzis.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class UserStatusWebSocketHandler extends TextWebSocketHandler {

    // 서버별 접속 유저 목록: 서버번호(String) -> Set<sessionId>
    private final Map<String, Set<WebSocketSession>> serverUsers = new ConcurrentHashMap<>();

    // 클라이언트가 보낸 JSON 예: {"action":"join","server":"1","userId":"user123"}
    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        // JSON 파싱 라이브러리 사용 추천 (Jackson, Gson 등)
        // 간단하게 파싱한다고 가정 (실제는 라이브러리 사용 권장)

        // 여기서는 payload 예시: {"action":"join","server":"1","userId":"user123"}
        Map<String, String> data = parseJsonToMap(payload);

        String action = data.get("action");
        String server = data.get("server");
        String userId = data.get("userId");

        if ("join".equals(action)) {
            serverUsers.putIfAbsent(server, ConcurrentHashMap.newKeySet());
            serverUsers.get(server).add(session);
            broadcastUserList(server);
        } else if ("leave".equals(action)) {
            if (serverUsers.containsKey(server)) {
                serverUsers.get(server).remove(session);
                broadcastUserList(server);
            }
        }
    }

    // 세션 종료 시 자동 처리
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        serverUsers.forEach((server, sessions) -> {
            if (sessions.remove(session)) {
                try {
                    broadcastUserList(server);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    // 해당 서버 접속 유저 목록을 JSON 문자열로 클라이언트에게 전송
    private void broadcastUserList(String server) throws Exception {
        Set<WebSocketSession> sessions = serverUsers.get(server);
        if (sessions == null) return;

        // 예: {"type":"userList","server":"1","users":["user1","user2"]}
        List<String> userIds = new ArrayList<>();
        for (WebSocketSession s : sessions) {
            // 유저ID를 세션 attribute에서 가져오도록 개선 가능
            userIds.add(s.getId()); // 임시로 sessionId 사용
        }
        String json = String.format(
                "{\"type\":\"userList\",\"server\":\"%s\",\"users\":%s}",
                server,
                userIds.toString()
        );

        TextMessage msg = new TextMessage(json);
        for (WebSocketSession s : sessions) {
            s.sendMessage(msg);
        }
    }

    // 간단 JSON 파서(실사용시 Jackson/Gson 쓰세요)
    private Map<String, String> parseJsonToMap(String json) {
        Map<String, String> map = new HashMap<>();
        json = json.trim().replaceAll("[{}\"]", "");
        for (String entry : json.split(",")) {
            String[] kv = entry.split(":");
            if (kv.length == 2) {
                map.put(kv[0].trim(), kv[1].trim());
            }
        }
        return map;
    }
}
