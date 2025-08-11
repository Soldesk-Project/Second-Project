package org.joonzis.controller;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.joonzis.domain.ChatRoomDTO;
import org.joonzis.domain.ReportHistoryVO;
import org.joonzis.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;
    private static final Queue<String> serverChatLogQueue = new ConcurrentLinkedQueue<>();
    private static final ConcurrentHashMap<Long, ConcurrentLinkedQueue<String>> gameChatQueues = new ConcurrentHashMap<>();
    private String logDirectoryPath;
    
    @Autowired
    private ChatService chatService;

    @PostConstruct
    public void init() {
        logDirectoryPath = System.getProperty("user.dir") + File.separator + "chat_logs";
        File logDir = new File(logDirectoryPath);
        if (!logDir.exists()) {
            logDir.mkdirs();
        }
    }

    @PreDestroy
    public void onShutdown() {
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
    }
    
    // 서버 공지 메시지 전송 (전체 공통 채팅방용)
    @MessageMapping("/serverChat.sendMessage/{server}")
    public void serverSendMessage(@DestinationVariable Long server, @Payload ChatRoomDTO chatRoomDTO) {
        // 메시지 큐에 추가
        serverChatLogQueue.offer(chatRoomDTO.getMSender() + ": " + chatRoomDTO.getMContent());
        
        // STOMP를 통해 구독자에게 메시지 전송
        simpMessagingTemplate.convertAndSend("/serverChat/" + server, chatRoomDTO);
    }
    
    // 서버 채팅방 입장
    @MessageMapping("/serverChat.addUser/{server}")
    public void serverAddUser(@DestinationVariable Long server,
                              @Payload ChatRoomDTO chatRoomDTO,
                              SimpMessageHeaderAccessor headerAccessor) {

        headerAccessor.getSessionAttributes().put("username", chatRoomDTO.getMSender());
        headerAccessor.getSessionAttributes().put("serverNo", server);

        // 로그 큐에 저장
        String logMessage = "[서버 " + server + "] " + chatRoomDTO.getMSender() + "님이 입장했습니다.";
        serverChatLogQueue.offer(logMessage);

        chatRoomDTO.setMType(ChatRoomDTO.MessageType.SERVER_JOIN);
        chatRoomDTO.setMContent(chatRoomDTO.getMSender() + "님이 입장했습니다");
        chatRoomDTO.setMTimestamp(System.currentTimeMillis());

        simpMessagingTemplate.convertAndSend("/serverChat/" + server, chatRoomDTO);
    }

    // 서버 채팅방 퇴장
    @MessageMapping("/serverChat.leaveUser/{server}")
    public void serverLeaveUser(@DestinationVariable Long server,
                                @Payload ChatRoomDTO chatRoomDTO) {

        String logMessage = "[서버 " + server + "] " + chatRoomDTO.getMSender() + "님이 퇴장했습니다.";
        serverChatLogQueue.offer(logMessage);

        chatRoomDTO.setMType(ChatRoomDTO.MessageType.SERVER_LEAVE);
        chatRoomDTO.setMContent(chatRoomDTO.getMSender() + "님이 퇴장했습니다");
        chatRoomDTO.setMTimestamp(System.currentTimeMillis());

        simpMessagingTemplate.convertAndSend("/serverChat/" + server, chatRoomDTO);
    }

 // 게임 채팅방 메시지 전송
    @MessageMapping("/gameChat.sendMessage/{gameroomNo}")
    public void gameSendMessage(@Payload ChatRoomDTO chatRoomDTO) {
    	Long gameroomNo = chatRoomDTO.getGameroomNo();
    	
    	// 해당 게임방의 큐를 가져오거나 없으면 새로 생성
        ConcurrentLinkedQueue<String> queue = gameChatQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        String logMessage = "[게임방 " + gameroomNo + "] " + chatRoomDTO.getMSender() + ": " + chatRoomDTO.getMContent();
        queue.offer(logMessage); // 해당 게임방 큐에 추가
        simpMessagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatRoomDTO);
    }

    // 게임 채팅방 입장
    @MessageMapping("/gameChat.addUser/{gameroomNo}")
    public void gameAddUser(@Payload ChatRoomDTO chatRoomDTO,
    		SimpMessageHeaderAccessor headerAccessor) {
    	 Long gameroomNo = chatRoomDTO.getGameroomNo();
    	
    	headerAccessor.getSessionAttributes().put("username", chatRoomDTO.getMSender());
        headerAccessor.getSessionAttributes().put("gameroomNo", gameroomNo);
        // 해당 게임방의 큐를 가져오거나 없으면 새로 생성
        ConcurrentLinkedQueue<String> queue = gameChatQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        String logMessage = "[게임방 " + gameroomNo + "] " + chatRoomDTO.getMSender() + "님이 입장했습니다.";
        queue.offer(logMessage); // 해당 게임방 큐에 추가
        
        chatRoomDTO.setMType(ChatRoomDTO.MessageType.GAME_JOIN);
        chatRoomDTO.setMContent(chatRoomDTO.getMSender() + "님이 입장했습니다");
        chatRoomDTO.setMTimestamp(System.currentTimeMillis());
        
        simpMessagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatRoomDTO);
    }

    // 게임 채팅방 퇴장
    @MessageMapping("/gameChat.leaveUser/{gameroomNo}")
    public void gameLeaveUser(@Payload ChatRoomDTO chatRoomDTO) {
    	Long gameroomNo = chatRoomDTO.getGameroomNo();
    	
        // 해당 게임방의 큐를 가져오거나 없으면 새로 생성
        ConcurrentLinkedQueue<String> queue = gameChatQueues.computeIfAbsent(gameroomNo, k -> new ConcurrentLinkedQueue<>());
        String logMessage = "[게임방 " + gameroomNo + "] " + chatRoomDTO.getMSender() + "님이 퇴장했습니다.";
        queue.offer(logMessage); // 해당 게임방 큐에 추가
        simpMessagingTemplate.convertAndSend("/gameChat/" + gameroomNo, chatRoomDTO);
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
//    @Scheduled(fixedRate = 60000)
    public void saveScheduledLogs() {
        if (!serverChatLogQueue.isEmpty()) {
            saveChatLogsToFile("server_chat", serverChatLogQueue);
        } else {
            System.out.println("INFO : " + getClass().getName() + " - No new chat messages in serverChatLogQueue. Skipping log save.");
        }
        // 게임방 채팅은 스케줄러가 아닌, 게임방 종료 시점에 별도로 저장됩니다.
    }

    // 실제 파일에 로그를 쓰는 내부 메서드 
    private void saveChatLogsToFile(String prefix, Queue<String> queue) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd_HHmmss");
        String timestamp = sdf.format(new Date());
        String fileName = prefix + "_" + timestamp + ".log";
        String fullPath = logDirectoryPath + File.separator + fileName;

        try (FileWriter fw = new FileWriter(fullPath, true);
             BufferedWriter bw = new BufferedWriter(fw);
             PrintWriter out = new PrintWriter(bw)) {


            int messagesWritten = 0;
            while (!queue.isEmpty()) {
                String message = queue.poll();
                if (message != null) {
                    out.println(message);
                    messagesWritten++;
                }
            }
            out.flush();
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
    
    
    @PostMapping(value = "/chat/report", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> reportHistory(@RequestBody ReportHistoryVO reportHistory) {
    	try {
    		chatService.reportHistory(reportHistory);
    		return new ResponseEntity<>("채팅이 신고되었습니다. 관리자가 확인 후 조치할 예정입니다.", HttpStatus.OK);
    	} catch (Exception e) {
    		e.printStackTrace();
    		Map<String, String> errorResponse = new HashMap<>();
    		errorResponse.put("message", "채팅 신고중 오류 발생: " + e.getMessage());
    		return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    	}
    }
    
    @GetMapping(value = "/chat/getReportHistory", produces = "application/json; charset=UTF-8")
    public ResponseEntity<Map<String, Object>> reportHistory(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "5") int size) {
    	int offset = (page - 1) * size;
	    List<ReportHistoryVO> reports = chatService.getReportHistory(offset, size);
	    int totalCount = chatService.getReportHistoryCount(); // 전체 개수 조회

	    Map<String, Object> response = new HashMap<>();
	    response.put("items", reports);
	    response.put("totalCount", totalCount);

	    return ResponseEntity.ok(response);
    }
    
    
}