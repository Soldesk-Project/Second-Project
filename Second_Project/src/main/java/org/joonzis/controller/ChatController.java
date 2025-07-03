package org.joonzis.controller;

import org.joonzis.domain.ChatRoomDTO; // ChatRoomDTO는 ChatMessageDTO로 이름을 변경하는 것이 의미상 더 좋습니다.
import org.springframework.messaging.handler.annotation.DestinationVariable; // @DestinationVariable 추가
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    // 현재 활성화된 사용자 세션을 user_no를 기반으로 관리하는 맵 (귓속말 라우팅에 사용될 수 있습니다)
    // key: user_no (Long), value: WebSocket Session ID (String)
    private static final Map<Long, String> activeSessions = new ConcurrentHashMap<>();


    // --- 1. 서버 채팅 처리
    // 서버 일반 채팅 메시지 처리
    @MessageMapping("/serverChat.sendMessage") // 클라이언트에서 /app/serverChat.sendMessage 로 메시지 전송
    public void serverSendMessage(@Payload ChatRoomDTO chatMessage) {
    	log.info("Received server chat message from sender (No: {}), nick {}: {}",
                new Object[]{chatMessage.getMSenderNo(), chatMessage.getMSender(), chatMessage.getMContent()});
        
        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_CHAT); // 메시지 타입 명확히 설정
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        // /serverChat/public 목적지로 브로드캐스트
        messagingTemplate.convertAndSend("/serverChat/public", chatMessage);
    }

    // 서버 채팅방 입장 메시지 처리
    @MessageMapping("/serverChat.addUser") // 클라이언트에서 /app/serverChat.addUser 로 메시지 전송
    public void serverAddUser(@Payload ChatRoomDTO chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userNo", userNo);
            headerAccessor.getSessionAttributes().put("username", username);
        } else {
            log.warn("Session attributes are null for serverAddUser operation. User: {}", username);
        }

        String sessionId = headerAccessor.getSessionId();
        if (userNo != null && sessionId != null) {
            activeSessions.put(userNo, sessionId); // activeSessions 맵에 사용자 정보 추가
            log.info("User joined server chat: {} (No: {}) with session ID: {}", new Object[]{username, userNo, sessionId});
        } else {
        	log.warn("Failed to add user session for sender: {}. userNo: {}, sessionId: {}", new Object[]{username, userNo, sessionId});
        }

        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_JOIN); // 입장 메시지 타입 설정
        chatMessage.setMContent(username != null ? username + "님이 서버 채팅에 입장하셨습니다." : "알 수 없는 사용자님이 입장하셨습니다.");
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        // /serverChat/public 목적지로 브로드캐스트
        messagingTemplate.convertAndSend("/serverChat/public", chatMessage);
    }

    // 서버 채팅방 퇴장 메시지 처리 (클라이언트에서 명시적으로 보내거나, WebSocketEventListener에서 처리)
    @MessageMapping("/serverChat.leaveUser")
    public void serverLeaveUser(@Payload ChatRoomDTO chatMessage) {
        // 이 메시지는 클라이언트가 명시적으로 퇴장을 알릴 때 사용될 수 있습니다.
        // 실제로는 WebSocketEventListener에서 세션 종료 시 처리하는 것이 더 일반적입니다.
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        activeSessions.remove(userNo); // activeSessions 맵에서 사용자 제거
        log.info("User left server chat: {} (No: {})", username, userNo);

        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_LEAVE);
        chatMessage.setMContent(username != null ? username + "님이 서버 채팅에서 퇴장하셨습니다." : "알 수 없는 사용자님이 퇴장하셨습니다.");
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        messagingTemplate.convertAndSend("/serverChat/public", chatMessage);
    }


    // --- 2. 게임룸 채팅 처리 ---

    // 게임룸 일반 채팅 메시지 처리
    @MessageMapping("/gameChat.sendMessage/{gameroomNo}") // gameroomNo를 @DestinationVariable로 받음
    public void gameSendMessage(@Payload ChatRoomDTO chatMessage, @DestinationVariable Long gameroomNo) {
    	log.info("Received game chat message from sender (No: {}), nick {} in room {}: {}",
                new Object[]{chatMessage.getMSenderNo(), chatMessage.getMSender(), gameroomNo, chatMessage.getMContent()});
        
        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_CHAT); // 메시지 타입 명확히 설정
        chatMessage.setGameroomNo(gameroomNo); // DTO에 gameroomNo 설정
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        // 해당 게임룸의 /gameChat/{gameroomNo} 목적지로 브로드캐스트
        messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatMessage);
    }

    // 게임룸 채팅방 입장 메시지 처리
    @MessageMapping("/gameChat.addUser/{gameroomNo}") // gameroomNo를 @DestinationVariable로 받음
    public void gameAddUser(@Payload ChatRoomDTO chatMessage, @DestinationVariable Long gameroomNo, SimpMessageHeaderAccessor headerAccessor) {
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userNo", userNo);
            headerAccessor.getSessionAttributes().put("username", username);
            headerAccessor.getSessionAttributes().put("gameroomNo", gameroomNo); // 세션에 현재 게임룸 ID 저장
        } else {
            log.warn("Session attributes are null for gameAddUser operation. User: {}", username);
        }

        // activeSessions 맵은 전체 서버 세션 관리용으로 유지하고, 게임룸 입장/퇴장 시에는 별도의 게임룸 멤버 관리 로직이 필요할 수 있습니다.
        // 여기서는 메시지 전송 로직에 집중합니다.

        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_JOIN); // 입장 메시지 타입 설정
        chatMessage.setGameroomNo(gameroomNo); // DTO에 gameroomNo 설정
        chatMessage.setMContent(username != null ? username + "님이 게임룸 " + gameroomNo + "에 입장하셨습니다." : "알 수 없는 사용자님이 입장하셨습니다.");
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        // 해당 게임룸의 /gameChat/{gameroomNo} 목적지로 브로드캐스트
        messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatMessage);
        log.info("User joined game chat: {} (No: {}) in room {}", new Object[]{username, userNo, gameroomNo});
    }

    // 게임룸 채팅방 퇴장 메시지 처리
    @MessageMapping("/gameChat.leaveUser/{gameroomNo}")
    public void gameLeaveUser(@Payload ChatRoomDTO chatMessage, @DestinationVariable Long gameroomNo) {
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_LEAVE);
        chatMessage.setGameroomNo(gameroomNo);
        chatMessage.setMContent(username != null ? username + "님이 게임룸 " + gameroomNo + "에서 퇴장하셨습니다." : "알 수 없는 사용자님이 퇴장하셨습니다.");
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatMessage);
        log.info("User left game chat: {} (No: {}) from room {}", new Object[]{username, userNo, gameroomNo});
    }


    // --- 3. 귓속말 채팅 처리 (기존 /chat.sendWhisper -> /whisperChat.sendMessage) ---
    // /user/queue로 통일하여 알람과 귓속말 모두 처리합니다.

    @MessageMapping("/whisperChat.sendMessage") // 클라이언트에서 /app/whisperChat.sendMessage 로 메시지 전송
    public void sendWhisperMessage(@Payload ChatRoomDTO chatMessage) {
        String senderNick = chatMessage.getMSender();
        Long senderNo = chatMessage.getMSenderNo(); // 보낸 사람의 userNo
        String receiverNick = chatMessage.getMReceiver();
        Long receiverNo = chatMessage.getMReceiverNo(); // 받는 사람의 userNo
        String content = chatMessage.getMContent();

        log.info("Received whisper from {} (No: {}). To {} (No: {}). Content: {}",
                new Object[]{senderNick, senderNo, receiverNick, receiverNo, content});

        chatMessage.setMType(ChatRoomDTO.MessageType.WHISPER_CHAT); // 메시지 타입 명확히 설정
        chatMessage.setMTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        // 귓속말 수신자에게 메시지 전송
        // Spring의 convertAndSendToUser는 기본적으로 UserPrincipal.getName()을 사용자 식별자로 사용합니다.
        // 현재 코드에서는 DTO의 mReceiver (닉네임) 또는 mReceiverNo (고유 번호) 중 무엇을 사용할지 결정해야 합니다.
        // 일반적으로는 UserPrincipal에 매핑된 고유 식별자(예: userNo 또는 user ID)를 사용합니다.
        // 여기서는 mReceiverNo를 활용하여 라우팅합니다. (실제 시스템에서는 mReceiverNo로 해당 유저의 Principal Name을 찾아야 함)
        if (receiverNo != null) {
            // 이 부분은 receiverNo (DB ID)를 통해 실제 UserPrincipal의 이름을 찾아서 보내야 합니다.
            // 예시: messagingTemplate.convertAndSendToUser(userNoToPrincipalName.get(receiverNo), "/queue/messages", chatMessage);
            // 현재는 userNo를 String으로 변환하여 임시로 사용합니다.
            // 실제 구현에서는 UserPrincipal 관리 로직이 필요합니다.
            messagingTemplate.convertAndSendToUser(String.valueOf(receiverNo), "/queue/messages", chatMessage);
            log.info("Whisper sent to receiver userNo: {}", receiverNo);
        } else {
            log.warn("Cannot send whisper: receiverNo is null for content: {}", content);
        }

        // 보낸 사람 본인에게도 귓속말 내용을 보여주기 위해 다시 보냄
        if (senderNo != null) {
            messagingTemplate.convertAndSendToUser(String.valueOf(senderNo), "/queue/messages", chatMessage);
            log.info("Whisper sent back to sender userNo: {}", senderNo);
        }
    }

    // NOTE: WebSocketEventListener (STOMP 연결/해제 이벤트 처리)
    // Spring WebSocket에서는 클라이언트 연결/해제 시 이벤트를 받을 수 있습니다.
    // @EventListener
    // public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
    //     StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
    //     Long userNo = (Long) headerAccessor.getSessionAttributes().get("userNo");
    //     String username = (String) headerAccessor.getSessionAttributes().get("username");
    //     Long gameroomNo = (Long) headerAccessor.getSessionAttributes().get("gameroomNo"); // 게임룸 정보도 가져올 수 있음
    //
    //     if (userNo != null) {
    //         activeSessions.remove(userNo); // activeSessions 맵에서 제거
    //         log.info("User disconnected: {} (No: {})", username, userNo);
    //
    //         // 서버 채팅 퇴장 메시지 브로드캐스트
    //         ChatRoomDTO leaveMessage = ChatRoomDTO.builder()
    //                 .mType(ChatRoomDTO.MessageType.SERVER_LEAVE)
    //                 .mSender(username)
    //                 .mSenderNo(userNo)
    //                 .mContent(username + "님이 퇴장하셨습니다.")
    //                 .mTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
    //                 .build();
    //         messagingTemplate.convertAndSend("/serverChat/public", leaveMessage);
    //
    //         // 게임룸 채팅 퇴장 메시지 브로드캐스트 (만약 게임룸에 있었다면)
    //         if (gameroomNo != null) {
    //             ChatRoomDTO gameLeaveMessage = ChatRoomDTO.builder()
    //                     .mType(ChatRoomDTO.MessageType.GAME_LEAVE)
    //                     .gameroomNo(gameroomNo)
    //                     .mSender(username)
    //                     .mSenderNo(userNo)
    //                     .mContent(username + "님이 게임룸 " + gameroomNo + "에서 퇴장하셨습니다.")
    //                     .mTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
    //                     .build();
    //             messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, gameLeaveMessage);
    //         }
    //     }
    // }
}