package org.joonzis.websocket;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

public class GameMatchWebSocketHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {

        String query = request.getURI().getQuery(); // ?userId=abc123
        String userId = (query != null && query.contains("userId="))
            ? query.split("userId=")[1]
            : "unknown";

        System.out.println("🔐 WebSocket 연결 사용자: " + userId);
        return () -> userId;
    }
}
