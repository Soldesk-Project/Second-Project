package org.joonzis.config;

import org.joonzis.controller.ChatController; // ChatController 임포트
import org.joonzis.domain.ChatRoomDTO; // ChatRoomDTO 임포트
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant; // Instant 임포트

@Component // Spring Bean으로 등록하여 @EventListener가 동작하도록 합니다.
@RequiredArgsConstructor // Lombok을 사용하여 final 필드를 주입받습니다.
@Slf4j // Lombok을 사용하여 로거를 자동 생성합니다.
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatController chatController; // ChatController를 주입받습니다.

    // 웹소켓 연결 시 이벤트 처리 (선택 사항, 필요에 따라 구현)
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        Long userNo = (Long) headerAccessor.getSessionAttributes().get("userNo");
        log.info("User connected: {} (Session ID: {})", 
                username + " (No: " + userNo + ")",
                headerAccessor.getSessionId());

        // 서버 채팅방에 연결 메시지 전송 (선택 사항)
        // ChatRoomDTO serverConnectMessage = ChatRoomDTO.builder()
        //         .mType(ChatRoomDTO.MessageType.SERVER_JOIN)
        //         .mSender(username)
        //         .mSenderNo(userNo)
        //         .mContent(username + "님이 서버 채팅에 입장하셨습니다.")
        //         .mTimestamp(Instant.now().toEpochMilli())
        //         .build();
        // messagingTemplate.convertAndSend("/serverChat/public", serverConnectMessage);
    }

    // 웹소켓 연결 종료 시 이벤트 처리
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        Long userNo = (Long) headerAccessor.getSessionAttributes().get("userNo");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        Long gameroomNo = (Long) headerAccessor.getSessionAttributes().get("gameroomNo"); // 세션에서 게임룸 번호 가져오기

        if (userNo != null) {
        	log.info("User disconnected: {} (Session ID: {})", 
                    username + " (No: " + userNo + ")",
                    headerAccessor.getSessionId());

            // 서버 채팅방 퇴장 메시지 전송
            ChatRoomDTO serverLeaveMessage = ChatRoomDTO.builder()
                    .mType(ChatRoomDTO.MessageType.SERVER_LEAVE)
                    .mSender(username)
                    .mSenderNo(userNo)
                    .mContent(username + "님이 서버 채팅에서 퇴장하셨습니다.")
                    .mTimestamp(Instant.now().toEpochMilli())
                    .build();
            messagingTemplate.convertAndSend("/serverChat/public", serverLeaveMessage);

            // 게임룸에 접속해 있었다면 게임룸 퇴장 메시지 전송 및 로그 저장
            if (gameroomNo != null) {
                ChatRoomDTO gameLeaveMessage = ChatRoomDTO.builder()
                        .mType(ChatRoomDTO.MessageType.GAME_LEAVE)
                        .gameroomNo(gameroomNo)
                        .mSender(username)
                        .mSenderNo(userNo)
                        .mContent(username + "님이 게임룸 " + gameroomNo + "에서 퇴장하셨습니다.")
                        .mTimestamp(Instant.now().toEpochMilli())
                        .build();
                messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, gameLeaveMessage);
                log.info("User {} disconnected from game room {}", 
                        username + " (No: " + userNo + ")",
                        gameroomNo);

                // 핵심: 게임룸 로그 저장 메서드 호출
                chatController.saveGameChatLogs(gameroomNo);
            }
        }
    }
}