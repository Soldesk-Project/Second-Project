package org.joonzis.service.match;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

import org.joonzis.websocket.GameMatchWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class MatchService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private GameMatchWebSocketHandler matchSocketHandler;

    private static final String MATCH_QUEUE_KEY = "match-queue";
    private static final String RANK_KEY_PREFIX = "rank:"; // userId별 점수
    private static final String GROUP_KEY_PREFIX = "match:group:";
    private static final String ACCEPT_KEY_PREFIX = "match:accept:";

    // ✅ 1. 매칭 큐에 유저 등록 (점수는 이미 저장되어 있다고 가정)
    public void enqueue(String userId) {
        redisTemplate.opsForList().rightPush(MATCH_QUEUE_KEY, userId); // FIFO
        System.out.println("✅ 매칭 큐 등록: " + userId);
    }

    // ✅ 2. 큐 사이즈 확인
    public Long queueSize() {
        return redisTemplate.opsForList().size(MATCH_QUEUE_KEY);
    }

    // ✅ 3. 조건에 맞는 n명을 추출 (점수 필터링)
    public List<String> peekAndRemove(int count) {
        Long size = queueSize();
        if (size == null || size == 0) return List.of();

        // 큐에서 모든 유저 꺼냄 (한 번에)
        List<String> allUsers = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            String uid = redisTemplate.opsForList().leftPop("match-queue");
            if (uid != null) allUsers.add(uid);
        }

        // 매칭 그룹 탐색
        for (int i = 0; i < allUsers.size(); i++) {
            String anchorId = allUsers.get(i);
            String anchorScoreStr = redisTemplate.opsForValue().get("rank:" + anchorId);
            int anchorScore = (anchorScoreStr != null) ? Integer.parseInt(anchorScoreStr) : 0;

            List<String> group = new ArrayList<>();
            group.add(anchorId);

            for (int j = 0; j < allUsers.size(); j++) {
                if (i == j) continue;

                String otherId = allUsers.get(j);
                String otherScoreStr = redisTemplate.opsForValue().get("rank:" + otherId);
                int otherScore = (otherScoreStr != null) ? Integer.parseInt(otherScoreStr) : 0;

                if (Math.abs(otherScore - anchorScore) <= 50) {
                    group.add(otherId);
                }

                if (group.size() == count) break;
            }

            if (group.size() == count) {
                // ✅ 매칭 성공 → group 반환
                Set<String> selected = new HashSet<>(group);
                // 나머지 유저는 다시 큐에 복귀
                for (String uid : allUsers) {
                    if (!selected.contains(uid)) {
                        redisTemplate.opsForList().rightPush("match-queue", uid);
                    }
                }
                return group;
            }
        }

        // ✅ 매칭 실패 → 전부 복귀
        for (String uid : allUsers) {
            redisTemplate.opsForList().rightPush("match-queue", uid);
        }

        return List.of();
    }


    // ✅ 4. 매칭 그룹 생성 (수락 대기 상태 저장)
    public void startPendingGroup(List<String> userIds, String groupId) {
        for (String userId : userIds) {
            redisTemplate.opsForValue().set(GROUP_KEY_PREFIX + userId, groupId);
            redisTemplate.opsForHash().put(ACCEPT_KEY_PREFIX + groupId, userId, "false");
        }
    }

    // ✅ 5. 수락 처리
    public void acceptMatch(String userId) {
        String groupId = redisTemplate.opsForValue().get(GROUP_KEY_PREFIX + userId);
        if (groupId == null) return;

        redisTemplate.opsForHash().put(ACCEPT_KEY_PREFIX + groupId, userId, "true");

        Map<Object, Object> statusMap = redisTemplate.opsForHash().entries(ACCEPT_KEY_PREFIX + groupId);
        boolean allAccepted = statusMap.values().stream().allMatch(val -> "true".equals(val));

        if (allAccepted) {
            List<String> users = statusMap.keySet().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());

            int roomNo = createGameRoom(users); // 임시 방 생성

            for (String uid : users) {
                Map<String, Object> msg = Map.of(
                        "type", "MATCH_FOUND",
                        "gameroom_no", roomNo
                );
                matchSocketHandler.sendToUser(uid, msg);

                redisTemplate.delete(GROUP_KEY_PREFIX + uid);
            }

            redisTemplate.delete(ACCEPT_KEY_PREFIX + groupId);
        }
    }

    // ✅ 6. 거절 처리
    public void rejectMatch(String userId) {
        String groupId = redisTemplate.opsForValue().get(GROUP_KEY_PREFIX + userId);
        if (groupId == null) return;

        Map<Object, Object> statusMap = redisTemplate.opsForHash().entries(ACCEPT_KEY_PREFIX + groupId);

        for (Object uidObj : statusMap.keySet()) {
            String uid = uidObj.toString();

            if (!uid.equals(userId)) {
                enqueue(uid); // 다시 큐로 되돌림
                matchSocketHandler.sendToUser(uid, Map.of("type", "MATCH_CANCELLED"));
            }

            redisTemplate.delete(GROUP_KEY_PREFIX + uid);
        }

        redisTemplate.delete(ACCEPT_KEY_PREFIX + groupId);
    }

    // ✅ 7. 임시 방 생성 (랜덤 번호 반환)
    private int createGameRoom(List<String> users) {
        return new Random().nextInt(100000);
    }
}
