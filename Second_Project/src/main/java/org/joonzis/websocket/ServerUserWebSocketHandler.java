package org.joonzis.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.log4j.Log4j;

import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.service.UserService;
import org.joonzis.websocket.util.UserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Log4j
@Component
public class ServerUserWebSocketHandler extends TextWebSocketHandler {

    // 서버 ID -> (세션 -> 유저ID) 매핑
	private final Map<String, Map<WebSocketSession, UserInfo>> serverSessions = new ConcurrentHashMap<>();

	@Autowired
    private UserService userService;
	
    @Autowired
    private ObjectMapper objectMapper; // Jackson 사용

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        
        Map<String, String> data = objectMapper.readValue(payload, new TypeReference<Map<String, String>>() {});
        
        String action = data.get("action");
        String server = data.get("server");
        String userNick = data.get("userNick");
        String userNo = data.get("userNo");
        String bgName = data.get("bgName");
        String blName = data.get("blName");
        String bdName = data.get("bdName");
        String titleName = data.get("titleName");

        if ("join".equals(action) && server != null && userNick != null) {
            removeSessionFromAllServers(session);

            serverSessions.putIfAbsent(server, new ConcurrentHashMap<>());
            serverSessions.get(server).put(session, new UserInfo(userNick, userNo, bgName, blName, bdName, titleName));
            
            log.info("[WebSocket] 세션 추가됨. 서버: " + server + ", 세션ID: " + session.getId() 
            + ", 현재 접속 유저 수: " + serverSessions.get(server).size());

            // 3) 해당 서버에 접속한 유저 목록 전송
            broadcastUserList(server);
        }
        else if ("updateStyle".equals(action) && userNo != null) {
            log.info("[Server] updateStyle 요청 수신 userNo=" + userNo);

            // 1. 유저 최신 정보 DB에서 조회
            UserInfoDecoDTO updatedUser = userService.getUserInfoByUserNo(Integer.parseInt(userNo));
            if (updatedUser == null) {
                log.warn("해당 userNo의 유저 정보를 DB에서 찾을 수 없습니다: " + userNo);
                return;
            }
            log.info("DB에서 조회한 최신 유저 정보: " + updatedUser);

            // 2. 해당 유저가 접속한 서버 찾기
            String userServer = findServerByUserNo(userNo);
            if (userServer == null) {
                log.warn("userNo=" + userNo + "가 접속한 서버를 찾을 수 없음");
                return;
            }

            // 3. 서버Sessions에 해당 세션(들)의 UserInfo 업데이트
            Map<WebSocketSession, UserInfo> sessions = serverSessions.get(userServer);
            if (sessions != null) {
            	log.info("해당 서버 접속 세션 수: " + sessions.size());
                boolean updated = false;
                for (Map.Entry<WebSocketSession, UserInfo> entry : sessions.entrySet()) {
                    UserInfo info = entry.getValue();
                    log.info("세션 " + entry.getKey().getId() + " 유저No: " + info.getUserNo());
                    if (userNo.equals(info.getUserNo())) {
                        // UserInfo 업데이트
                    	log.info("UserInfo 업데이트 전: " + info);
                        info.setBgName(updatedUser.getBackground_class_name());
                        info.setBlName(updatedUser.getBalloon_class_name());
                        info.setBdName(updatedUser.getBoundary_class_name());
                        info.setTitleName(updatedUser.getTitle_class_name());
                        log.info("UserInfo 업데이트 후: " + info);
                        updated = true;
                    }
                }
                if (!updated) {
                    log.warn("해당 userNo에 해당하는 UserInfo가 세션에 존재하지 않음: " + userNo);
                }
            } else {
                log.warn("해당 서버에 접속 세션이 없음: " + userServer);
            }
            

            // 4. 최신 유저 목록 다시 브로드캐스트
            broadcastUserList(userServer);
        }
    }
    
    // userNo에 해당하는 서버 찾기 메서드 구현
    private String findServerByUserNo(String userNo) {
        for (Map.Entry<String, Map<WebSocketSession, UserInfo>> entry : serverSessions.entrySet()) {
            for (UserInfo userInfo : entry.getValue().values()) {
                if (userNo.equals(userInfo.getUserNo())) {
                	log.info("findServerByUserNo: userNo=" + userNo + "는 서버 '" + entry.getKey() + "'에 접속 중");
                    return entry.getKey();
                }
            }
        }
        log.warn("findServerByUserNo: userNo=" + userNo + "는 어느 서버에도 접속 중이지 않음");
        return null;
    }
    
    public void notifyUserStyleUpdate(String userNo) throws Exception {
    	log.info("[Server] updateStyle 요청 수신 userNo=" + userNo);
        String server = findServerByUserNo(userNo);
        if (server == null) return;

        // DB에서 최신 유저 정보 조회 및 세션 업데이트
        UserInfoDecoDTO updatedUser = userService.getUserInfoByUserNo(Integer.parseInt(userNo));
        if (updatedUser == null) return;

        Map<WebSocketSession, UserInfo> sessions = serverSessions.get(server);
        if (sessions != null) {
            for (Map.Entry<WebSocketSession, UserInfo> entry : sessions.entrySet()) {
                UserInfo info = entry.getValue();
                if (userNo.equals(info.getUserNo())) {
                    info.setBgName(updatedUser.getBackground_class_name());
                    info.setBlName(updatedUser.getBalloon_class_name());
                    info.setBdName(updatedUser.getBoundary_class_name());
                    info.setTitleName(updatedUser.getTitle_class_name());
                }
            }
        }
        broadcastUserList(server);
    }
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("[Server] WebSocket 연결 수립: " + session.getId());
        super.afterConnectionEstablished(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        removeSessionFromAllServers(session);
    }

    private void removeSessionFromAllServers(WebSocketSession session) throws Exception {
    	for (Map.Entry<String, Map<WebSocketSession, UserInfo>> entry : serverSessions.entrySet()) {
            String server = entry.getKey();
            Map<WebSocketSession, UserInfo> sessions = entry.getValue();

            if (sessions.remove(session) != null) {
            	log.info("[WebSocket] 세션 제거됨. 서버: " + server + ", 세션ID: " + session.getId()
                + ", 남은 유저 수: " + sessions.size());
                broadcastUserList(server);
            }
        }
    }

    private void broadcastUserList(String server) throws Exception {
    	Map<WebSocketSession, UserInfo> sessions = serverSessions.get(server);
    	if (sessions == null) {
            log.warn("broadcastUserList: 서버에 세션이 없음: " + server);
            return;
        }

        List<Map<String, String>> userList = new ArrayList<>();
        for (UserInfo userInfo : sessions.values()) {
            Map<String, String> userMap = new HashMap<>();
            userMap.put("userNick", userInfo.getUserNick());
            userMap.put("userNo", userInfo.getUserNo());
            userMap.put("bgName", userInfo.getBgName());
            userMap.put("blName", userInfo.getBlName());
            userMap.put("bdName", userInfo.getBdName());
            userMap.put("titleName", userInfo.getTitleName());
            userList.add(userMap);
        }

        // 응답 JSON 생성
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "userList");
        payload.put("server", server);
        payload.put("users", userList);

        String json = objectMapper.writeValueAsString(payload);
        TextMessage msg = new TextMessage(json);

        log.info("broadcastUserList: 서버 '" + server + "'에 " + sessions.size() + "개의 세션에 메시지 전송 시작");
        // 모든 세션에 전송
        for (WebSocketSession sess : sessions.keySet()) {
            if (sess.isOpen()) {
            	log.info("sendMessage to session: " + sess.getId());
                sess.sendMessage(msg);
            } else {
                log.warn("세션 닫힘 상태, 메시지 전송 불가: " + sess.getId());
            }
        }
        log.info("broadcastUserList: 메시지 전송 완료");
    }
}
