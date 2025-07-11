package org.joonzis.controller;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.joonzis.domain.ChatRoomDTO;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    // 현재 활성화된 사용자 세션을 user_no를 기반으로 관리하는 맵 (귓속말 라우팅에 사용될 수 있습니다)
    // key: user_no (Long), value: WebSocket Session ID (String)
    private static final Map<Long, String> activeSessions = new ConcurrentHashMap<>();
    
    private final Queue<ChatRoomDTO> serverChatLogQueue = new ConcurrentLinkedQueue<>();
    private final Map<Long, Queue<ChatRoomDTO>> gameChatLogQueues = new ConcurrentHashMap<>();
    private static final String LOG_BASE_DIR = "./chat_logs/";

    // --- 1. 서버 채팅 처리
    // 서버 일반 채팅 메시지 처리
    @MessageMapping("/serverChat.sendMessage") // 클라이언트에서 /app/serverChat.sendMessage 로 메시지 전송
    public void serverSendMessage(@Payload ChatRoomDTO chatMessage) {
//    	log.info("Received server chat message from sender (No: {}), nick {}: {}",
//                new Object[]{chatMessage.getMSenderNo(), chatMessage.getMSender(), chatMessage.getMContent()});
//        
        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_CHAT); // 메시지 타입 명확히 설정
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        serverChatLogQueue.offer(chatMessage); // 큐에 메시지 추가
        
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
            //log.warn("Session attributes are null for serverAddUser operation. User: {}", username);
        }

        String sessionId = headerAccessor.getSessionId();
        if (userNo != null && sessionId != null) {
            activeSessions.put(userNo, sessionId); // activeSessions 맵에 사용자 정보 추가
            //log.info("User joined server chat: {} (No: {}) with session ID: {}", new Object[]{username, userNo, sessionId});
        } else {
        	//log.warn("Failed to add user session for sender: {}. userNo: {}, sessionId: {}", new Object[]{username, userNo, sessionId});
        }

        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_JOIN); // 입장 메시지 타입 설정
        chatMessage.setMContent(username != null ? username + "님이 서버 채팅에 입장하셨습니다." : "알 수 없는 사용자님이 입장하셨습니다.");
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        serverChatLogQueue.offer(chatMessage);
        
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
        //log.info("User left server chat: {} (No: {})", username, userNo);

        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_LEAVE);
        chatMessage.setMContent(username != null ? username + "님이 서버 채팅에서 퇴장하셨습니다." : "알 수 없는 사용자님이 퇴장하셨습니다.");
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        serverChatLogQueue.offer(chatMessage);
        
        messagingTemplate.convertAndSend("/serverChat/public", chatMessage);
    }


    // --- 2. 게임룸 채팅 처리 ---

    // 게임룸 일반 채팅 메시지 처리
    @MessageMapping("/gameChat.sendMessage/{gameroomNo}") // gameroomNo를 @DestinationVariable로 받음
    public void gameSendMessage(@Payload ChatRoomDTO chatMessage, @DestinationVariable Long gameroomNo) {
    	//log.info("Received game chat message from sender (No: {}), nick {} in room {}: {}",
               // new Object[]{chatMessage.getMSenderNo(), chatMessage.getMSender(), gameroomNo, chatMessage.getMContent()});
        
        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_CHAT); // 메시지 타입 명확히 설정
        chatMessage.setGameroomNo(gameroomNo); // DTO에 gameroomNo 설정
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        gameChatLogQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>()).offer(chatMessage);
        
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
            //log.warn("Session attributes are null for gameAddUser operation. User: {}", username);
        }

        // activeSessions 맵은 전체 서버 세션 관리용으로 유지하고, 게임룸 입장/퇴장 시에는 별도의 게임룸 멤버 관리 로직이 필요할 수 있습니다.
        // 여기서는 메시지 전송 로직에 집중합니다.

        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_JOIN); // 입장 메시지 타입 설정
        chatMessage.setGameroomNo(gameroomNo); // DTO에 gameroomNo 설정
        chatMessage.setMContent(username != null ? username + "님이 게임룸 " + gameroomNo + "에 입장하셨습니다." : "알 수 없는 사용자님이 입장하셨습니다.");
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        gameChatLogQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>()).offer(chatMessage);
        
        // 해당 게임룸의 /gameChat/{gameroomNo} 목적지로 브로드캐스트
        messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatMessage);
       // log.info("User joined game chat: {} (No: {}) in room {}", new Object[]{username, userNo, gameroomNo});
    }

    // 게임룸 채팅방 퇴장 메시지 처리
    @MessageMapping("/gameChat.leaveUser/{gameroomNo}")
    public void gameLeaveUser(@Payload ChatRoomDTO chatMessage, @DestinationVariable Long gameroomNo) {
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_LEAVE);
        chatMessage.setGameroomNo(gameroomNo);
        chatMessage.setMContent(username != null ? username + "님이 게임룸 " + gameroomNo + "에서 퇴장하셨습니다." : "알 수 없는 사용자님이 퇴장하셨습니다.");
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        gameChatLogQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>()).offer(chatMessage);
        
        messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatMessage);
       // log.info("User left game chat: {} (No: {}) from room {}", new Object[]{username, userNo, gameroomNo});
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

//        log.info("Received whisper from {} (No: {}). To {} (No: {}). Content: {}",
//                new Object[]{senderNick, senderNo, receiverNick, receiverNo, content});

        chatMessage.setMType(ChatRoomDTO.MessageType.WHISPER_CHAT); // 메시지 타입 명확히 설정
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());

        // 귓속말 수신자에게 메시지 전송
        if (receiverNo != null) {
            messagingTemplate.convertAndSendToUser(String.valueOf(receiverNo), "/queue/messages", chatMessage);
            //log.info("Whisper sent to receiver userNo: {}", receiverNo);
        } else {
           // log.warn("Cannot send whisper: receiverNo is null for content: {}", content);
        }

        // 보낸 사람 본인에게도 귓속말 내용을 보여주기 위해 다시 보냄
        if (senderNo != null) {
            messagingTemplate.convertAndSendToUser(String.valueOf(senderNo), "/queue/messages", chatMessage);
            //log.info("Whisper sent back to sender userNo: {}", senderNo);
        }
    }
    
 // --- 새로 추가된 부분: 로그 저장 메서드 및 스케줄러/종료 훅 ---

    // 1시간마다 서버 채팅 로그를 파일에 저장
    // fixedRate = 3600000 (1시간 = 3600초 * 1000밀리초)
    // @Scheduled 어노테이션을 사용하려면 Spring Boot 메인 클래스에 @EnableScheduling 어노테이션을 추가해야 합니다.
    @Scheduled(fixedRate = 3600000)
    public void saveServerChatLogsScheduled() {
        saveChatLogsToFile(serverChatLogQueue, "server_chat");
    }

    // 게임방 채팅 로그를 파일에 저장하는 메서드
    // 이 메서드는 WebSocketEventListener에서 게임방 세션 종료 시 호출될 수 있도록 설계합니다.
    public void saveGameChatLogs(Long gameroomNo) {
        Queue<ChatRoomDTO> roomQueue = gameChatLogQueues.get(gameroomNo);
        if (roomQueue != null) { // 큐가 존재할 경우에만 저장 시도
            saveChatLogsToFile(roomQueue, "game_chat_" + gameroomNo);
            gameChatLogQueues.remove(gameroomNo); // 저장 후 해당 게임방 큐 제거
        }
    }

    // 모든 채팅 로그를 파일에 저장하는 공통 메서드
    private void saveChatLogsToFile(Queue<ChatRoomDTO> logQueue, String prefix) {
        if (logQueue.isEmpty()) {
            return; // 큐가 비어있으면 저장할 내용이 없음
        }

        // 로그 파일 디렉토리 생성
        java.io.File logDir = new java.io.File(LOG_BASE_DIR);
        if (!logDir.exists()) {
            logDir.mkdirs(); // 디렉토리가 없으면 생성
        }

        String fileName = prefix + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".log";
        String filePath = LOG_BASE_DIR + fileName;

        try (PrintWriter writer = new PrintWriter(new FileWriter(filePath, true))) { // true: append 모드
            ChatRoomDTO message;
            while ((message = logQueue.poll()) != null) { // 큐에서 하나씩 꺼내면서 파일에 씀 (poll은 큐에서 제거)
                // ChatRoomDTO의 내용을 JSON 형식으로 변환하거나, toString()을 오버라이드하여 원하는 형식으로 출력
                writer.println(message.toString());
            }
            log.info("Chat logs saved to: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to save chat logs to file {}: {}", filePath, e.getMessage());
        }
    }

    // 서버 시작 시 (선택 사항: 이전 로그 파일 정리 등)
    @PostConstruct
    public void init() {
        log.info("ChatController initialized. Log directory: {}", new java.io.File(LOG_BASE_DIR).getAbsolutePath());
        // 필요하다면 여기서 이전 로그 파일 정리 로직 등을 추가할 수 있습니다.
    }

    // 서버 종료 시 남아있는 모든 로그 저장
    @PreDestroy
    public void onServerShutdown() {
        log.info("Server is shutting down. Saving remaining chat logs...");

        // 1. 서버 전체 채팅 로그 저장
        saveChatLogsToFile(serverChatLogQueue, "server_chat_final");

        // 2. 모든 게임방 채팅 로그 저장
        for (Long gameroomNo : gameChatLogQueues.keySet()) {
            saveGameChatLogs(gameroomNo); // 각 게임방의 큐를 비우면서 저장
        }
        log.info("All remaining chat logs saved during shutdown.");
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