package org.joonzis.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class UserBanWebSocketHandler extends TextWebSocketHandler {
	private static final Map<Integer, WebSocketSession> userSessions = new ConcurrentHashMap<>();
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
	    super.afterConnectionEstablished(session);
	    Integer userNo = (Integer) session.getAttributes().get("userNo");
	    if (userNo != null) {
	        userSessions.put(userNo, session);
	    }
	}
	
	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {

	}
	
	public void handleUserBan(int userNo) throws IOException {
        WebSocketSession targetSession = userSessions.get(userNo);

        if (targetSession != null && targetSession.isOpen()) {
            String banMsg = objectMapper.writeValueAsString(
                Map.of("action", "banned", "message", "관리자에 의해 계정이 정지되었습니다.")
            );

            targetSession.sendMessage(new TextMessage(banMsg)); // 메시지 전송
            targetSession.close(CloseStatus.NORMAL); // 연결 종료
            userSessions.remove(userNo);

        } else {
            System.out.println("No active session found for user: " + userNo);
        }
    }
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		// TODO Auto-generated method stub
		super.afterConnectionClosed(session, status);
	}
	
	
}
