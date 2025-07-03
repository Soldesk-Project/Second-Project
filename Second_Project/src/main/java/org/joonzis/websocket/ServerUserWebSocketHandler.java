package org.joonzis.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.log4j.Log4j;

import org.joonzis.websocket.dto.UserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Log4j
@Component
public class ServerUserWebSocketHandler extends TextWebSocketHandler {

    // 서버 ID -> (세션 -> 유저ID) 매핑
	private final Map<String, Map<WebSocketSession, UserInfo>> serverSessions = new ConcurrentHashMap<>();

    @Autowired
    private ObjectMapper objectMapper; // Jackson 사용

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.info("[Server] 메시지 수신: " + payload);
        // ✅ JSON을 안전하게 파싱
        Map<String, String> data = objectMapper.readValue(payload, new TypeReference<Map<String, String>>() {});
        
        String action = data.get("action");
        String server = data.get("server");
        String userNick = data.get("userNick");
        String userNo = data.get("userNo");
        String bgName = data.get("bgName");
        String blName = data.get("blName");
        String bdName = data.get("bdName");
        String titleName = data.get("titleName");

        if ("join".equals(action) && server != null && userNick != null) {
            // 1) 기존 세션 제거
            removeSessionFromAllServers(session);

            // 2) 새 서버에 세션 추가
            serverSessions.putIfAbsent(server, new ConcurrentHashMap<>());
            serverSessions.get(server).put(session, new UserInfo(userNick, userNo, bgName, blName, bdName, titleName));

            // 3) 해당 서버에 접속한 유저 목록 전송
            broadcastUserList(server);
        }
    }
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("[Server] WebSocket 연결 수립: " + session.getId());
        super.afterConnectionEstablished(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        removeSessionFromAllServers(session);
    }

    private void removeSessionFromAllServers(WebSocketSession session) throws Exception {
    	for (Map.Entry<String, Map<WebSocketSession, UserInfo>> entry : serverSessions.entrySet()) {
            String server = entry.getKey();
            Map<WebSocketSession, UserInfo> sessions = entry.getValue();

            if (sessions.remove(session) != null) {
                broadcastUserList(server);
            }
        }
    }

    private void broadcastUserList(String server) throws Exception {
    	Map<WebSocketSession, UserInfo> sessions = serverSessions.get(server);
        if (sessions == null) return;

        List<Map<String, String>> userList = new ArrayList<>();
        for (UserInfo userInfo : sessions.values()) {
            Map<String, String> userMap = new HashMap<>();
            userMap.put("userNick", userInfo.getUserNick());
            userMap.put("userNo", userInfo.getUserNo());
            userMap.put("bgName", userInfo.getBgName());
            userMap.put("blName", userInfo.getBlName());
            userMap.put("bdName", userInfo.getBdName());
            userMap.put("titleName", userInfo.getTitleName());
            userList.add(userMap);
        }

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
