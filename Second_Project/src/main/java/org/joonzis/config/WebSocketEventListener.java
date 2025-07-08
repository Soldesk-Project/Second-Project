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
import java.util.Map; // Map 임포트 추가

@Component // Spring Bean으로 등록하여 @EventListener가 동작하도록 합니다.
@RequiredArgsConstructor // Lombok을 사용하여 final 필드를 주입받습니다.
@Slf4j // Lombok을 사용하여 로거를 자동 생성합니다.
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatController chatController; // ChatController를 주입받습니다.

    // 웹소켓 연결 시 이벤트 처리
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        
        // 세션 속성 맵을 안전하게 가져옴
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        String username = null;
        Long userNo = null;

        if (sessionAttributes != null) { // 세션 속성 맵 자체가 null이 아닌지 확인
            username = (String) sessionAttributes.get("username");
            userNo = (Long) sessionAttributes.get("userNo");
        }
        
        // NullPointerException 방지를 위한 안전한 문자열 조합
        String displayUsername = (username != null) ? username : "UnknownUser";
        String displayUserNo = (userNo != null) ? String.valueOf(userNo) : "N/A"; 
        String sessionId = (headerAccessor.getSessionId() != null) ? headerAccessor.getSessionId() : "N/A";

        log.info("User connected: {} (Session ID: {})", 
                 displayUsername + " (No: " + displayUserNo + ")", 
                 sessionId);

        // 서버 채팅방에 연결 메시지 전송 (선택 사항 - 주석 해제 시 Null 처리된 displayUsername/userNo 사용 고려)
        // 예를 들어, 연결 시 메시지를 보낸다면 mSenderNo는 userNo가 null이 아닐 때만 사용해야 합니다.
        // if (username != null && userNo != null) { // username과 userNo가 유효할 때만 입장 메시지 전송
        //     ChatRoomDTO serverConnectMessage = ChatRoomDTO.builder()
        //             .mType(ChatRoomDTO.MessageType.SERVER_JOIN)
        //             .mSender(displayUsername)
        //             .mSenderNo(userNo) 
        //             .mContent(displayUsername + "님이 서버 채팅에 입장하셨습니다.")
        //             .mTimestamp(Instant.now().toEpochMilli())
        //             .build();
        //     messagingTemplate.convertAndSend("/serverChat/public", serverConnectMessage);
        // }
    }

    // 웹소켓 연결 종료 시 이벤트 처리
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        
        // 세션 속성 맵을 안전하게 가져옴
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();

        String username = null;
        Long userNo = null;
        Long gameroomNo = null;

        if (sessionAttributes != null) { // 세션 속성 맵 자체가 null이 아닌지 확인
            userNo = (Long) sessionAttributes.get("userNo");
            username = (String) sessionAttributes.get("username");
            gameroomNo = (Long) sessionAttributes.get("gameroomNo"); // 세션에서 게임룸 번호 가져오기
        }

        // NullPointerException 방지를 위한 안전한 문자열 조합 (disconnect에서도 동일하게 적용)
        String displayUsername = (username != null) ? username : "UnknownUser";
        String displayUserNo = (userNo != null) ? String.valueOf(userNo) : "N/A";
        String sessionId = (headerAccessor.getSessionId() != null) ? headerAccessor.getSessionId() : "N/A";
        String displayGameroomNo = (gameroomNo != null) ? String.valueOf(gameroomNo) : "N/A";


        if (userNo != null) { // userNo가 있을 때만 주요 로직 처리 (로그인한 사용자 대상)
            log.info("User disconnected: {} (Session ID: {})", 
                     displayUsername + " (No: " + displayUserNo + ")",
                     sessionId);

            // 서버 채팅방 퇴장 메시지 전송
            ChatRoomDTO serverLeaveMessage = ChatRoomDTO.builder()
                    .mType(ChatRoomDTO.MessageType.SERVER_LEAVE)
                    .mSender(displayUsername) // Nullable 처리된 값 사용
                    .mSenderNo(userNo) // userNo는 여기서는 null이 아니므로 직접 사용 가능
                    .mContent(displayUsername + "님이 서버 채팅에서 퇴장하셨습니다.")
                    .mTimestamp(Instant.now().toEpochMilli())
                    .build();
            messagingTemplate.convertAndSend("/serverChat/public", serverLeaveMessage);

            // 게임룸에 접속해 있었다면 게임룸 퇴장 메시지 전송 및 로그 저장
            if (gameroomNo != null) {
                ChatRoomDTO gameLeaveMessage = ChatRoomDTO.builder()
                        .mType(ChatRoomDTO.MessageType.GAME_LEAVE)
                        .gameroomNo(gameroomNo)
                        .mSender(displayUsername) // Nullable 처리된 값 사용
                        .mSenderNo(userNo) // userNo는 여기서는 null이 아니므로 직접 사용 가능
                        .mContent(displayUsername + "님이 게임룸 " + displayGameroomNo + "에서 퇴장하셨습니다.")
                        .mTimestamp(Instant.now().toEpochMilli())
                        .build();
                messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, gameLeaveMessage);
                
                log.info("User {} disconnected from game room {}", 
                         displayUsername + " (No: " + displayUserNo + ")", // 안전하게 조합된 문자열 사용
                         displayGameroomNo);

                // 핵심: 게임룸 로그 저장 메서드 호출
                chatController.saveGameChatLogs(gameroomNo);
            }
        } else {
            // userNo가 null인 경우 (로그인 없이 웹소켓 연결 시도, 비정상 종료 등)
            log.warn("Disconnected session with no userNo. Session ID: {}. Possibly an anonymous or unauthenticated user.", sessionId);
        }
    }
}