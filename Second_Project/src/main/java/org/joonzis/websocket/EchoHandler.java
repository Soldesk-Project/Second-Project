package org.joonzis.websocket;

import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.TextMessage;

public class EchoHandler extends TextWebSocketHandler {

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String clientMessage = message.getPayload();
        System.out.println("Received: " + clientMessage);
        session.sendMessage(new TextMessage("Echo: " + clientMessage));
    }
}
