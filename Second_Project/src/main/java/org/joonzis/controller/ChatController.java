package org.joonzis.controller;

import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.joonzis.domain.ChatRoomDTO;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
<<<<<<< Updated upstream
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.Map;
=======
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean; // 이 임포트 추가
>>>>>>> Stashed changes

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

<<<<<<< Updated upstream
    private static final Queue<String> serverChatLogQueue = new ConcurrentLinkedQueue<>();
    private static final ConcurrentHashMap<Long, ConcurrentLinkedQueue<String>> gameChatQueues = new ConcurrentHashMap<>();
    private String logDirectoryPath;

    @PostConstruct
    public void init() {
        logDirectoryPath = System.getProperty("user.dir") + File.separator + "chat_logs";
        File logDir = new File(logDirectoryPath);
        if (!logDir.exists()) {
            logDir.mkdirs();
        }
        System.out.println("INFO : " + getClass().getName() + " - ChatController initialized. Log directory: " + logDirectoryPath);
        System.out.println("INFO : " + getClass().getName() + " - ChatController instance hash code: " + this.hashCode());
    }

    @PreDestroy
    public void onShutdown() {
        System.out.println("INFO : " + getClass().getName() + " - Shutting down. Saving all pending chat logs...");

        // 서버 채팅 로그 저장
        if (!serverChatLogQueue.isEmpty()) {
            saveChatLogsToFile("server_chat_final", serverChatLogQueue);
        } else {
            System.out.println("INFO : " + getClass().getName() + " - No pending server chat messages to save on shutdown.");
        }

        // 모든 게임방 채팅 로그 저장
        for (Map.Entry<Long, ConcurrentLinkedQueue<String>> entry : gameChatQueues.entrySet()) {
            Long gameroomNo = entry.getKey();
            ConcurrentLinkedQueue<String> queue = entry.getValue();
            if (!queue.isEmpty()) {
                saveChatLogsToFile("game_chat_room_" + gameroomNo + "_final", queue);
            } else {
                System.out.println("INFO : " + getClass().getName() + " - No pending game chat messages for room " + gameroomNo + " to save on shutdown.");
            }
        }
        System.out.println("INFO : " + getClass().getName() + " - All pending chat logs saved on shutdown.");
    }
    
    // 서버 공지 메시지 전송 (전체 공통 채팅방용)
    @MessageMapping("/serverChat.sendMessage")
    public void serverSendMessage(ChatRoomDTO chatRoomDTO) {
        // 메시지 큐에 추가
        serverChatLogQueue.offer(chatRoomDTO.getMSender() + ": " + chatRoomDTO.getMContent());
        
        // STOMP를 통해 구독자에게 메시지 전송
        simpMessagingTemplate.convertAndSend("/serverChat/public", chatRoomDTO);
    }
    
    // 귓속말 메시지 전송 (개인 채팅)
    @MessageMapping("/whisperChat.sendMessage")
    public void sendWhisperMessage(ChatRoomDTO chatRoomDTO) {
        // 귓속말은 파일에 저장하지 않는다고 가정. 필요시 별도 큐 사용
        // simpMessagingTemplate.convertAndSendToUser(chatRoomDTO.getMReceiver(), "/queue/private", chatRoomDTO);
        simpMessagingTemplate.convertAndSendToUser(chatRoomDTO.getMReceiver(), "/private", chatRoomDTO);
        simpMessagingTemplate.convertAndSendToUser(chatRoomDTO.getMSender(), "/private", chatRoomDTO);
    }

 // 게임 채팅방 메시지 전송
    @MessageMapping("/gameChat.sendMessage/{gameroomNo}")
    public void gameSendMessage(ChatRoomDTO chatRoomDTO, @org.springframework.web.bind.annotation.PathVariable("gameroomNo") Long gameroomNo) {
        // 해당 게임방의 큐를 가져오거나 없으면 새로 생성
        ConcurrentLinkedQueue<String> queue = gameChatQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        String logMessage = "[게임방 " + gameroomNo + "] " + chatRoomDTO.getMSender() + ": " + chatRoomDTO.getMContent();
        queue.offer(logMessage); // 해당 게임방 큐에 추가
        simpMessagingTemplate.convertAndSend("/topic/game/" + gameroomNo, chatRoomDTO);
    }

    // 게임 채팅방 입장
    @MessageMapping("/gameChat.addUser/{gameroomNo}")
    public void gameAddUser(ChatRoomDTO chatRoomDTO, @org.springframework.web.bind.annotation.PathVariable("gameroomNo") Long gameroomNo, SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", chatRoomDTO.getMSender());
        headerAccessor.getSessionAttributes().put("gameroomNo", gameroomNo);
        // 해당 게임방의 큐를 가져오거나 없으면 새로 생성
        ConcurrentLinkedQueue<String> queue = gameChatQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        String logMessage = "[게임방 " + gameroomNo + "] " + chatRoomDTO.getMSender() + "님이 입장했습니다.";
        queue.offer(logMessage); // 해당 게임방 큐에 추가
        simpMessagingTemplate.convertAndSend("/topic/game/" + gameroomNo, chatRoomDTO);
    }

    // 게임 채팅방 퇴장
    @MessageMapping("/gameChat.leaveUser/{gameroomNo}")
    public void gameLeaveUser(ChatRoomDTO chatRoomDTO, @org.springframework.web.bind.annotation.PathVariable("gameroomNo") Long gameroomNo) {
        // 해당 게임방의 큐를 가져오거나 없으면 새로 생성
        ConcurrentLinkedQueue<String> queue = gameChatQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        String logMessage = "[게임방 " + gameroomNo + "] " + chatRoomDTO.getMSender() + "님이 퇴장했습니다.";
        queue.offer(logMessage); // 해당 게임방 큐에 추가
        simpMessagingTemplate.convertAndSend("/topic/game/" + gameroomNo, chatRoomDTO);
    }

    public void addServerLeaveMessageToQueue(String sender) {
        serverChatLogQueue.offer(sender + "님이 서버 채팅에서 퇴장하셨습니다.");
    }

    public void saveGameRoomLogs(Long gameroomNo) {
        ConcurrentLinkedQueue<String> queue = gameChatQueues.get(gameroomNo);
        if (queue != null && !queue.isEmpty()) {
            saveChatLogsToFile("game_chat_room_" + gameroomNo, queue);
            gameChatQueues.remove(gameroomNo); // 로그 저장 후 해당 게임방 큐 제거
            System.out.println("INFO : " + getClass().getName() + " - Game room " + gameroomNo + " chat logs saved and queue removed.");
        } else {
            System.out.println("INFO : " + getClass().getName() + " - No chat messages to save for game room " + gameroomNo + ".");
        }
    }
    
    // 스케줄된 로그 저장 
    @Scheduled(fixedRate = 3600000)
    public void saveScheduledLogs() {
        System.out.println("DEBUG: " + getClass().getName() + " - Before saving scheduled logs: serverChatLogQueue size = " + serverChatLogQueue.size());
        if (!serverChatLogQueue.isEmpty()) {
            saveChatLogsToFile("server_chat", serverChatLogQueue);
        } else {
            System.out.println("INFO : " + getClass().getName() + " - No new chat messages in serverChatLogQueue. Skipping log save.");
        }
        System.out.println("INFO : " + getClass().getName() + " - 자동로그저장완료 (서버 채팅만 해당)");
        // 게임방 채팅은 스케줄러가 아닌, 게임방 종료 시점에 별도로 저장됩니다.
    }

    // 실제 파일에 로그를 쓰는 내부 메서드 
    private void saveChatLogsToFile(String prefix, Queue<String> queue) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd_HHmmss");
        String timestamp = sdf.format(new Date());
        String fileName = prefix + "_" + timestamp + ".log";
        String fullPath = logDirectoryPath + File.separator + fileName;

        System.out.println("DEBUG: " + getClass().getName() + " - saveChatLogsToFile method called for prefix: " + prefix + ". Initial queue size: " + queue.size());
        System.out.println("DEBUG: " + getClass().getName() + " - Log directory path: " + logDirectoryPath);

        try (FileWriter fw = new FileWriter(fullPath, true);
             BufferedWriter bw = new BufferedWriter(fw);
             PrintWriter out = new PrintWriter(bw)) {

            System.out.println("DEBUG: " + getClass().getName() + " - FileWriter and PrintWriter successfully initialized for: " + fullPath);

            int messagesWritten = 0;
            while (!queue.isEmpty()) {
                String message = queue.poll();
                if (message != null) {
                    out.println(message);
                    messagesWritten++;
                }
            }
            out.flush();
            System.out.println("DEBUG: " + getClass().getName() + " - Finished processing queue. Messages attempted to write: " + messagesWritten);
            System.out.println("DEBUG: " + getClass().getName() + " - PrintWriter flushed.");

            if (messagesWritten == 0) {
                System.out.println("INFO : " + getClass().getName() + " - No new chat messages to save for: " + fullPath + ". File created but empty.");
            } else {
                System.out.println("INFO : " + getClass().getName() + " - Saved " + messagesWritten + " chat messages to: " + fullPath);
            }

        } catch (IOException e) {
            System.err.println("ERROR: " + getClass().getName() + " - Failed to write chat logs to file: " + e.getMessage());
            e.printStackTrace();
        } finally {
            System.out.println("DEBUG: " + getClass().getName() + " - saveChatLogsToFile method finished. Final queue size: " + queue.size());
        }
    }
=======
    private static final Map<Long, String> activeSessions = new ConcurrentHashMap<>();
    
    private final Queue<ChatRoomDTO> serverChatLogQueue = new ConcurrentLinkedQueue<>();
    private final Map<Long, Queue<ChatRoomDTO>> gameChatLogQueues = new ConcurrentHashMap<>();
    
    private static final String LOG_BASE_DIR = "./chat_logs/";

    // ✨ 추가: 서버 종료 시 로그 저장 로직의 중복 실행을 방지하기 위한 플래그
    private final AtomicBoolean shutdownProcessed = new AtomicBoolean(false);


    // --- 1. 서버 채팅 처리
    @MessageMapping("/serverChat.sendMessage")
    public void serverSendMessage(@Payload ChatRoomDTO chatMessage) {
        log.debug(String.format("Received server chat message from sender (No: %d), nick %s: %s",
                  chatMessage.getMSenderNo(), chatMessage.getMSender(), chatMessage.getMContent()));
        log.debug("serverChatLogQueue size BEFORE offer: " + serverChatLogQueue.size());
        
        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_CHAT);
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        serverChatLogQueue.offer(chatMessage);
        
        log.debug("serverChatLogQueue size AFTER offer: " + serverChatLogQueue.size());
        
        messagingTemplate.convertAndSend("/serverChat/public", chatMessage);
    }

    @MessageMapping("/serverChat.addUser")
    public void serverAddUser(@Payload ChatRoomDTO chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userNo", userNo);
            headerAccessor.getSessionAttributes().put("username", username);
        } else {
            log.warn("Session attributes are null for serverAddUser operation. User: " + username);
        }

        String sessionId = headerAccessor.getSessionId();
        if (userNo != null && sessionId != null) {
            activeSessions.put(userNo, sessionId);
            log.info(String.format("User joined server chat: %s (No: %d), session ID: %s", username, userNo, sessionId));
        } else {
        	log.warn(String.format("Failed to add user session for sender: %s. userNo: %d, sessionId: %s", username, userNo, sessionId));
        }

        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_JOIN);
        chatMessage.setMContent(username != null ? username + "님이 서버 채팅에 입장하셨습니다." : "알 수 없는 사용자님이 입장하셨습니다.");
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        log.debug("serverChatLogQueue size BEFORE offer (join msg): " + serverChatLogQueue.size());
        serverChatLogQueue.offer(chatMessage);
        log.debug("serverChatLogQueue size AFTER offer (join msg): " + serverChatLogQueue.size());
        
        messagingTemplate.convertAndSend("/serverChat/public", chatMessage);
    }

    @MessageMapping("/serverChat.leaveUser")
    public void serverLeaveUser(@Payload ChatRoomDTO chatMessage) {
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        activeSessions.remove(userNo);
        log.info(String.format("User left server chat: %s (No: %d)", username, userNo));

        chatMessage.setMType(ChatRoomDTO.MessageType.SERVER_LEAVE);
        chatMessage.setMContent(username != null ? username + "님이 서버 채팅에서 퇴장하셨습니다." : "알 수 없는 사용자님이 퇴장하셨습니다.");
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        log.debug("serverChatLogQueue size BEFORE offer (leave msg): " + serverChatLogQueue.size());
        serverChatLogQueue.offer(chatMessage);
        log.debug("serverChatLogQueue size AFTER offer (leave msg): " + serverChatLogQueue.size());
        
        messagingTemplate.convertAndSend("/serverChat/public", chatMessage);
    }


    // --- 2. 게임룸 채팅 처리

    @MessageMapping("/gameChat.sendMessage/{gameroomNo}")
    public void gameSendMessage(@Payload ChatRoomDTO chatMessage, @DestinationVariable Long gameroomNo) {
        log.info(String.format("Received game chat message from sender (No: %d), nick %s in room %d: %s",
                 chatMessage.getMSenderNo(), chatMessage.getMSender(), gameroomNo, chatMessage.getMContent()));
        
        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_CHAT);
        chatMessage.setGameroomNo(gameroomNo);
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        Queue<ChatRoomDTO> roomQueue = gameChatLogQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        log.debug("gameChatLogQueue for room " + gameroomNo + " size BEFORE offer: " + roomQueue.size());
        roomQueue.offer(chatMessage);
        log.debug("gameChatLogQueue for room " + gameroomNo + " size AFTER offer: " + roomQueue.size());
        
        messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatMessage);
    }

    @MessageMapping("/gameChat.addUser/{gameroomNo}")
    public void gameAddUser(@Payload ChatRoomDTO chatMessage, @DestinationVariable Long gameroomNo, SimpMessageHeaderAccessor headerAccessor) {
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("userNo", userNo);
            headerAccessor.getSessionAttributes().put("username", username);
            headerAccessor.getSessionAttributes().put("gameroomNo", gameroomNo);
        } else {
            log.warn("Session attributes are null for gameAddUser operation. User: " + username);
        }

        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_JOIN);
        chatMessage.setGameroomNo(gameroomNo);
        chatMessage.setMContent(username != null ? username + "님이 게임룸 " + gameroomNo + "에 입장하셨습니다." : "알 수 없는 사용자님이 입장하셨습니다.");
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        Queue<ChatRoomDTO> roomQueue = gameChatLogQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        log.debug("gameChatLogQueue for room " + gameroomNo + " size BEFORE offer (join msg): " + roomQueue.size());
        roomQueue.offer(chatMessage);
        log.debug("gameChatLogQueue for room " + gameroomNo + " size AFTER offer (join msg): " + roomQueue.size());
        
        messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatMessage);
        log.info(String.format("User joined game chat: %s (No: %d) in room %d", username, userNo, gameroomNo));
    }

    @MessageMapping("/gameChat.leaveUser/{gameroomNo}")
    public void gameLeaveUser(@Payload ChatRoomDTO chatMessage, @DestinationVariable Long gameroomNo) {
        Long userNo = chatMessage.getMSenderNo();
        String username = chatMessage.getMSender();

        chatMessage.setMType(ChatRoomDTO.MessageType.GAME_LEAVE);
        chatMessage.setGameroomNo(gameroomNo);
        chatMessage.setMContent(username != null ? username + "님이 게임룸 " + gameroomNo + "에서 퇴장하셨습니다." : "알 수 없는 사용자님이 퇴장하셨습니다.");
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());
        
        Queue<ChatRoomDTO> roomQueue = gameChatLogQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        log.debug("gameChatLogQueue for room " + gameroomNo + " size BEFORE offer (leave msg): " + roomQueue.size());
        roomQueue.offer(chatMessage);
        log.debug("gameChatLogQueue for room " + gameroomNo + " size AFTER offer (leave msg): " + roomQueue.size());
        
        messagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatMessage);
        log.info(String.format("User left game chat: %s (No: %d) from room %d", username, userNo, gameroomNo));
    }


    // --- 3. 귓속말 채팅 처리
    @MessageMapping("/whisperChat.sendMessage")
    public void sendWhisperMessage(@Payload ChatRoomDTO chatMessage) {
        String senderNick = chatMessage.getMSender();
        Long senderNo = chatMessage.getMSenderNo();
        String receiverNick = chatMessage.getMReceiver();
        Long receiverNo = chatMessage.getMReceiverNo();
        String content = chatMessage.getMContent();

        log.info(String.format("Received whisper from %s (No: %d). To %s (No: %d). Content: %s",
                 senderNick, senderNo, receiverNick, receiverNo, content));

        chatMessage.setMType(ChatRoomDTO.MessageType.WHISPER_CHAT);
        chatMessage.setMTimestamp(Instant.now().toEpochMilli());

        if (receiverNo != null) {
            messagingTemplate.convertAndSendToUser(String.valueOf(receiverNo), "/queue/messages", chatMessage);
            log.info("Whisper sent to receiver userNo: " + receiverNo);
        } else {
           log.warn("Cannot send whisper: receiverNo is null for content: " + content);
        }

        if (senderNo != null) {
            messagingTemplate.convertAndSendToUser(String.valueOf(senderNo), "/queue/messages", chatMessage);
            log.info("Whisper sent back to sender userNo: " + senderNo);
        }
    }
    
    // --- 로그 저장 메서드 및 스케줄러/종료 훅 ---

    @Scheduled(fixedRate = 60000) // 현재 1분 (테스트 후 1시간으로 변경 예정)
    public void saveServerChatLogsScheduled() {
    	log.info("자동로그저장완료");
        log.debug("Before saving scheduled logs: serverChatLogQueue size = " + serverChatLogQueue.size());
        saveChatLogsToFile(serverChatLogQueue, "server_chat");
        log.debug("After saving scheduled logs: serverChatLogQueue size = " + serverChatLogQueue.size());
    }

    public void saveGameChatLogs(Long gameroomNo) {
        Queue<ChatRoomDTO> roomQueue = gameChatLogQueues.get(gameroomNo);
        if (roomQueue != null) {
            log.debug("Attempting to save game logs for room " + gameroomNo + ". Current queue size: " + roomQueue.size());
            saveChatLogsToFile(roomQueue, "game_chat_" + gameroomNo);
            gameChatLogQueues.remove(gameroomNo);
            log.debug("Game chat logs saved and queue for room " + gameroomNo + " removed.");
        } else {
            log.info("Game chat queue for room " + gameroomNo + " is already empty or not found. No logs to save.");
        }
    }

    private void saveChatLogsToFile(Queue<ChatRoomDTO> logQueue, String prefix) {
        log.debug("saveChatLogsToFile method called for prefix: " + prefix + ". Initial queue size: " + logQueue.size());

        java.io.File logDir = new java.io.File(LOG_BASE_DIR);
        log.debug("Log directory path: " + logDir.getAbsolutePath());

        if (!logDir.exists()) {
            log.debug("Log directory does not exist. Attempting to create: " + logDir.getAbsolutePath());
            if (!logDir.mkdirs()) {
                log.error("Failed to create chat log directory: " + logDir.getAbsolutePath() + ". Please check permissions. Error: " + new IOException("디렉토리 생성 실패").getMessage(), new IOException("디렉토리 생성 실패"));
                return;
            }
            log.debug("Log directory created successfully: " + logDir.getAbsolutePath());
        }

        String fileName = prefix + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".log";
        String filePath = LOG_BASE_DIR + fileName;
        log.debug("Full log file path: " + filePath);

        List<ChatRoomDTO> messagesToRequeue = new ArrayList<>();

        try (FileWriter fw = new FileWriter(filePath, true);
             PrintWriter writer = new PrintWriter(fw)) {
            log.debug("FileWriter and PrintWriter successfully initialized for: " + filePath);

            ChatRoomDTO message;
            int messagesWritten = 0;
            // 큐가 비어있지 않다면 메시지 처리
            while ((message = logQueue.poll()) != null) {
                messagesToRequeue.add(message); // 메시지를 파일에 쓰기 전 임시 저장
                try {
                    writer.println(message.toString());
                    messagesToRequeue.remove(message); // 성공적으로 썼으면 임시 저장 목록에서 제거
                    messagesWritten++;
                    log.debug("Message written: " + message.getMContent());
                } catch (Exception writeException) {
                    log.error("Failed to write single chat message to file: " + filePath + ". Message details: " + message.toString() + ". Error: " + writeException.getMessage(), writeException);
                    // 실패한 메시지는 messagesToRequeue에 남아있으므로 finally에서 다시 큐에 들어감
                }
            }
            log.debug("Finished processing queue. Messages attempted to write: " + messagesWritten);

            writer.flush();
            log.debug("PrintWriter flushed.");

            // 메시지가 실제로 기록되었을 때만 INFO 로그 출력
            if (messagesWritten > 0) {
                 log.info("Chat logs saved to: " + filePath);
            } else {
                 log.info("No new chat messages to save for: " + filePath + ". File created but empty."); // 빈 파일 생성 시 안내
            }

        } catch (IOException e) {
            log.error("Critical IO error while saving chat logs to file " + filePath + ". Error details: " + e.getMessage(), e);
        } finally {
            if (!messagesToRequeue.isEmpty()) {
                messagesToRequeue.forEach(logQueue::offer);
                log.warn("Re-queued " + messagesToRequeue.size() + " messages that failed to save. They will be retried later.");
            }
            log.debug("saveChatLogsToFile method finished. Final queue size: " + logQueue.size());
        }
    }

    @PostConstruct
    public void init() {
        log.info("ChatController initialized. Log directory: " + new java.io.File(LOG_BASE_DIR).getAbsolutePath());
    }

    @PreDestroy
    public void onServerShutdown() {
        // ✨ 수정: AtomicBoolean을 사용하여 한 번만 실행되도록 보장
        if (shutdownProcessed.compareAndSet(false, true)) { // 처음 호출될 때만 true로 설정하고 진입
            log.info("Server is shutting down. Saving remaining chat logs...");

            log.debug("Attempting to save final server chat logs. Queue size: " + serverChatLogQueue.size());
            saveChatLogsToFile(serverChatLogQueue, "server_chat_final"); 
            log.debug("Final server chat logs saving finished. Queue size after: " + serverChatLogQueue.size());

            gameChatLogQueues.entrySet().forEach(entry -> {
                Long gameroomNo = entry.getKey();
                Queue<ChatRoomDTO> roomQueue = entry.getValue();
                log.debug("Attempting to save final game chat logs for room " + gameroomNo + ". Queue size: " + roomQueue.size());
                saveChatLogsToFile(roomQueue, "game_chat_final_" + gameroomNo);
                log.debug("Final game chat logs saving finished for room " + gameroomNo + ". Queue size after: " + roomQueue.size());
            });

            log.info("All remaining chat logs saved during shutdown.");
        } else {
            log.debug("onServerShutdown already processed, skipping duplicate call.");
        }
    }
>>>>>>> Stashed changes
}