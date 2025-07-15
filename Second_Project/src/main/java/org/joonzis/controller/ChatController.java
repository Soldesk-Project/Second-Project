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
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.Map;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

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
}