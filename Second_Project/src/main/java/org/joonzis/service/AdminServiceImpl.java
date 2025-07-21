package org.joonzis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.mapper.AdminMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.log4j.Log4j;

@Log4j
@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    @Autowired
    private AdminMapper adminMapper;

    // 테이블 이름-한글 카테고리 이름 매핑 Map 정의
    private static final Map<String, String> TABLE_TO_CATEGORY_MAP;

    static {
        Map<String, String> ttcMap = new HashMap<>();
        ttcMap.put("CPE_Q", "정보처리기사");      // 테이블명 -> 한글 카테고리명
        ttcMap.put("CPEI_Q", "정보처리기능사");
        ttcMap.put("CPET_Q", "정보처리기술사");
        ttcMap.put("LM1_Q", "리눅스마스터1급");
        ttcMap.put("LM2_Q", "리눅스마스터2급");
        ttcMap.put("ICTI_Q", "정보통신기사");
        ttcMap.put("ICT_Q", "정보통신기술사");
        ttcMap.put("SEC_Q", "정보보안기사");
        ttcMap.put("NET1_Q", "네트워크관리사1급");
        ttcMap.put("NET2_Q", "네트워크관리사2급");
        // 여기에 사용 중인 모든 실제 DB 테이블 이름과 한글 카테고리 이름을 정확히 매핑하세요.

        TABLE_TO_CATEGORY_MAP = Collections.unmodifiableMap(ttcMap); // 맵을 불변(Immutable)으로 만듭니다.
    }

    // 유효한 테이블 이름(category 파라미터로 넘어오는 값)인지 확인하는 헬퍼 메소드
    private boolean isValidCategory(String category) {
        return TABLE_TO_CATEGORY_MAP.containsKey(category);
    }

    // 테이블 이름으로 한글 카테고리 이름을 가져오는 헬퍼 메소드 (필요시 사용)
    private String getCategoryNameFromTableName(String tableName) {
        return TABLE_TO_CATEGORY_MAP.get(tableName);
    }

    // 문제 등록
    @Override
    public void registerQuestion(QuestionDTO questionDTO, String category) {
        log.info("ServiceImpl: registerQuestion 호출 - category(tableName): " + category);

        // 1. 필수 필드 검증 (기존 로직 유지)
        if (questionDTO.getQuestion_text() == null || questionDTO.getQuestion_text().trim().isEmpty()) {
            throw new IllegalArgumentException("문제 본문은 필수 입력 값입니다.");
        }
        for (int i = 1; i <= 4; i++) {
            try {
                String option = (String) QuestionDTO.class.getMethod("getOption_" + i).invoke(questionDTO);
                if (option == null || option.trim().isEmpty()) {
                    throw new IllegalArgumentException(i + "번 선택지는 필수 입력 값입니다.");
                }
            } catch (Exception e) {
                log.error("옵션 검증 중 예기치 않은 오류 발생", e);
                throw new IllegalStateException("옵션 검증 중 예기치 않은 오류 발생", e);
            }
        }
        if (questionDTO.getCorrect_answer() < 1 || questionDTO.getCorrect_answer() > 4) {
            throw new IllegalArgumentException("정답은 1에서 4 사이여야 합니다.");
        }

        // 2. 카테고리(테이블 이름) 유효성 검사
        // category 파라미터가 이제 테이블 이름이므로, isValidCategory는 테이블 이름 유효성을 검사합니다.
        if (!isValidCategory(category)) {
            throw new IllegalArgumentException("유효하지 않은 테이블 이름입니다: " + category);
        }
        // tableName 변수를 별도로 선언할 필요 없이, category 파라미터 자체가 테이블 이름입니다.
        String tableName = category;
        log.debug("등록될 문제의 테이블: " + tableName);

        // 3. Map에 필요한 모든 데이터 담기 (동적 테이블명 및 QuestionDTO 필드들)
        Map<String, Object> params = new HashMap<>();
        params.put("tableName", tableName); // ⭐ category 파라미터가 직접 tableName으로 사용됩니다.
        params.put("question_text", questionDTO.getQuestion_text());
        params.put("option_1", questionDTO.getOption_1());
        params.put("option_2", questionDTO.getOption_2());
        params.put("option_3", questionDTO.getOption_3());
        params.put("option_4", questionDTO.getOption_4());
        params.put("correct_answer", questionDTO.getCorrect_answer());
        params.put("image_data", questionDTO.getImage_data());

        // 4. 단일 Mapper 메서드 호출
        try {
            adminMapper.insertQuestion(params);
            log.info(getCategoryNameFromTableName(tableName) + "(" + tableName + ") 카테고리에 문제 등록 성공.");
        } catch (Exception e) {
            log.error("문제 등록 중 매퍼 오류 발생: " + e.getMessage(), e);
            throw new RuntimeException("데이터베이스에 문제를 등록하는 중 오류가 발생했습니다.", e);
        }
    }

    // 수정 및 삭제를 위한 문제 검색
    @Override
    public Map<String, Object> searchQuestions(String category, String query, int page, int limit) {
        List<QuestionDTO> questions = new ArrayList<>();
        int totalCount = 0;
        int totalPages = 0;

        Map<String, Object> result = new HashMap<>();
        result.put("questions", questions);
        result.put("totalPages", totalPages);
        result.put("totalCount", totalCount);
        result.put("error", null);

        log.info("ServiceImpl: searchQuestions 호출 - category(tableName): " + category + ", 검색어: " + query + ", 페이지: " + page + ", 제한: " + limit);

        // 카테고리(테이블 이름) 유효성 검사
        if (!isValidCategory(category)) {
            result.put("error", "유효하지 않은 테이블 이름입니다: " + category);
            log.warn("유효하지 않은 테이블 이름 요청: " + category);
            return result;
        }

        try {
            // category 파라미터가 이미 테이블 이름이므로, 별도의 변환 없이 직접 사용합니다.
            String tableName = category;
            log.debug("사용될 테이블 이름: " + tableName);

            int offset = (page - 1) * limit;
            log.debug("계산된 OFFSET: " + offset);

            Map<String, Object> params = new HashMap<>();
            params.put("tableName", tableName); // ⭐ category 파라미터가 직접 tableName으로 사용됩니다.
            params.put("query", query);
            params.put("offset", offset);
            params.put("limit", limit);
            log.debug("매퍼 파라미터 Map 준비: " + params);

            try {
                totalCount = adminMapper.getTotalQuestionCount(params);
                log.info("총 문제 개수 조회 성공: " + totalCount);
                totalPages = (int) Math.ceil((double) totalCount / limit);
                log.debug("계산된 총 페이지 수: " + totalPages);
            } catch (Exception e) {
                log.error("Mapper.getTotalQuestionCount 호출 중 오류 발생: " + e.getMessage(), e);
                totalCount = 0;
                totalPages = 0;
                result.put("error", "총 문제 개수 조회 중 오류 발생: " + e.getMessage());
            }

            if (result.get("error") == null) {
                try {
                    questions = adminMapper.getQuestionsBySearch(params);
                    log.info("Mapper.getQuestionsBySearch 호출 성공. 조회된 문제 수: " + (questions != null ? questions.size() : 0));

                    if (questions != null) {
                        for (QuestionDTO question : questions) {
                            if (question.getImage_data() != null && question.getImage_data().length > 0) {
                                try {
                                    String base64Image = Base64.getEncoder().encodeToString(question.getImage_data());
                                    question.setImage_data_base64(base64Image);
                                    question.setImage_data(null);
                                    log.debug("문제 ID " + question.getId() + " 이미지 Base64 변환 성공.");
                                } catch (Exception e) {
                                    log.error("문제 ID " + question.getId() + " 이미지 Base64 변환 중 오류 발생: " + e.getMessage(), e);
                                    question.setImage_data_base64("");
                                    question.setImage_data(null);
                                }
                            } else {
                                question.setImage_data_base64("");
                                question.setImage_data(null);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Mapper.getQuestionsBySearch 호출 중 오류 발생: " + e.getMessage(), e);
                    questions = new ArrayList<>();
                    result.put("error", "문제 목록 조회 중 오류 발생: " + e.getMessage());
                }
            }

            result.put("questions", questions);
            result.put("totalPages", totalPages);
            result.put("totalCount", totalCount);

        } catch (Exception e) {
            log.error("ServiceImpl.searchQuestions 메서드 실행 중 알 수 없는 예외 발생: " + e.getMessage(), e);
            result.put("error", "서버 내부 오류가 발생했습니다: " + e.getMessage());
        }

        log.info("ServiceImpl: searchQuestions 결과 반환. questions size: " + ((List)result.get("questions")).size() + ", totalCount: " + result.get("totalCount") + ", error: " + result.get("error"));
        return result;
    }

    // 문제 수정 메서드
    @Override
    public void updateQuestion(QuestionDTO questionDTO, String category) {
        log.info("ServiceImpl: 문제 수정 실행 - category(tableName): " + category + ", DTO: " + questionDTO);

        // 카테고리(테이블 이름) 유효성 검사
        if (!isValidCategory(category)) {
            throw new IllegalArgumentException("유효하지 않은 테이블 이름입니다: " + category);
        }
        String tableName = category;
        log.debug("수정될 문제의 테이블: " + tableName);

        Map<String, Object> params = new HashMap<>();
        params.put("tableName", tableName); // ⭐ category 파라미터가 직접 tableName으로 사용됩니다.
        params.put("id", questionDTO.getId());
        params.put("question_text", questionDTO.getQuestion_text());
        params.put("option_1", questionDTO.getOption_1());
        params.put("option_2", questionDTO.getOption_2());
        params.put("option_3", questionDTO.getOption_3());
        params.put("option_4", questionDTO.getOption_4());
        params.put("correct_answer", questionDTO.getCorrect_answer());
        params.put("image_data", questionDTO.getImage_data());

        try {
            adminMapper.updateQuestion(params);
            log.info(getCategoryNameFromTableName(tableName) + "(" + tableName + ") 카테고리의 문제 ID " + questionDTO.getId() + " 수정 성공.");
        } catch (Exception e) {
            log.error("문제 수정 중 매퍼 오류 발생: " + e.getMessage(), e);
            throw new RuntimeException("데이터베이스에서 문제를 수정하는 중 오류가 발생했습니다.", e);
        }
    }
    
    // 문제 삭제 메소드
    @Override
    public void deleteQuestions(String category, List<Integer> questionIds) {
        log.info("ServiceImpl: deleteQuestions 호출 - category(tableName): " + category + ", 삭제할 ID 목록: " + questionIds);

        if (questionIds == null || questionIds.isEmpty()) {
            throw new IllegalArgumentException("삭제할 문제 ID가 제공되지 않았습니다.");
        }

        // 카테고리(테이블 이름) 유효성 검사
        if (!isValidCategory(category)) {
            throw new IllegalArgumentException("유효하지 않은 테이블 이름입니다: " + category);
        }
        String tableName = category;
        log.debug("삭제될 문제의 테이블: " + tableName);

        Map<String, Object> params = new HashMap<>();
        params.put("tableName", tableName); // ⭐ category 파라미터가 직접 tableName으로 사용됩니다.
        params.put("questionIds", questionIds);

        try {
            int deletedCount = adminMapper.deleteQuestions(params);
            log.info(getCategoryNameFromTableName(tableName) + "(" + tableName + ") 테이블에서 " + deletedCount + "개의 문제가 삭제되었습니다.");
            if (deletedCount == 0) {
                log.warn("삭제 요청된 ID 중 해당 테이블에서 일치하는 문제가 없거나 이미 삭제되었습니다.");
            }
        } catch (Exception e) {
            log.error("문제 삭제 중 매퍼 오류 발생: " + e.getMessage(), e);
            throw new RuntimeException("데이터베이스에서 문제를 삭제하는 중 오류가 발생했습니다.", e);
        }
    }

    // 유저 조회
    @Override
    public List<UsersVO> getAllUsers() {
        log.info("ServiceImpl: getAllUsers 호출");
        return adminMapper.selectAllUsers();
    }

    // 유저 검색
    @Override
    public List<UsersVO> searchUsers(String searchType, String searchValue) {
        log.info("ServiceImpl: searchUsers 호출 - 검색 타입: " + searchType + ", 검색 값: " + searchValue);
        return adminMapper.searchUsers(searchType, searchValue);
    }

    // 유저 채금 적용
    @Override
    @Transactional
    public int banChatusers(List<Integer> userNos) {
        log.info("ServiceImpl: banChatusers 호출 - 사용자 번호 목록: " + userNos);
        if (userNos == null || userNos.isEmpty()) {
            log.info("채팅 금지할 사용자 번호가 없습니다.");
            return 0;
        }

        List<Integer> actualUsersToBan = new ArrayList<>();

        List<UsersVO> currentStatuses = adminMapper.getUsersChatBanStatus(userNos);
        log.debug("현재 채팅 금지 상태 조회 결과: " + currentStatuses.size() + "명");

        for (Integer userNo : userNos) {
            boolean alreadyBanned = false;
            for (UsersVO user : currentStatuses) {
                if (user.getUser_no() == userNo.intValue()) {
                    if (user.getIschatbanned() == 1) {
                        alreadyBanned = true;
                        log.debug("User " + user.getUser_nick() + "(" + userNo + ")는 이미 채팅 금지 상태입니다. 건너뜝니다.");
                        break;
                    }
                }
            }
            if (!alreadyBanned) {
                actualUsersToBan.add(userNo);
            }
        }

        if (!actualUsersToBan.isEmpty()) {
            log.info(actualUsersToBan.size() + "명의 사용자에게 채팅 금지 적용 예정.");
            int updatedCount = adminMapper.updateChatBanStatus(actualUsersToBan, new Timestamp(System.currentTimeMillis()));
            log.info(updatedCount + "명의 사용자에게 채팅 금지가 적용되었습니다.");
            return updatedCount;
        } else {
            log.info("새로 채팅 금지할 사용자가 없습니다.");
            return 0;
        }
    }

    // 유저 채금 해제 (1시간마다 실행되도록 스케줄링)
    @Scheduled(fixedRate = 3600000) // 1시간 = 3600000 밀리초
    @Override
    @Transactional
    public void unbanChatUsers() {
        log.info("ServiceImpl: unbanChatUsers (스케줄링) 호출");
        int unbannedCount = adminMapper.unbanChatUsers();
        if (unbannedCount > 0) {
            log.info(unbannedCount + "명의 사용자의 채팅 금지가 해제되었습니다.");
        } else {
            log.info("해제할 채팅 금지 사용자가 없습니다.");
        }
    }
}