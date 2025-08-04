package org.joonzis.service;

import org.joonzis.domain.QuestRequestVO; // QuestRequestVO 사용
import org.joonzis.mapper.QuestMapper;   // QuestMapper 사용
import org.joonzis.service.QuestService; // QuestService 인터페이스
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.log4j.Log4j;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Log4j
@Service
public class QuestServiceImpl implements QuestService {

    @Autowired
    private QuestMapper questMapper; // QuestMapper 주입

    // 과목 코드 유효성 검사를 위한 맵 (새로 추가)
    private static final Map<String, String> SUBJECT_DISPLAY_MAP = new HashMap<>();
    static {
        SUBJECT_DISPLAY_MAP.put("cpe", "정보처리기사");
        SUBJECT_DISPLAY_MAP.put("cpei", "정보처리산업기사");
        SUBJECT_DISPLAY_MAP.put("cpet", "정보처리기능사");
        SUBJECT_DISPLAY_MAP.put("lm1", "리눅스마스터1급");
        SUBJECT_DISPLAY_MAP.put("lm2", "리눅스마스터2급");
        SUBJECT_DISPLAY_MAP.put("icti", "정보통신산업기사");
        SUBJECT_DISPLAY_MAP.put("ict", "정보통신기사");
        SUBJECT_DISPLAY_MAP.put("sec", "정보보안기사");
        SUBJECT_DISPLAY_MAP.put("net1", "네트워크관리사1급");
        SUBJECT_DISPLAY_MAP.put("net2", "네트워크관리사2급");
    }

    // 과목 코드 유효성 검사 메서드
    private boolean isValidSubjectCode(String subjectCode) {
        return SUBJECT_DISPLAY_MAP.containsKey(subjectCode);
    }

    // 과목 코드로부터 표시 이름을 가져오는 메서드 (로그 메시지 등에 활용)
    private String getSubjectDisplayName(String subjectCode) {
        return SUBJECT_DISPLAY_MAP.getOrDefault(subjectCode, "알 수 없는 과목");
    }

    // 문제 등록
//    @Override
//    public void registerQuest(QuestRequestVO questRequestVO) { // QuestRequestVO를 파라미터로 받음
//        String subjectCode = questRequestVO.getSubject();
//        log.info("ServiceImpl: registerQuest 호출 - 수신된 subject 코드: " + subjectCode);
//
//        // 1. 필수 필드 검증
//        if (questRequestVO.getQuestion_text() == null || questRequestVO.getQuestion_text().trim().isEmpty()) {
//            throw new IllegalArgumentException("문제 본문은 필수 입력 값입니다.");
//        }
//        
//        // Reflection 대신 직접 옵션 검증
//        if (questRequestVO.getOption_1() == null || questRequestVO.getOption_1().trim().isEmpty()) {
//            throw new IllegalArgumentException("1번 선택지는 필수 입력 값입니다.");
//        }
//        if (questRequestVO.getOption_2() == null || questRequestVO.getOption_2().trim().isEmpty()) {
//            throw new IllegalArgumentException("2번 선택지는 필수 입력 값입니다.");
//        }
//        if (questRequestVO.getOption_3() == null || questRequestVO.getOption_3().trim().isEmpty()) {
//            throw new IllegalArgumentException("3번 선택지는 필수 입력 값입니다.");
//        }
//        if (questRequestVO.getOption_4() == null || questRequestVO.getOption_4().trim().isEmpty()) {
//            throw new IllegalArgumentException("4번 선택지는 필수 입력 값입니다.");
//        }
//        
//        if (questRequestVO.getCorrect_answer() < 1 || questRequestVO.getCorrect_answer() > 4) {
//            throw new IllegalArgumentException("정답은 1에서 4 사이여야 합니다.");
//        }
//
//        // 2. subject 코드 유효성 검사
//        if (subjectCode == null || !isValidSubjectCode(subjectCode)) {
//            throw new IllegalArgumentException("유효하지 않은 과목(subject) 코드입니다: " + subjectCode);
//        }
//
//        // 3. Service 계층에서 Base64 디코딩 수행
//        if (questRequestVO.getImage_data_base64() != null && !questRequestVO.getImage_data_base64().isEmpty()) {
//            try {
//                // "data:image/png;base64," 같은 접두사 제거
//                String pureBase64 = questRequestVO.getImage_data_base64();
//                if (pureBase64.contains(",")) {
//                    pureBase64 = pureBase64.split(",")[1];
//                }
//                
//                byte[] decodedBytes = Base64.getDecoder().decode(pureBase64);
//                questRequestVO.setImage_data(decodedBytes); // byte[] 필드에 디코딩된 데이터 설정
//                questRequestVO.setImage_data_base64(null); // Base64 문자열 필드는 비워줌 (DB에 저장하지 않으므로)
//            } catch (IllegalArgumentException e) {
//                log.error("Base64 이미지 데이터 디코딩 실패: " + e.getMessage(), e);
//                throw new IllegalArgumentException("유효하지 않은 이미지 데이터 형식입니다.", e);
//            }
//        } else {
//            questRequestVO.setImage_data(null); // 이미지 데이터가 없으면 null로 설정
//        }
//
//        // 4. Mapper 호출을 위한 QuestRequestVO 직접 사용
//        try {
//            questMapper.insertQuest(questRequestVO); // QuestRequestVO 객체를 직접 넘김
//            log.info(getSubjectDisplayName(subjectCode) + " (" + subjectCode + ") 과목에 문제 등록 성공.");
//        } catch (Exception e) {
//            log.error("문제 등록 중 데이터베이스 오류 발생: " + e.getMessage(), e);
//            throw new RuntimeException("데이터베이스에 문제를 등록하는 중 오류가 발생했습니다.", e);
//        }
//    }
    @Override
    public void registerQuest(String subject, String questionText, String option1, String option2,
                              String option3, String option4, int correctAnswer,
                              byte[] imageData, Long userNo) {

        log.info("ServiceImpl: registerQuest 호출 - subject=" + subject);

        // 필수 검증
        if (questionText == null || questionText.trim().isEmpty()) {
            throw new IllegalArgumentException("문제 본문은 필수 입력 값입니다.");
        }
        if (option1 == null || option1.trim().isEmpty()) {
            throw new IllegalArgumentException("1번 선택지는 필수 입력 값입니다.");
        }
        if (option2 == null || option2.trim().isEmpty()) {
            throw new IllegalArgumentException("2번 선택지는 필수 입력 값입니다.");
        }
        if (option3 == null || option3.trim().isEmpty()) {
            throw new IllegalArgumentException("3번 선택지는 필수 입력 값입니다.");
        }
        if (option4 == null || option4.trim().isEmpty()) {
            throw new IllegalArgumentException("4번 선택지는 필수 입력 값입니다.");
        }
        if (correctAnswer < 1 || correctAnswer > 4) {
            throw new IllegalArgumentException("정답은 1에서 4 사이여야 합니다.");
        }
        if (subject == null || !isValidSubjectCode(subject)) {
            throw new IllegalArgumentException("유효하지 않은 과목(subject) 코드입니다: " + subject);
        }

        try {
            questMapper.insertQuest(subject, questionText, option1, option2, option3, option4,
                                   correctAnswer, imageData, userNo);
            log.info(getSubjectDisplayName(subject) + " 과목 문제 등록 성공");
        } catch (Exception e) {
            log.error("문제 등록 중 데이터베이스 오류 발생", e);
            throw new RuntimeException("문제 등록 중 오류가 발생했습니다.", e);
        }
    }
}