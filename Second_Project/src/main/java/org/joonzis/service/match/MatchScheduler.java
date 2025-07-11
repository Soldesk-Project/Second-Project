/*
 * package org.joonzis.service.match;
 * 
 * import java.util.List; import java.util.UUID;
 * 
 * import org.joonzis.websocket.GameMatchWebSocketHandler; import
 * org.springframework.beans.factory.annotation.Autowired; import
 * org.springframework.data.redis.core.StringRedisTemplate; import
 * org.springframework.scheduling.annotation.Scheduled; import
 * org.springframework.stereotype.Component;
 * 
 * @Component public class MatchScheduler {
 * 
 * @Autowired private MatchService matchService;
 * 
 * @Autowired private StringRedisTemplate redisTemplate;
 * 
 * @Autowired private GameMatchWebSocketHandler gameMatchHandler;
 * 
 * @Scheduled(fixedDelay = 500) public void checkMatchQueue() {
 * System.out.println("🕒 [Scheduler] 큐 점검 중...");
 * 
 * Long size = matchService.queueSize(); System.out.println("⏱️ 현재 큐 사이즈: " +
 * size);
 * 
 * if (size != null && size >= 2) { List<String> users =
 * matchService.findMatchGroup(2); System.out.println("🎯 매칭 후보 그룹 → " + users);
 * 
 * if (!users.isEmpty()) { String groupId = UUID.randomUUID().toString();
 * 
 * // ✅ 1. 메시지 먼저 전송 matchService.startPendingGroup(users, groupId);
 * 
 * // ✅ 2. 이후 큐에서 제거 for (String uid : users) {
 * redisTemplate.opsForList().remove("match-queue", 1, uid); } } else {
 * System.out.println("❌ 조건 만족 유저 없음 → 매칭 보류"); } } }
 * 
 * 
 * }
 */

