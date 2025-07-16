package org.joonzis.websocket;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.service.UserService;
import org.joonzis.websocket.util.UserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.log4j.Log4j;
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
        String fontColorName = data.get("fontColorName");
        if ("join".equals(action) && server != null && userNick != null) {
            removeSessionFromAllServers(session);
            serverSessions.putIfAbsent(server, new ConcurrentHashMap<>());
            serverSessions.get(server).put(session, new UserInfo(userNick, userNo, bgName, blName, bdName, titleName, fontColorName));
//            log.info("[WebSocket] 세션 추가됨. 서버: " + server + ", 세션ID: " + session.getId()
//            + ", 현재 접속 유저 수: " + serverSessions.get(server).size());
            // 3) 해당 서버에 접속한 유저 목록 전송
            broadcastUserList(server);
        }
        else if ("updateStyle".equals(action) && userNo != null) {
//            log.info("[Server] updateStyle 요청 수신 userNo=" + userNo);
            UserInfoDecoDTO updatedUser = userService.getUserInfoByUserNo(Integer.parseInt(userNo));
            if (updatedUser == null) {
//                log.warn("해당 userNo의 유저 정보를 DB에서 찾을 수 없습니다: " + userNo);
                return;
            }
//            log.info("DB에서 조회한 최신 유저 정보: " + updatedUser);
            String userServer = findServerByUserNo(userNo);
            if (userServer == null) {
//                log.warn("userNo=" + userNo + "가 접속한 서버를 찾을 수 없음");
                return;
            }
            Map<WebSocketSession, UserInfo> sessions = serverSessions.get(userServer);
            if (sessions != null) {
                boolean updated = false;
                for (Map.Entry<WebSocketSession, UserInfo> entry : sessions.entrySet()) {
                    UserInfo info = entry.getValue();
                    if (userNo.equals(info.getUserNo())) {
                        info.setBgName(updatedUser.getBackground_class_name());
                        info.setBlName(updatedUser.getBalloon_class_name());
                        info.setBdName(updatedUser.getBoundary_class_name());
                        info.setTitleName(updatedUser.getTitle_class_name());
                        info.setFontColorName(updatedUser.getFontcolor_class_name());
                        updated = true;
                    }
                }
                if (updated) {
                    broadcastUserList(userServer);
                    broadcastStyleUpdateToAll(userNo);
                } else {
//                    log.warn("해당 userNo에 해당하는 UserInfo가 세션에 존재하지 않음: " + userNo);
                }
            } else {
//                log.warn("해당 서버에 접속 세션이 없음: " + userServer);
            }
        }
    }
    private void broadcastStyleUpdateToAll(String userNo) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "styleUpdated");
        payload.put("userNo", userNo);
        String json = objectMapper.writeValueAsString(payload);
        TextMessage message = new TextMessage(json);
        for (Map<WebSocketSession, UserInfo> sessionMap : serverSessions.values()) {
            for (WebSocketSession session : sessionMap.keySet()) {
            	 if (session.isOpen()) {
//                     log.info("Sending styleUpdated to session: " + session.getId());
                     session.sendMessage(message);
                 } else {
//                     log.warn("WebSocket session closed: " + session.getId());
                 }
            }
        }
    }
    // userNo에 해당하는 서버 찾기 메서드 구현
    private String findServerByUserNo(String userNo) {
        for (Map.Entry<String, Map<WebSocketSession, UserInfo>> entry : serverSessions.entrySet()) {
            for (UserInfo userInfo : entry.getValue().values()) {
                if (userNo.equals(userInfo.getUserNo())) {
//                	log.info("findServerByUserNo: userNo=" + userNo + "는 서버 '" + entry.getKey() + "'에 접속 중");
                    return entry.getKey();
                }
            }
        }
//        log.warn("findServerByUserNo: userNo=" + userNo + "는 어느 서버에도 접속 중이지 않음");
        return null;
    }
    public void notifyUserStyleUpdate(String userNo) throws Exception {
//        log.info("[Server] updateStyle 요청 수신 userNo=" + userNo);
        String server = findServerByUserNo(userNo);  // ① 서버 탐색
        UserInfoDecoDTO updatedUser = userService.getUserInfoByUserNo(Integer.parseInt(userNo));  // ② DB 조회
//        log.info(updatedUser);
        if (updatedUser == null) return;  // :느낌표: A: 여기서 return 되면 그 이후 실행 안 됨
        boolean updated = false;
        if (server != null) {
//            log.info("[Server] 찾음 해당 서버만 적용");
            Map<WebSocketSession, UserInfo> sessions = serverSessions.get(server);
            updated = updateUserStyleInSessions(sessions, userNo, updatedUser);
            if (updated) {
                broadcastUserList(server);
                return; // :느낌표: B: 여기서 return 되면 fallback은 실행 안 됨
            }
        }
        // :흰색_확인_표시: 기대하는 fallback
        for (String s : serverSessions.keySet()) {
//            log.info("[Server] 못 찾음 모든 서버에 적용 시도: server=" + s);
            Map<WebSocketSession, UserInfo> sessions = serverSessions.get(s);
            for (Map.Entry<WebSocketSession, UserInfo> entry : sessions.entrySet()) {
//                log.info("유저 확인: sessionUserNo=" + entry.getValue().getUserNo());
            }
            if (updateUserStyleInSessions(sessions, userNo, updatedUser)) {
//                log.warn("fallback broadcast: userNo=" + userNo + "에 대해 서버 '" + s + "'에 적용");
                broadcastUserList(s);
            }
        }
    }
    private boolean updateUserStyleInSessions(Map<WebSocketSession, UserInfo> sessions, String userNo, UserInfoDecoDTO updatedUser) {
        if (sessions == null) return false;
        boolean updated = false;
        for (Map.Entry<WebSocketSession, UserInfo> entry : sessions.entrySet()) {
            UserInfo info = entry.getValue();
            if (userNo.equals(String.valueOf(info.getUserNo()))) {
                info.setBgName(updatedUser.getBackground_class_name());
                info.setBlName(updatedUser.getBalloon_class_name());
                info.setBdName(updatedUser.getBoundary_class_name());
                info.setTitleName(updatedUser.getTitle_class_name());
                info.setFontColorName(updatedUser.getFontcolor_class_name());
                updated = true;
            }
        }
        return updated;
    }
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
//        log.info("[Server] WebSocket 연결 수립: " + session.getId());
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
//            	log.info("[WebSocket] 세션 제거됨. 서버: " + server + ", 세션ID: " + session.getId()
//                + ", 남은 유저 수: " + sessions.size());
                broadcastUserList(server);
            }
        }
    }
    private void broadcastUserList(String server) throws Exception {
    	Map<WebSocketSession, UserInfo> sessions = serverSessions.get(server);
    	if (sessions == null) {
//            log.warn("broadcastUserList: 서버에 세션이 없음: " + server);
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
            userMap.put("fontColorName", userInfo.getFontColorName());
            userList.add(userMap);
        }
        // 응답 JSON 생성
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "userList");
        payload.put("server", server);
        payload.put("users", userList);
        String json = objectMapper.writeValueAsString(payload);
        TextMessage msg = new TextMessage(json);
//        log.info("broadcastUserList: 서버 '" + server + "'에 " + sessions.size() + "개의 세션에 메시지 전송 시작");
        // 모든 세션에 전송
        for (WebSocketSession sess : sessions.keySet()) {
            if (sess.isOpen()) {
//            	log.info("sendMessage to session: " + sess.getId());
                sess.sendMessage(msg);
            } else {
//                log.warn("세션 닫힘 상태, 메시지 전송 불가: " + sess.getId());
            }
        }
//        log.info("broadcastUserList: 메시지 전송 완료");
    }
}