package org.joonzis.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // STOMP 메시지 브로커를 활성화
public class StompWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        //    - "/serverChat": 서버 전체 공용 채팅을 위한 목적지
        //    - "/gameChat": 게임룸 내 채팅을 위한 목적지 (각 게임룸 ID에 따라 구분될 것임)
        //    - "/user": 귓속말 또는 특정 사용자에게 알림을 보낼 때 사용 (내부적으로 '/user/{sessionId}/queue' 형태)
        config.enableSimpleBroker("/serverChat", "/gameChat", "/user");

        // "/app"으로 시작하는 메시지는 @MessageMapping 어노테이션이 달린 컨트롤러 메서드로 라우팅
        config.setApplicationDestinationPrefixes("/app");
        
        // 유저에게 빠른 매칭 알람 등을 전송할 때 사용하는 목적지 접두사
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 기본 채팅 WebSocket 엔드포인트
        registry.addEndpoint("/ws-chat")
                .setAllowedOrigins("http://localhost:3000") // 클라이언트 도메인 설정
                .withSockJS();
        
        // 빠른 매칭 관련 WebSocket 엔드포인트 (기존 유지)
        registry.addEndpoint("/ws-match")
                .setAllowedOrigins("*") // 보안상 특정 Origin 지정 권장
                .setHandshakeHandler(new GameMatchWebSocketHandler()) // 기존 핸들러 유지
                .withSockJS();
    }
}