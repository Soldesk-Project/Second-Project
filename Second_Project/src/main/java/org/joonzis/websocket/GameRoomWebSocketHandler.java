package org.joonzis.websocket;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.joonzis.domain.GameRoomDTO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.service.PlayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.log4j.Log4j;

@Log4j
public class GameRoomWebSocketHandler extends TextWebSocketHandler {

    // 서버별 세션 관리: {서버명: [세션1, 세션2]}
    private final Map<String, Set<WebSocketSession>> serverSessions = new ConcurrentHashMap<>();
    
    // 서버별 유저 목록: {서버명: [유저닉1, 유저닉2]}
    private final Map<String, Set<String>> serverUsers = new ConcurrentHashMap<>();
    
    // 서버별 방 목록: {서버명: [방1, 방2]}
    private final Map<String, List<GameRoomDTO>> serverRooms = new ConcurrentHashMap<>();
    
    // 방별 유저
    private final Map<String, Map<String, Set<String>>> roomUsers = new ConcurrentHashMap<>();
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private PlayService playService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        JsonNode json = objectMapper.readTree(message.getPayload());
        String action = json.get("action").asText();
        
        switch (action) {
            case "join":
                handleJoin(session, json);
                break;
            case "createRoom":
                handleCreateRoom(session, json);
                break;
            case "joinRoom":
            	handleJoinRoom(session, json);
            	break;
            case "roomUserList":
            	handleUserList(session, json);
            	break;
            case "leaveRoom":
            	handleLeaveRoom(session, json);
            	break;
            case "startGame":
            	handleStartGame(session, json);
            	break;
            case "stopGame":
            	handleStopGame(session, json);
            	break;
        }
    }

    private void handleJoin(WebSocketSession session, JsonNode json) {
        String server = json.get("server").asText();
        String userNick = json.get("userNick").asText();
        
        // 세션 속성에 서버/닉네임 저장
        session.getAttributes().put("server", server);
        session.getAttributes().put("userNick", userNick);
        
        // 서버별 세션 및 유저 목록 업데이트
        serverSessions.computeIfAbsent(server, k -> ConcurrentHashMap.newKeySet()).add(session);
        serverUsers.computeIfAbsent(server, k -> ConcurrentHashMap.newKeySet()).add(userNick);
        
        // 모든 클라이언트에게 유저 목록 브로드캐스트
        broadcastUserList(server);
        broadcastRoomList(server); 
        
        //sendRoomListToSession(server, session);
    }
    
	/*
	 * private void sendRoomListToSession(String server, WebSocketSession session) {
	 * List<GameRoomDTO> rooms = serverRooms.getOrDefault(server,
	 * Collections.emptyList()); Map<String, Set<String>> roomUserMap =
	 * roomUsers.getOrDefault(server, Collections.emptyMap()); List<Map<String,
	 * Object>> roomListWithCount = new ArrayList<>(); for (GameRoomDTO room :
	 * rooms) { Map<String, Object> roomMap = new HashMap<>();
	 * roomMap.put("gameroom_no", room.getGameroom_no()); roomMap.put("title",
	 * room.getTitle()); roomMap.put("category", room.getCategory());
	 * roomMap.put("game_mode", room.getGame_mode()); roomMap.put("is_private",
	 * room.getIs_private()); roomMap.put("limit", room.getLimit());
	 * roomMap.put("pwd", room.getPwd()); // 현재 인원수 Set<String> users =
	 * roomUserMap.getOrDefault(room.getGameroom_no(), Collections.emptySet());
	 * roomMap.put("currentCount", users.size());
	 * System.out.println("방번호 : "+room.getGameroom_no()+", "+"유저수 : "+users.size())
	 * ; roomListWithCount.add(roomMap); }
	 * 
	 * try { String json = objectMapper.writeValueAsString(Map.of("type",
	 * "roomList", "rooms", rooms)); if (session.isOpen()) { session.sendMessage(new
	 * TextMessage(json)); } } catch (Exception e) { // 에러 처리 } }
	 */
    
    
    private AtomicInteger roomIndex = new AtomicInteger(1);
    private void handleCreateRoom(WebSocketSession session, JsonNode json) {
        String server = (String) session.getAttributes().get("server");
        String userNick = (String) session.getAttributes().get("userNick");
        if (server == null) return;

        // 방 생성 정보 파싱
        String roomNo = json.has("gameroom_no") 
        		  ? json.get("gameroom_no").asText() 
        		  : String.valueOf(roomIndex.getAndIncrement());
        GameRoomDTO newRoom = new GameRoomDTO(
    		roomNo,
            json.get("title").asText(),
            json.get("category").asText(),
            json.get("game_mode").asText(),
            json.get("is_private").asText(),
            json.get("limit").asInt(),
            json.get("pwd") != null ? json.get("pwd").asText() : null
        );
        
        // 서버별 방 목록 업데이트
        serverRooms.computeIfAbsent(server, k -> new ArrayList<>()).add(newRoom);
        
        roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
	             .computeIfAbsent(newRoom.getGameroom_no(), k -> ConcurrentHashMap.newKeySet())
	        	 .add(userNick);
        // 모든 클라이언트에게 방 목록 브로드캐스트
        broadcastRoomList(server);
        
        try {
            String msg = objectMapper.writeValueAsString(Map.of(
                "type", "roomCreated",
                "gameroom_no", newRoom.getGameroom_no(),
                "category", newRoom.getCategory()
            ));
            if (session.isOpen()) {
            	session.sendMessage(new TextMessage(msg));
            }
        } catch (Exception e) {
        	System.out.println(e);
        }
    }

    private void handleJoinRoom(WebSocketSession session, JsonNode json) {
    	String server = (String) session.getAttributes().get("server");
	    if (server == null) return;

	    String roomNo = json.get("roomNo").asText();
	    String userNick = json.get("userNick").asText();
	    
	    System.out.println("🔔 joinRoom 요청 수신 → userNick: " + userNick + ", roomNo: " + roomNo);


	    // 방 참가자 목록 관리 (예: roomUsers 맵)
	    roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
	             .computeIfAbsent(roomNo, k -> ConcurrentHashMap.newKeySet())
	             .add(userNick);

	    broadcastRoomList(server);
	    broadcaseRoomUserList(server, roomNo);
    }	
    
    private void handleLeaveRoom(WebSocketSession session, JsonNode json) {
        String server = (String) session.getAttributes().get("server");
        String userNick = (String) session.getAttributes().get("userNick");
        if (server == null || userNick == null) return;

        String roomNo = json.get("roomNo").asText();
      
        // 방 참가자 목록에서 유저 제거
        Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(server, Collections.emptyMap());
        if (roomUserMap.containsKey(roomNo)) {
            Set<String> users = roomUserMap.get(roomNo);
            users.remove(userNick);

            // 방 인원이 0명이면 방 삭제
            if (users.isEmpty()) {
                roomUserMap.remove(roomNo);
                List<GameRoomDTO> rooms = serverRooms.getOrDefault(server, Collections.emptyList());
                rooms.removeIf(room -> room.getGameroom_no().equals(roomNo));
            }
        }

        // 방 목록, 유저 목록 전체 브로드캐스트
        broadcastRoomList(server);
        broadcastUserList(server);
        broadcaseRoomUserList(server, roomNo);
    }
    
    private void handleUserList(WebSocketSession session, JsonNode json) {
    	System.out.println("handleUserList....");
//    	String server = (String) session.getAttributes().get("server");
    	String roomNo = json.get("roomNo").asText();
    	String server = json.get("server").asText();
    	if (server == null) return;
    	System.out.println(roomNo);
    	
    	Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(server, Collections.emptyMap());
        Set<String> userNicks = roomUserMap.getOrDefault(roomNo, Collections.emptySet());
        List<String> userList = new ArrayList<>(userNicks);
        
        Map<String, Object> payload = Map.of(
            "type", "roomUserList",
            "server", server,
            "roomNo", roomNo,
            "userList", userList
        );
        
        
        try {
            String jsonStr = objectMapper.writeValueAsString(payload);
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(jsonStr));
            }
        } catch (Exception e) {
        	System.out.println("Error sending roomUserList for roomNo " + roomNo + ": " + e.getMessage());
            e.printStackTrace();
        }
        broadcaseRoomUserList(server, roomNo);
    }
    
    private void handleStartGame(WebSocketSession session, JsonNode json) {
    	String server = json.get("server").asText();
    	String roomNo = json.get("roomNo").asText();
    	String userNick = json.get("userNick").asText();

    	String category = json.get("category").asText();

    	if (server == null || userNick == null) {
    		return;
    	}

    	System.out.println("Game start requested by " + userNick + " in room " + roomNo);
    	List<QuestionDTO> list = playService.getQuestionsByCategory(category);
    	System.out.println(list);
    	Map<String, Object> payload = Map.of(
            "type", "gameStart",
            "server", server,
            "roomNo", roomNo,
            "initiator", userNick,
            "list", list

        );
    	
    	
        broadcast(server, payload);
    }
    
    private void handleStopGame(WebSocketSession session, JsonNode json) {
    	String server = json.get("server").asText();
        String roomNo = json.get("roomNo").asText();
        String userNick = json.get("userNick").asText();
        
        // 방장 여부 확인 로직 추가 가능 (필요한 경우)
        System.out.println("Game stop requested by " + userNick + " in room " + roomNo);
        
        // 해당 방의 모든 유저에게 게임 중지 메시지 브로드캐스트
        Map<String, Object> payload = Map.of(
            "type", "gameStop",
            "server", server,
            "roomNo", roomNo,
            "initiator", userNick
        );
        broadcast(server, payload);
    }   
    
    private void broadcastUserList(String server) {
        Set<String> users = serverUsers.getOrDefault(server, Collections.emptySet());
        broadcast(server, Map.of("type", "userList", "users", users));
    }

    private void broadcastRoomList(String server) {
        List<GameRoomDTO> rooms = serverRooms.getOrDefault(server, Collections.emptyList());
        Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(server, Collections.emptyMap());
        List<Map<String, Object>> roomListWithCount = new ArrayList<>();
        for (GameRoomDTO room : rooms) {
            Map<String, Object> roomMap = new HashMap<>();
            roomMap.put("gameroom_no", room.getGameroom_no());
            roomMap.put("title", room.getTitle());
            roomMap.put("category", room.getCategory());
            roomMap.put("game_mode", room.getGame_mode());
            roomMap.put("is_private", room.getIs_private());
            roomMap.put("limit", room.getLimit());
            roomMap.put("pwd", room.getPwd());
            // 현재 인원수
            Set<String> users = roomUserMap.getOrDefault(room.getGameroom_no(), Collections.emptySet());
            roomMap.put("currentCount", users.size());
            //System.out.println("방번호 : "+room.getGameroom_no()+", "+"유저수 : "+users.size());	
            roomListWithCount.add(roomMap);
        }

        broadcast(server, Map.of("type", "roomList", "rooms", roomListWithCount));
    }

    private void broadcaseRoomUserList(String server, String roomNo) {
    	Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(server, Collections.emptyMap());
        Set<String> userNicks = roomUserMap.getOrDefault(roomNo, Collections.emptySet());
        List<String> userList = new ArrayList<>(userNicks);
        
        Map<String, Object> payload = Map.of(
            "type", "roomUserList",
            "server", server,
            "roomNo", roomNo,
            "userList", userList
        );
        broadcast(server, payload);
    }
    
    private void broadcast(String server, Object data) {
        String json;
        try {
            json = objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return;
        }
        
        serverSessions.getOrDefault(server, Collections.emptySet()).forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            } catch (Exception e) {	
                // 에러 처리
            }
        });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String server = (String) session.getAttributes().get("server");
        String userNick = (String) session.getAttributes().get("userNick");
        
        if (server != null && userNick != null) {
            // 세션 및 유저 목록에서 제거
            serverSessions.getOrDefault(server, Collections.emptySet()).remove(session);
            serverUsers.getOrDefault(server, Collections.emptySet()).remove(userNick);
            
            
            Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(server, Collections.emptyMap());
            List<String> emptyRooms = new ArrayList<>();
            
            for (Map.Entry<String, Set<String>> entry : roomUserMap.entrySet()) {
                Set<String> users = entry.getValue();
                users.remove(userNick);
                // 방 인원이 0명이면 삭제 대상에 추가
                if (users.isEmpty()) {
                    emptyRooms.add(entry.getKey());
                }
            }
            
            List<GameRoomDTO> rooms = serverRooms.getOrDefault(server, Collections.emptyList());

            // 각 빈 방마다 개별적으로 유예 시간 후 삭제 체크
            for (String roomNo : emptyRooms) {
                new Timer().schedule(new TimerTask() {
                    @Override
                    public void run() {
                        Set<String> checkUsers = roomUserMap.get(roomNo);
                        if (checkUsers == null || checkUsers.isEmpty()) {
                            roomUserMap.remove(roomNo);
                            rooms.removeIf(room -> room.getGameroom_no().equals(roomNo));
                            broadcastRoomList(server);
                        }
                    }
                }, 5000); // 5초 후 체크
            }
                      
            
            broadcastUserList(server);
            broadcastRoomList(server);
        }
    }


}
