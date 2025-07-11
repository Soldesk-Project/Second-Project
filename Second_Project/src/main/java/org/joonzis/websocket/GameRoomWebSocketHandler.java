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

    // 서버 세션
    private final Map<String, Set<WebSocketSession>> serverSessions = new ConcurrentHashMap<>();
    
    // 서버별 유저
    private final Map<String, Set<String>> serverUsers = new ConcurrentHashMap<>();
    
    // 서버별 방목록
    private final Map<String, List<GameRoomDTO>> serverRooms = new ConcurrentHashMap<>();
    
    // 방별 유저
    private final Map<String, Map<String, Set<String>>> roomUsers = new ConcurrentHashMap<>();
    
    // 방별 문제 Id
    private final Map<String, Map<String, AtomicInteger>> roomQuestionIds = new ConcurrentHashMap<>();
    
    // 방별 유저별 점수
    private final Map<String, Map<String, Map<String, AtomicInteger>>> roomScores = new ConcurrentHashMap<>();
    
    private final Map<String, Map<String, String>> roomOwners = new ConcurrentHashMap<>();
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private AtomicInteger roomIndex = new AtomicInteger(1);
    
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
            case "nextQuestion":
            	handleNextQuestion(session, json);
            	break;
            case "sumScore":
            	handleSumScore(session, json);
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

        if("normal".equals(newRoom.getGame_mode())) {
        	// 서버별 방 목록 업데이트
        	serverRooms.computeIfAbsent(server, k -> new ArrayList<>()).add(newRoom);
        	
        	roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
        	.computeIfAbsent(newRoom.getGameroom_no(), k -> ConcurrentHashMap.newKeySet())
        	.add(userNick);
        	// 모든 클라이언트에게 방 목록 브로드캐스트
        	broadcastRoomList(server);
        }
        
        roomOwners.computeIfAbsent(server, k -> new ConcurrentHashMap<>()).put(roomNo, userNick);

        
        try {
            String msg = objectMapper.writeValueAsString(Map.of(
                "type", "roomCreated",
                "gameroom_no", newRoom.getGameroom_no(),
                "category", newRoom.getCategory(),
                "game_mode", newRoom.getGame_mode()
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
	    String gameMode = json.get("game_mode").asText();
	    String category = json.get("category").asText();
	    System.out.println("🔔 joinRoom 요청 수신 → userNick: " + userNick + ", roomNo: " + roomNo);


	    // 방 참가자 목록 관리 (예: roomUsers 맵)
	    roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
	             .computeIfAbsent(roomNo, k -> ConcurrentHashMap.newKeySet())
	             .add(userNick);

	    broadcastRoomList(server);
	    broadcaseRoomUserList(server, roomNo);
	    
	    if("rank".equals(gameMode)) {
	    	new Timer().schedule(new TimerTask() {
	    		@Override
	    		public void run() {
	    			handleStartGame(roomNo, category, server);
	    		}
	    	}, 10_000);
	    }
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
    	String roomNo = json.get("roomNo").asText();
    	String server = json.get("server").asText();
    	if (server == null) return;
    	
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
    
    // 일반 모드 게임 시작
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

        // 방별 questionId 초기화
        AtomicInteger currentQuestionId = roomQuestionIds.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
        												 .computeIfAbsent(roomNo, k -> new AtomicInteger(0));
        currentQuestionId.set(0);
        int nextId = currentQuestionId.getAndIncrement();
        
        // 참가자 점수 초기화
        Map<String, Map<String, AtomicInteger>> serverScoreMap = roomScores.computeIfAbsent(server, k -> new ConcurrentHashMap<>());
        Map<String, AtomicInteger> roomScoreMap = serverScoreMap.computeIfAbsent(roomNo, k -> new ConcurrentHashMap<>());
        Set<String> users = roomUsers.getOrDefault(server, Collections.emptyMap())
                                     .getOrDefault(roomNo, Collections.emptySet());
        for (String user : users) {
            roomScoreMap.put(user, new AtomicInteger(0));
        }
                
    	System.out.println(list);
    	Map<String, Object> payload = Map.of(
            "type", "gameStart",
            "server", server,
            "roomNo", roomNo,
            "initiator", userNick,
            "list", list,
            "nextId", nextId
        );
    	
    	
        broadcast(server, payload);
    }
    
    // 랭크 모드 게임 시작
    private void handleStartGame(String roomNo, String category, String server) {
        Set<String> userNicks = roomUsers.getOrDefault(server, Collections.emptyMap())
                                         .getOrDefault(roomNo, Collections.emptySet());

        if (userNicks.isEmpty()) return;

        String initiator = userNicks.iterator().next(); // 방장 또는 아무나

        List<QuestionDTO> list = playService.getQuestionsByCategory(category);

        AtomicInteger currentQuestionId = roomQuestionIds
            .computeIfAbsent(server, k -> new ConcurrentHashMap<>())
            .computeIfAbsent(roomNo, k -> new AtomicInteger(0));
        currentQuestionId.set(0);

        Map<String, Object> payload = Map.of(
            "type", "gameStart",
            "server", server,
            "roomNo", roomNo,
            "initiator", initiator,
            "list", list,
            "nextId", currentQuestionId
        );

        broadcast(server, payload);
    }
    
    private void handleStopGame(WebSocketSession session, JsonNode json) {
    	String server = json.get("server").asText();
        String roomNo = json.get("roomNo").asText();
        String userNick = json.get("userNick").asText();
        
        if (server == null || userNick == null) {
    		return;
    	}
        // 방장 여부 확인 로직 추가 가능 (필요한 경우)
        System.out.println("Game stop requested by " + userNick + " in room " + roomNo);
        AtomicInteger currentQuestionId = roomQuestionIds.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
                										 .computeIfAbsent(roomNo, k -> new AtomicInteger(0));
        currentQuestionId.set(0);
        
        
        // 해당 방의 모든 유저에게 게임 중지 메시지 브로드캐스트
        Map<String, Object> payload = Map.of(
            "type", "gameStop",
            "server", server,
            "roomNo", roomNo,
            "initiator", userNick
        );
        broadcast(server, payload);
    }   
    
    private void handleNextQuestion(WebSocketSession session, JsonNode json) {
    	String server = json.get("server").asText();
        String roomNo = json.get("roomNo").asText();
        String userNick = json.get("userNick").asText();
    
        if (server == null || userNick == null) {
    		return;
    	}
        
        String owner = roomOwners.getOrDefault(server, Collections.emptyMap()).get(roomNo);
        if (owner == null || !owner.equals(userNick)) {
            // 방장이 아니면 무시 (혹은 에러 메시지 전송)
            System.out.println("❌ nextQuestion 요청 무시 - 방장 아님: " + userNick);
            return;
        }
        
        System.out.println("Next question requested by " + userNick + " in room " + roomNo);

        // 방별 questionId 증가
        AtomicInteger currentQuestionId = roomQuestionIds.getOrDefault(server, Collections.emptyMap())
                                                         .getOrDefault(roomNo, new AtomicInteger(1));
        int nextId = currentQuestionId.getAndIncrement();
        System.out.println(nextId);
        
        Map<String, Object> payload = Map.of(
    		"type", "nextQuestion",
    		"server", server,
    		"roomNo", roomNo,
    		"initiator", userNick,
    		"nextId", nextId
		);
        broadcast(server, payload);
    }
    
    private void handleSumScore(WebSocketSession session, JsonNode json) {
    	String server = json.get("server").asText();
        String roomNo = json.get("roomNo").asText();
        String userNick = json.get("userNick").asText();
        
        if (server == null || userNick == null) {
    		return;
    	}
        
        System.out.println("Sum score by " + userNick + " in room " + roomNo);
        
        Map<String, Map<String, AtomicInteger>> serverScoreMap = roomScores.computeIfAbsent(server, k -> new ConcurrentHashMap<>());
        Map<String, AtomicInteger> roomScoreMap = serverScoreMap.computeIfAbsent(roomNo, k -> new ConcurrentHashMap<>());
        AtomicInteger userScore = roomScoreMap.computeIfAbsent(userNick, k -> new AtomicInteger(0));
        userScore.incrementAndGet();
        Map<String, Integer> scores = new HashMap<>();
        for (Map.Entry<String, AtomicInteger> entry : roomScoreMap.entrySet()) {
            scores.put(entry.getKey(), entry.getValue().get());
        }
        
        Map<String, Object> payload = Map.of(
    		"type", "sumScore",
    		"server", server,
    		"roomNo", roomNo,
    		"initiator", userNick,
    		"scores", scores
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
    
	/*
	 * private void autoStart(String roomNo) {
	 * System.out.println("⏳ [랭크 자동 시작 예약] 10초 후 시작 - roomNo: " + roomNo);
	 * 
	 * new Timer().schedule(new TimerTask() {
	 * 
	 * @Override public void run() { Set<WebSocketSession> sessions =
	 * serverSessions.values().stream() .flatMap(Set::stream) .filter(s -> { String
	 * server = (String) s.getAttributes().get("server"); String userNick = (String)
	 * s.getAttributes().get("userNick"); Set<String> roomUsersSet =
	 * roomUsers.getOrDefault(server, Collections.emptyMap()) .getOrDefault(roomNo,
	 * Collections.emptySet()); return roomUsersSet.contains(userNick); })
	 * .collect(Collectors.toSet());
	 * 
	 * if (sessions.isEmpty()) { System.out.println("❌ 게임 시작 실패 - 세션 없음"); return; }
	 * 
	 * List<QuestionDTO> questionList =
	 * playService.getQuestionsByCategory("random"); for (WebSocketSession session :
	 * sessions) { try { session.sendMessage(new
	 * TextMessage(objectMapper.writeValueAsString(Map.of( "type", "gameStart",
	 * "questionList", questionList )))); } catch (IOException e) {
	 * e.printStackTrace(); } }
	 * 
	 * System.out.println("🎮 [랭크 자동 시작] 게임 시작됨 - roomNo: " + roomNo); } }, 10000);
	 * // 10초 후 실행 }
	 */


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
