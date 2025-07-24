package org.joonzis.websocket;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.joonzis.domain.GameRoomDTO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UserQuestionHistoryDTO;
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

	// 방별 문제 리스트
	private final Map<String, Map<String, List<QuestionDTO>>> roomQuestionList = new ConcurrentHashMap<>();

	// 방별 문제 Id
	private final Map<String, Map<String, AtomicInteger>> roomQuestionIds = new ConcurrentHashMap<>();

	// 방별 유저별 점수
	private final Map<String, Map<String, Map<String, AtomicInteger>>> roomScores = new ConcurrentHashMap<>();

	// 방별 문제별로, 정답 제출한 유저 set 관리
	private final Map<String, Map<String, Map<Integer, Set<String>>>> answerSubmittedUsers = new ConcurrentHashMap<>();

	// 문제 푸는 소요 시간
	private final Map<String, Map<String, Map<String, Double>>> roomElapsedTimes = new ConcurrentHashMap<>();

	// 방별 시작 중지 상태
	private final Map<String, Map<String, String>> roomStatus = new ConcurrentHashMap<>();

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
		case "submitAnswer":
			handleSubmitAnswer(session, json);
			break;
		case "rewardPointsAndSaveUserHistory":
			handleRewardPointsAndSaveUserHistory(session, json);
			break;
		 case "joinQuestionReviewRoom":
         	handleJoinQuestionReviewRoom(session, json);
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
		// String server = (String) session.getAttributes().get("server");
		String userNick = (String) session.getAttributes().get("userNick");
		// if (server == null) return;

		// 방 생성 정보 파싱
		String roomNo = json.has("gameroom_no") ? json.get("gameroom_no").asText()
				: String.valueOf(roomIndex.getAndIncrement());

		String server = json.has("server") ? json.get("server").asText()
				: (String) session.getAttributes().get("server");

		String gameMode = json.get("game_mode").asText();

		GameRoomDTO newRoom = new GameRoomDTO(roomNo, json.get("title").asText(), json.get("category").asText(),
				gameMode, json.get("is_private").asText(), json.get("limit").asInt(),
				json.get("pwd") != null ? json.get("pwd").asText() : null);

		// 게임 모드 분기
		if ("normal".equals(newRoom.getGame_mode())) {
			// 서버별 방 목록 업데이트
			serverRooms.computeIfAbsent(server, k -> new ArrayList<>()).add(newRoom);

			roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
					.computeIfAbsent(newRoom.getGameroom_no(), k -> ConcurrentHashMap.newKeySet()).add(userNick);
			// 모든 클라이언트에게 방 목록 브로드캐스트
			broadcastRoomList(server);
		}

		String ownerKey = "rank".equals(gameMode) ? "rank" : server;
		roomOwners.computeIfAbsent(ownerKey, k -> new ConcurrentHashMap<>()).put(roomNo, userNick);

		try {
			String msg = objectMapper.writeValueAsString(Map.of("type", "roomCreated", "server", server, "gameroom_no",
					newRoom.getGameroom_no(), "category", newRoom.getCategory(), "game_mode", newRoom.getGame_mode()));
			if (session.isOpen()) {
				session.sendMessage(new TextMessage(msg));
			}
		} catch (Exception e) {
			System.out.println(e);
		}
	}

	// 방 참가
	private void handleJoinRoom(WebSocketSession session, JsonNode json) {
		String server = json.has("server") ? json.get("server").asText()
				: (String) session.getAttributes().get("server");
		String roomNo = json.get("roomNo").asText();
		String userNick = json.get("userNick").asText();
		String gameMode = json.get("game_mode").asText();
		String category = json.get("category").asText();
		String status = roomStatus.getOrDefault(server, Collections.emptyMap()).get(roomNo);
		System.out.println("상태" + status);
		// 게임 중 입장 거부
		if ("playing".equals(status)) {
			System.out.println("게임 플레이 중");
			try {
				// JSON으로 메시지 전송
				session.sendMessage(new TextMessage(
						objectMapper.writeValueAsString(Map.of("type", "joinDenied", "reason", "방이 이미 게임 중입니다."))));
			} catch (Exception e) {
			}
			return;
		} else {
			try {
				// JSON으로 메시지 전송
				session.sendMessage(new TextMessage(
						objectMapper.writeValueAsString(Map.of("type", "joinRoom", "roomNo", roomNo, "gameMode", gameMode))));
			} catch (Exception e) {
			}
		}

		roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
				.computeIfAbsent(roomNo, k -> ConcurrentHashMap.newKeySet()).add(userNick);

		// 랭크방일 경우에도 오직 rank 네임스페이스에만 방장 등록/유지
		if ("rank".equals(gameMode)) {
			roomOwners.computeIfAbsent("rank", k -> new ConcurrentHashMap<>()).putIfAbsent(roomNo, userNick); // 이미 있으면
																												// 유지
			serverUsers.computeIfAbsent("rank", k -> ConcurrentHashMap.newKeySet()).add(userNick);
			serverSessions.computeIfAbsent("rank", k -> ConcurrentHashMap.newKeySet()).add(session);
		} else {
			roomOwners.computeIfAbsent(server, k -> new ConcurrentHashMap<>()).putIfAbsent(roomNo, userNick);
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
    
    private void handleJoinQuestionReviewRoom(WebSocketSession session, JsonNode json) {
    	String server = (String) session.getAttributes().get("server");
    	String userNick = json.get("userNick").asText();
    	String roomNo = "questionReview";
    	
    	roomUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
        .computeIfAbsent(roomNo, k -> ConcurrentHashMap.newKeySet())
        .add(userNick);
    	Map<String, Object> payload = Map.of(
            "type", "joinQuestionReviewRoom",
            "server", server,
            "roomNo", roomNo,
            "player", userNick
        );
    	sendMessageToSession(session, payload);
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
		if (server == null || roomNo == null)
			return;

		String userNick = (String) session.getAttributes().get("userNick");

		Map<String, Set<String>> roomUserMap = roomUsers.getOrDefault(server, Collections.emptyMap());
		Set<String> userNicks = roomUserMap.getOrDefault(roomNo, Collections.emptySet());
		List<String> userList = new ArrayList<>(userNicks);

		Map<String, Object> payload = Map.of("type", "roomUserList", "server", server, "roomNo", roomNo, "userNick",
				userNick, "userList", userList);

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
			return;
		}

		List<QuestionDTO> list = playService.getQuestionsByCategory(category);
		roomQuestionList.computeIfAbsent(server, k -> new ConcurrentHashMap<>()).put(roomNo, list);

		// 방별 questionId 초기화
		AtomicInteger currentQuestionId = roomQuestionIds.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
				.computeIfAbsent(roomNo, k -> new AtomicInteger(0));
		
		roomElapsedTimes.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
    		.put(roomNo, new ConcurrentHashMap<>());

		answerSubmittedUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>()).remove(roomNo);

		currentQuestionId.set(0);
		int nextId = currentQuestionId.getAndIncrement();

		roomStatus.computeIfAbsent(server, k -> new ConcurrentHashMap<>()).put(roomNo, "playing");

		// 참가자 점수 초기화
		Map<String, Map<String, AtomicInteger>> serverScoreMap = roomScores.computeIfAbsent(server,
				k -> new ConcurrentHashMap<>());
		Map<String, AtomicInteger> roomScoreMap = serverScoreMap.computeIfAbsent(roomNo,
				k -> new ConcurrentHashMap<>());
		Set<String> users = roomUsers.getOrDefault(server, Collections.emptyMap()).getOrDefault(roomNo,
				Collections.emptySet());
		for (String user : users) {
			roomScoreMap.put(user, new AtomicInteger(0));
		}

		Map<String, Object> payload = Map.of("type", "gameStart", "server", server, "roomNo", roomNo, "initiator",
				userNick, "list", list, "nextId", nextId);

		broadcast(server, payload);
	}

	// 랭크 모드 게임 시작
	private void handleStartGame(String roomNo, String category, String server) {
		Set<String> userNicks = roomUsers.getOrDefault(server, Collections.emptyMap()).getOrDefault(roomNo,
				Collections.emptySet());
		if (userNicks.isEmpty()) {
			return;
		}

		String initiator = userNicks.iterator().next();
		List<QuestionDTO> list = playService.getQuestionsByCategory(category);
		roomQuestionList.computeIfAbsent(server, k -> new ConcurrentHashMap<>()).put(roomNo, list);

		AtomicInteger currentQuestionId = roomQuestionIds.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
				.computeIfAbsent(roomNo, k -> new AtomicInteger(0));
		currentQuestionId.set(0);
		
		roomElapsedTimes.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
        	.put(roomNo, new ConcurrentHashMap<>());

		answerSubmittedUsers.computeIfAbsent(server, k -> new ConcurrentHashMap<>()).remove(roomNo);
		int nextId = currentQuestionId.getAndIncrement();

		roomStatus.computeIfAbsent(server, k -> new ConcurrentHashMap<>()).put(roomNo, "playing");

		Map<String, Object> payload = Map.of("type", "gameStart", "server", server, "roomNo", roomNo, "initiator",
				initiator, "list", list, "nextId", nextId);
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
			return;
		}

		AtomicInteger currentQuestionId = roomQuestionIds.computeIfAbsent(server, k -> new ConcurrentHashMap<>())
				.computeIfAbsent(roomNo, k -> new AtomicInteger(0));
		currentQuestionId.set(0);

		roomStatus.getOrDefault(server, Collections.emptyMap()).put(roomNo, "waiting");

		// 해당 방의 모든 유저에게 게임 중지 메시지 브로드캐스트
		Map<String, Object> payload = Map.of("type", "gameStop", "server", server, "roomNo", roomNo, "initiator",
				userNick);
		broadcast(server, payload);
	}

	private void handleSubmitAnswer(WebSocketSession session, JsonNode json) {
		// 1. 데이터 파싱
		String server = json.get("server").asText();
		String roomNo = json.get("roomNo").asText();
		String userNick = json.get("userNick").asText();
		int answer = json.get("answer").asInt(); // 유저가 제출한 답
		String gameMode = json.has("game_mode") ? json.get("game_mode").asText() : "normal";

		if (server == null || roomNo == null || userNick == null)
			return;

		// 2. 서버에 저장된 문제 인덱스
		String broadcastServer = "rank".equals(gameMode) ? "rank" : server;

		// 문제 인덱스
		int questionIdx;
		if (json.has("questionIndex")) {
			questionIdx = json.get("questionIndex").asInt();
		} else {
			AtomicInteger currentQuestionId = roomQuestionIds
					.computeIfAbsent(broadcastServer, k -> new ConcurrentHashMap<>())
					.computeIfAbsent(roomNo, k -> new AtomicInteger(0));
			questionIdx = currentQuestionId.get() - 1;
			if (questionIdx < 0)
				questionIdx = 0;
		}

		// 3. 문제 리스트에서 인덱스로 문제 가져옴
		List<QuestionDTO> questionList = roomQuestionList.getOrDefault(broadcastServer, Collections.emptyMap())
				.getOrDefault(roomNo, Collections.emptyList());
		if (questionIdx < 0 || questionIdx >= questionList.size())
			return;

		QuestionDTO curQ = questionList.get(questionIdx);

		// 4. 정답 비교
		boolean isCorrect = curQ.getCorrect_answer() == answer;

		// 5. 점수 증가(정답일 때만)
		Map<String, Map<String, AtomicInteger>> serverScoreMap = roomScores.computeIfAbsent(broadcastServer,
				k -> new ConcurrentHashMap<>());
		Map<String, AtomicInteger> roomScoreMap = serverScoreMap.computeIfAbsent(roomNo,
				k -> new ConcurrentHashMap<>());
		AtomicInteger userScore = roomScoreMap.computeIfAbsent(userNick, k -> new AtomicInteger(0));
		if (isCorrect) {
			userScore.incrementAndGet();
		}
		Map<String, Integer> scores = new HashMap<>();
		for (Map.Entry<String, AtomicInteger> entry : roomScoreMap.entrySet()) {
			scores.put(entry.getKey(), entry.getValue().get());
		}

		// ⭐ 6. 소요 시간 누적
		double spentTime = json.has("spentTime") ? json.get("spentTime").asDouble() : 0.0;
		Map<String, Map<String, Double>> serverElapsedMap = roomElapsedTimes.computeIfAbsent(broadcastServer,
				k -> new ConcurrentHashMap<>());
		Map<String, Double> roomElapsedMap = serverElapsedMap.computeIfAbsent(roomNo, k -> new ConcurrentHashMap<>());
		roomElapsedMap.put(userNick, roomElapsedMap.getOrDefault(userNick, 0.0) + spentTime);

		// ⭐ 7. 모든 유저의 누적 소요시간(초) Map 생성
		Map<String, Double> elapsedTimes = new HashMap<>();
		for (Map.Entry<String, Double> entry : roomElapsedMap.entrySet()) {
			elapsedTimes.put(entry.getKey(), entry.getValue());
		}

		// 8. 제출 유저 처리
		answerSubmittedUsers.computeIfAbsent(broadcastServer, k -> new ConcurrentHashMap<>())
				.computeIfAbsent(roomNo, k -> new ConcurrentHashMap<>())
				.computeIfAbsent(questionIdx, k -> ConcurrentHashMap.newKeySet()).add(userNick);

		int totalUsers = roomUsers.getOrDefault(broadcastServer, Collections.emptyMap())
				.getOrDefault(roomNo, Collections.emptySet()).size();
		int submitted = answerSubmittedUsers.get(broadcastServer).get(roomNo).get(questionIdx).size();

		// 9. 브로드캐스트 (점수 및 정답 여부, 누적 시간까지)
		Map<String, Object> payload = Map.of("type", "sumScore", 
											 "server", broadcastServer, 
											 "roomNo", roomNo,
											 "userNick", userNick, 
											 "isCorrect", isCorrect, 
											 "answer", answer, 
											 "correctAnswer", curQ.getCorrect_answer(), 
											 "questionIdx", questionIdx, 
											 "scores", scores, 
											 "elapsedTimes", elapsedTimes // ⭐
		);
		broadcast(broadcastServer, payload);

		if (submitted == totalUsers) {
			sendNextQuestion(broadcastServer, roomNo, questionIdx + 1);
		}

		// 10. 모든 유저가 제출 완료 → 자동 다음 문제로!
//        if (submitted == totalUsers) {
//            sendNextQuestion(broadcastServer, roomNo, questionIdx + 1);
//        }
	}

	private void sendNextQuestion(String server, String roomNo, int nextIdx) {
		// 문제리스트 길이 체크 (마지막 문제 처리)
		List<QuestionDTO> questionList = roomQuestionList.getOrDefault(server, Collections.emptyMap())
				.getOrDefault(roomNo, Collections.emptyList());

		roomQuestionIds.getOrDefault(server, Collections.emptyMap()).getOrDefault(roomNo, new AtomicInteger())
				.set(nextIdx);
		// 모든 유저에게 브로드캐스트
		Map<String, Object> payload = Map.of("type", "nextQuestion", "server", server, "roomNo", roomNo, "initiator",
				"SERVER", "nextId", nextIdx);
		broadcast(server, payload);
	}

    private void handleRewardPointsAndSaveUserHistory(WebSocketSession session, JsonNode json) {
    	String server = json.get("server").asText();
        String roomNo = json.get("roomNo").asText();
        String user_nick = json.get("userNick").asText();
        JsonNode historyArray = json.get("history");
        int point = json.get("point").asInt();
        int rankPoint = json.get("rankPoint").asInt();
        int myRank = json.get("myRank").asInt();
        
        if (server == null || user_nick == null || roomNo == null) {
    		return;
    	}
        
<<<<<<< Updated upstream
        if (myRank == 1) {
        	playService.countFirst(user_nick);
        }
=======
        roomStatus.getOrDefault(server, Collections.emptyMap()).put(roomNo, "waiting");
>>>>>>> Stashed changes
        
        String historyUuid = UUID.randomUUID().toString();
        
        playService.increaseRewardPoints(point, rankPoint, user_nick);
        
        List<UserQuestionHistoryDTO> historyList = new ArrayList<>();
        for (JsonNode item : historyArray) {
            UserQuestionHistoryDTO dto = new UserQuestionHistoryDTO();
            dto.setUser_nick(user_nick);
            dto.setQuestion_id(item.get("question_id").asInt());
            dto.setSubject(item.get("subject").asText());
            dto.setSelected_answer(item.get("selected_answer").asInt());
            dto.setCorrect_answer(item.get("correct_answer").asInt());
            dto.set_correct(item.get("is_correct").asBoolean());
            dto.setSubmitted_at(historyUuid);
            // 필요하면 roomNo, 게임모드 등도 같이
            historyList.add(dto);
        }
        playService.saveUserHistory(historyList);
        
        
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
	    List<WebSocketSession> closedSessions = new ArrayList<>();

	    // ArrayList로 복사 후 반복 (ConcurrentModificationException 방지)
	    for (WebSocketSession session : new ArrayList<>(sessions)) {
	        try {
	            if (session.isOpen()) {
	                synchronized (session) { // 한 세션 동시 전송 방지
	                    session.sendMessage(new TextMessage(json));
	                }
	            } else {
	                closedSessions.add(session);
	            }
	        } catch (IllegalStateException e) {
	            closedSessions.add(session);
	            System.out.println("WebSocket 세션 상태 오류: " + e.getMessage());
	        } catch (Exception e) {
	            closedSessions.add(session);
	            System.out.println("WebSocket 기타 오류: " + e.getMessage());
	        }
	    }
	    closedSessions.forEach(sessions::remove);
	}
	
	private void sendMessageToSession(WebSocketSession session, Map<String, Object> payload) {
	    try {
	        ObjectMapper objectMapper = new ObjectMapper();
	        String json = objectMapper.writeValueAsString(payload);
	        session.sendMessage(new TextMessage(json));
	    } catch (Exception e) {
	        e.printStackTrace();
	    }
	}

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
