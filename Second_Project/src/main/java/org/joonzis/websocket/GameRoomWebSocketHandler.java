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
    
    // 방장
    private final Map<String, Map<String, String>> roomOwners = new ConcurrentHashMap<>();
    
    // 방별로 한 번만 시작하도록 관리
    private final Set<String> startedRankRooms = ConcurrentHashMap.newKeySet();
    
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
    }
    
    // 방 생성
    private void handleCreateRoom(WebSocketSession session, JsonNode json) {
        //String server = (String) session.getAttributes().get("server");
        String userNick = (String) session.getAttributes().get("userNick");
        //if (server == null) return;

        // 방 생성 정보 파싱
        String roomNo = json.has("gameroom_no")
        		? json.get("gameroom_no").asText() 
        		: String.valueOf(roomIndex.getAndIncrement());
       
        String server = json.has("server")
        		? json.get("server").asText()
        		: (String) session.getAttributes().get("server");
        		
       String gameMode = json.get("game_mode").asText();

        		
        GameRoomDTO newRoom = new GameRoomDTO(
    		roomNo,
            json.get("title").asText(),
            json.get("category").asText(),
            gameMode,
            json.get("is_private").asText(),
            json.get("limit").asInt(),
            json.get("pwd") != null ? json.get("pwd").asText() : null
        );
        
        // 게임 모드 분기
        if("normal".equals(newRoom.getGame_mode())) {
        	// 서버별 방 목록 업데이트
        	serverRooms.computeIfAbsent(server, k -> new ArrayList<>()).add(newRoom);
        	
        	roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
        	.computeIfAbsent(newRoom.getGameroom_no(), k -> ConcurrentHashMap.newKeySet())
        	.add(userNick);
        	// 모든 클라이언트에게 방 목록 브로드캐스트
        	broadcastRoomList(server);
        }
        
        String ownerKey = "rank".equals(gameMode) ? "rank" : server;
        roomOwners.computeIfAbsent(ownerKey, k -> new ConcurrentHashMap<>()).put(roomNo, userNick);

        
        try {
            String msg = objectMapper.writeValueAsString(Map.of(
                "type", "roomCreated",
                "server", server,
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

    // 방 참가
    private void handleJoinRoom(WebSocketSession session, JsonNode json) {
        String server = json.has("server")
            ? json.get("server").asText()
            : (String) session.getAttributes().get("server");
        String roomNo = json.get("roomNo").asText();
        String userNick = json.get("userNick").asText();
        String gameMode = json.get("game_mode").asText();
        String category = json.get("category").asText();

        roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
                .computeIfAbsent(roomNo, k -> ConcurrentHashMap.newKeySet())
                .add(userNick);

        // 랭크방일 경우에도 오직 rank 네임스페이스에만 방장 등록/유지
        if ("rank".equals(gameMode)) {
            roomOwners.computeIfAbsent("rank", k -> new ConcurrentHashMap<>())
                    .putIfAbsent(roomNo, userNick); // 이미 있으면 유지
            serverUsers.computeIfAbsent("rank", k -> ConcurrentHashMap.newKeySet()).add(userNick);
            serverSessions.computeIfAbsent("rank", k -> ConcurrentHashMap.newKeySet()).add(session);
        } else {
            roomOwners.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
                    .putIfAbsent(roomNo, userNick);
        }

        broadcastRoomList(server);
        broadcastRoomUserList(server, roomNo);


		if ("rank".equals(gameMode) && startedRankRooms.add(roomNo)) {
		    new Timer().schedule(new TimerTask() {
		        @Override
		        public void run() {
		            handleStartGame(roomNo, category, server);
		        }
		    }, 10_000);
		}
    }

    
    // 게임 나가기
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

            String owner = roomOwners.getOrDefault(server, Collections.emptyMap()).get(roomNo);
            if (owner != null && owner.equals(userNick)) {
                // 방장이 나가면 남은 유저 중 한 명을 새 방장으로 지정
                if (!users.isEmpty()) {
                    String newOwner = users.iterator().next();
                    roomOwners.get(server).put(roomNo, newOwner);
                } else {
                    // 방에 아무도 없으면 방장 정보 제거
                    roomOwners.get(server).remove(roomNo);
                }
            }

            // 방 인원이 0명이면 방 삭제
            if (users.isEmpty()) {
                roomUserMap.remove(roomNo);
                List<GameRoomDTO> rooms = serverRooms.getOrDefault(server, Collections.emptyList());
                rooms.removeIf(room -> room.getGameroom_no().equals(roomNo));
            }
        }

        // ★ rank에서도 유저 제거 (랭크방 나갈 때) ★
        Set<String> rankUsers = serverUsers.get("rank");
        if (rankUsers != null) {
            rankUsers.remove(userNick);
        }

        // 방 목록, 유저 목록 전체 브로드캐스트
        broadcastRoomList(server);
        broadcastUserList(server);
        broadcastRoomUserList(server, roomNo);
    }

    
    // 방별 유저 리스트
    private void handleUserList(WebSocketSession session, JsonNode json) {
    	String roomNo = json.get("roomNo").asText();
    	String server = json.get("server").asText();
    	if (server == null || roomNo == null) return;
    	
    	String userNick = (String) session.getAttributes().get("userNick");
    	
    	
    	Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(server, Collections.emptyMap());
        Set<String> userNicks = roomUserMap.getOrDefault(roomNo, Collections.emptySet());
        List<String> userList = new ArrayList<>(userNicks);
        
        Map<String, Object> payload = Map.of(
            "type", "roomUserList",
            "server", server,
            "roomNo", roomNo,
            "userNick", userNick,
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
        broadcastRoomUserList(server, roomNo);
    }
    
    // 일반 모드 게임 시작
    private void handleStartGame(WebSocketSession session, JsonNode json) {
    	String server = json.get("server").asText();
    	String roomNo = json.get("roomNo").asText();
    	String userNick = json.get("userNick").asText();
    	String category = json.get("category").asText();

    	if (server == null || userNick == null || roomNo == null || category == null) {
    		return;
    	}
    	
    	// 방장체크
    	String owner = roomOwners.getOrDefault(server, Collections.emptyMap()).get(roomNo);
        if (owner == null || !owner.equals(userNick)) {
            System.out.println("❌  요청 무시 - 방장 아님: " + userNick);
            return;
        }
    	
    	System.out.println("게임 시작 요청 (방장) by " + userNick + " in room " + roomNo);
        List<QuestionDTO> list = playService.getQuestionsByCategory(category);

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
        int nextId = currentQuestionId.getAndIncrement();

        Map<String, Object> payload = Map.of(
            "type", "gameStart",
            "server", server,
            "roomNo", roomNo,
            "initiator", initiator,
            "list", list,
            "nextId", nextId
        );
        
        System.out.println("가져온 문제" + payload);

        broadcast(server, payload);
    }
    
    private void handleStopGame(WebSocketSession session, JsonNode json) {
    	String server = json.get("server").asText();
        String roomNo = json.get("roomNo").asText();
        String userNick = json.get("userNick").asText();
        
        if (server == null || userNick == null || roomNo == null) {
    		return;
    	}
        
        // 방장체크
        String owner = roomOwners.getOrDefault(server, Collections.emptyMap()).get(roomNo);
        if (owner == null || !owner.equals(userNick)) {
            System.out.println("❌  요청 무시 - 방장 아님: " + userNick);
            return;
        }
        
        System.out.println("게임 중지 요청 (방장) by " + userNick + " in room " + roomNo);
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
        String gameMode = json.has("game_mode") ? json.get("game_mode").asText() : "normal"; // 혹시 없을 때 default

        if (server == null || userNick == null || roomNo == null) {
            return;
        }
        
        // 게임 모드에 따른 서버 분기처리
        String broadcastServer = "rank".equals(gameMode) ? "rank" : server;

        // 방장 체크 - 랭크는 "rank" 네임스페이스, 일반은 server별
        String owner;
        if ("rank".equals(gameMode)) {
            owner = roomOwners.getOrDefault("rank", Collections.emptyMap()).get(roomNo);
        } else {
            owner = roomOwners.getOrDefault(server, Collections.emptyMap()).get(roomNo);
        }
        System.out.println("방장 : " + owner);

        if (owner == null || !owner.equals(userNick)) {
            System.out.println("❌  요청 무시 - 방장 아님: " + userNick);
            return;
        }

        System.out.println("다음 문제 요청 (방장) by " + userNick + " in room " + roomNo);

        // 문제 번호 관리도 랭크/일반 구분
        AtomicInteger currentQuestionId;
        if ("rank".equals(gameMode)) {
            currentQuestionId = roomQuestionIds
                .computeIfAbsent("rank", k -> new ConcurrentHashMap<>())
                .computeIfAbsent(roomNo, k -> new AtomicInteger(1));
        } else {
            currentQuestionId = roomQuestionIds
                .computeIfAbsent(server, k -> new ConcurrentHashMap<>())
                .computeIfAbsent(roomNo, k -> new AtomicInteger(1));
        }
        int nextId = currentQuestionId.getAndIncrement();

        Map<String, Object> payload = Map.of(
            "type", "nextQuestion",
            "server", broadcastServer,
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
        String gameMode = json.has("game_mode") ? json.get("game_mode").asText() : "normal"; // 혹시 없을 때 default
        
        if (server == null || userNick == null || roomNo == null) {
    		return;
    	}
        
        // 게임 모드에 따른 서버 분기처리
        String broadcastServer = "rank".equals(gameMode) ? "rank" : server;
                
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
    		"server", broadcastServer,
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

    private void broadcastRoomUserList(String server, String roomNo) {
        // 랭크/일반 구분을 위한 ownerKey와 userKey를 일관되게 지정
        String key = "rank".equals(server) ? "rank" : server;

        Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(key, Collections.emptyMap());
        Set<String> userNicks = roomUserMap.getOrDefault(roomNo, Collections.emptySet());
        List<String> userList = new ArrayList<>(userNicks);

        String owner = null;
        Map<String, String> owners = roomOwners.get(key);
        if (owners != null) {
            owner = owners.get(roomNo);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "roomUserList");
        payload.put("server", key); // 항상 "rank" 또는 server
        payload.put("roomNo", roomNo);
        payload.put("userList", userList);
        payload.put("owner", owner);

        broadcast(key, payload);
    }



    
    private void broadcast(String server, Object data) {
        String json;
        try {
            json = objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return;
        }
        Set<WebSocketSession> sessions = serverSessions.getOrDefault(server, Collections.emptySet());
        sessions.forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            } catch (Exception e) {
                e.printStackTrace(); // 꼭 콘솔로 찍어두세요!
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

            // ★ rank에서도 유저 제거 ★
            Set<String> rankUsers = serverUsers.get("rank");
            if (rankUsers != null) {
                rankUsers.remove(userNick);
            }

            Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(server, Collections.emptyMap());
            List<String> emptyRooms = new ArrayList<>();

            for (Map.Entry<String, Set<String>> entry : roomUserMap.entrySet()) {
                String roomNo = entry.getKey();
                Set<String> users = entry.getValue();
                users.remove(userNick);

                String owner = roomOwners.getOrDefault(server, Collections.emptyMap()).get(roomNo);
                if (owner != null && owner.equals(userNick)) {
                    if (!users.isEmpty()) {
                        String newOwner = users.iterator().next();
                        roomOwners.get(server).put(roomNo, newOwner);
                    } else {
                        roomOwners.get(server).remove(roomNo);
                    }
                }
                if (users.isEmpty()) {
                    emptyRooms.add(roomNo);
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
                            roomOwners.get(server).remove(roomNo);
                        }
                    }
                }, 5000); // 5초 후 체크
            }

            broadcastUserList(server);
            broadcastRoomList(server);
        }
    }



}
