package org.joonzis.service.match;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
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

    // ✅ 1. 유저 큐 등록 및 즉시 매칭 시도
    public void enqueue(String userId) {
        List<String> queue = redisTemplate.opsForList().range(MATCH_QUEUE_KEY, 0, -1);
        if (queue != null && queue.contains(userId)) {
            System.out.println("⚠️ 이미 큐에 있음 → " + userId);
            return;
        }

        redisTemplate.opsForList().rightPush(MATCH_QUEUE_KEY, userId);
        System.out.println("✅ 매칭 큐 등록: " + userId);

        List<String> matchGroup = findMatchGroup(4);
        System.out.println("🧪 matchGroup 후보: " + matchGroup);

        if (matchGroup.size() == 4) {
            String groupId = UUID.randomUUID().toString();
            startPendingGroup(matchGroup, groupId);

            for (String uid : matchGroup) {
                redisTemplate.opsForList().remove(MATCH_QUEUE_KEY, 0, uid);
            }

            System.out.println("🎯 매칭 성사 → " + matchGroup);
        } else {
            System.out.println("⏳ 매칭 대기 → 현재 조건 불충분");
        }
    }

    // ✅ 2. 큐 사이즈 확인
    public Long queueSize() {
        return redisTemplate.opsForList().size(MATCH_QUEUE_KEY);
    }

    // ✅ 3. 점수 기준으로 조건 맞는 유저 그룹 찾기 (수락 대기 유저 제외)
    public List<String> findMatchGroup(int count) {
        List<String> allUsers = redisTemplate.opsForList().range(MATCH_QUEUE_KEY, 0, -1);
        if (allUsers == null || allUsers.size() < count) return List.of();

        // 수락 대기 중인 유저 제외
        List<String> filteredUsers = allUsers.stream()
                .filter(uid -> redisTemplate.opsForValue().get(GROUP_KEY_PREFIX + uid) == null)
                .collect(Collectors.toList());

        System.out.println("🧪 현재 큐 유저: " + allUsers);
        System.out.println("🧪 필터링된 유저: " + filteredUsers);

        for (int i = 0; i < filteredUsers.size(); i++) {
            String anchorId = filteredUsers.get(i);
            int anchorScore = getScore(anchorId);

            List<String> group = new ArrayList<>();
            group.add(anchorId);

            for (int j = 0; j < filteredUsers.size(); j++) {
                if (i == j) continue;
                String otherId = filteredUsers.get(j);
                int otherScore = getScore(otherId);

                if (Math.abs(otherScore - anchorScore) <= 50) {
                    group.add(otherId);
                }

                if (group.size() == count) break;
            }

            if (group.size() == count) return group;
        }

        return List.of();
    }

    // ✅ 4. 수락 대기 상태 저장 + 알림 전송
    public void startPendingGroup(List<String> userIds, String groupId) {
        for (String userId : userIds) {
            redisTemplate.opsForValue().set(GROUP_KEY_PREFIX + userId, groupId);
            redisTemplate.opsForHash().put(ACCEPT_KEY_PREFIX + groupId, userId, "false");

            matchSocketHandler.sendToUser(userId, Map.of("type", "ACCEPT_MATCH"));
            System.out.println("🔔 수락 알림 전송 → " + userId);
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

            // 방장 선정 (첫 번째 유저 또는 랜덤)
            String roomLeaderId = users.get(0); // 또는 Collections.shuffle(users);

            int roomNo = createGameRoom(users);

            for (String uid : users) {
                matchSocketHandler.sendToUser(uid, Map.of(
                        "type", "MATCH_FOUND",
                        "gameroom_no", roomNo,
                        "roomLeaderId", roomLeaderId
                ));
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

            // ❌ 거절한 유저는 다시 큐에 넣지 않음
            if (!uid.equals(userId)) {
                enqueue(uid);  // 수락한 유저는 다시 큐에 등록
                matchSocketHandler.sendToUser(uid, Map.of("type", "MATCH_CANCELLED"));
            }

            // 공통적으로 키 정리
            redisTemplate.delete(GROUP_KEY_PREFIX + uid);
        }

        redisTemplate.delete(ACCEPT_KEY_PREFIX + groupId);
    }

    // ✅ 7. 방 번호 생성
    private int createGameRoom(List<String> users) {
        return new Random().nextInt(100000);
    }

    // ✅ 8. 점수 조회
    private int getScore(String userId) {
        String scoreStr = redisTemplate.opsForValue().get(RANK_KEY_PREFIX + userId);
        return (scoreStr != null) ? Integer.parseInt(scoreStr) : 0;
    }
}
