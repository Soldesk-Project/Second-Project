package org.joonzis.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

	@Autowired
    private ServerUserWebSocketHandler serverUserHandler;
	@Autowired
	private GameRoomWebSocketHandler gameRoomHandler;
	@Autowired
	private GameMatchWebSocketHandler gameMatchHandler;
	

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(serverUserHandler, "/ws/server").setAllowedOrigins("*");
        registry.addHandler(gameRoomHandler, "/ws/room").setAllowedOrigins("*");
        registry.addHandler(gameMatchHandler, "/ws/match").setAllowedOrigins("*");
    }
    @Bean
    public GameRoomWebSocketHandler serverWebSocketHandler() {
        return new GameRoomWebSocketHandler();
    }
    @Bean
    public GameMatchWebSocketHandler GameMatchWebSocketHandler() {
        return new GameMatchWebSocketHandler();
    }
    
}
	