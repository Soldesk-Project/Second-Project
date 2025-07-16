package org.joonzis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Base64;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.mapper.AdminMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.log4j.Log4j;

@Log4j
@Service // 이 클래스가 서비스 계층의 컴포넌트임을 나타냅니다.
public class AdminServiceImpl implements AdminService {

    @Autowired
    private AdminMapper adminMapper;

    //문제 등록
    @Override
    public void registerQuestion(QuestionDTO questionDTO, String category) {

    	// 필수 필드 검증
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
                throw new IllegalStateException("옵션 검증 중 예기치 않은 오류 발생", e);
            }
        }
        if (questionDTO.getCorrect_answer() < 1 || questionDTO.getCorrect_answer() > 4) {
            throw new IllegalArgumentException("정답은 1에서 4 사이여야 합니다.");
        }

        switch (category) {
            case "정보처리기사":
                adminMapper.insertCPE_Q(questionDTO);
                break;
            case "정보처리산업기사": // categories 배열에 추가되었으므로, 여기에도 이 케이스가 반드시 존재해야 합니다.
                adminMapper.insertCPEI_Q(questionDTO);
                break;
            case "정보처리기능사":
                adminMapper.insertCPET_Q(questionDTO);
                break;
            case "리눅스마스터1급":
                adminMapper.insertLM1_Q(questionDTO);
                break;
            case "리눅스마스터2급":
                adminMapper.insertLM2_Q(questionDTO);
                break;
            case "정보통신산업기사":
                adminMapper.insertICTI_Q(questionDTO);
                break;
            case "정보통신기사":
                adminMapper.insertICT_Q(questionDTO);
                break;
            case "정보보안기사":
                adminMapper.insertSEC_Q(questionDTO);
                break;
            case "네트워크관리사1급":
                adminMapper.insertNET1_Q(questionDTO);
                break;
            case "네트워크관리사2급":
                adminMapper.insertNET2_Q(questionDTO);
                break;
            default:
                throw new IllegalArgumentException("유효하지 않은 카테고리입니다: " + category);
        }
    }
    
 // 수정 및 삭제를 위한 문제 검색
    @Override
    public Map<String, Object> searchQuestions(String category, String query, int page, int limit) {
        // 모든 결과 반환을 보장하기 위한 초기화
        List<QuestionDTO> questions = new ArrayList<>();
        int totalCount = 0;
        int totalPages = 0;

        // 결과 Map 초기화
        Map<String, Object> result = new HashMap<>();
        result.put("questions", questions);
        result.put("totalPages", totalPages);
        result.put("totalCount", totalCount);
        result.put("error", null); // 에러 정보를 담을 필드 추가

        log.info("ServiceImpl: searchQuestions 호출 - 카테고리: " + category + ", 검색어: " + query + ", 페이지: " + page + ", 제한: " + limit);

        try {
            // 페이지네이션을 위한 OFFSET 계산
            int offset = (page - 1) * limit;
            log.debug("계산된 OFFSET: " + offset);

            // 검색 조건 및 페이지 정보를 담을 Map
            Map<String, Object> params = new HashMap<>();
            params.put("category", category); // 동적 테이블명
            params.put("query", query);       // 검색어
            params.put("offset", offset);     // 시작 위치
            params.put("limit", limit);       // 개수
            log.debug("매퍼 파라미터 Map 준비: " + params);

            // 1. Mapper를 통해 전체 문제 개수 조회 (페이지네이션 계산용)
            // 이 쿼리가 먼저 성공해야 총 페이지 수를 제대로 계산할 수 있습니다.
            try {
                totalCount = adminMapper.getTotalQuestionCount(params);
                log.info("총 문제 개수 조회 성공: " + totalCount);
                totalPages = (int) Math.ceil((double) totalCount / limit);
                log.debug("계산된 총 페이지 수: " + totalPages);
            } catch (Exception e) {
                log.error("Mapper.getTotalQuestionCount 호출 중 오류 발생: " + e.getMessage(), e);
                // 오류 발생 시에도 0으로 설정하여 진행
                totalCount = 0;
                totalPages = 0;
                // 에러 메시지를 결과 맵에 추가
                result.put("error", "총 문제 개수 조회 중 오류 발생: " + e.getMessage());
            }

            // 2. Mapper를 통해 문제 목록 조회 (limit, offset 적용)
            try {
                questions = adminMapper.getQuestionsBySearch(params); // 매퍼 메서드 필요
                log.info("Mapper.getQuestionsBySearch 호출 성공. 조회된 문제 수: " + (questions != null ? questions.size() : 0));
            } catch (Exception e) {
                log.error("Mapper.getQuestionsBySearch 호출 중 오류 발생: " + e.getMessage(), e);
                // 오류 발생 시 빈 리스트로 초기화
                questions = new ArrayList<>();
                // 에러 메시지를 결과 맵에 추가
                result.put("error", "문제 목록 조회 중 오류 발생: " + e.getMessage());
            }

            // 3. 이미지 데이터 Base64 인코딩 및 처리
            if (questions != null) {
                for (QuestionDTO question : questions) {
                    if (question.getImage_data() != null && question.getImage_data().length > 0) {
                        try {
                            String base64Image = Base64.getEncoder().encodeToString(question.getImage_data());
                            question.setImage_data_base64(base64Image);
                            question.setImage_data(null); // 원본 byte[] 데이터는 null로 비워서 JSON 직렬화 시 불필요한 데이터 제외
                            log.debug("문제 ID " + question.getId() + " 이미지 Base64 변환 성공.");
                        } catch (Exception e) {
                            log.error("문제 ID " + question.getId() + " 이미지 Base64 변환 중 오류 발생: " + e.getMessage(), e);
                            question.setImage_data_base64(""); // 변환 실패 시 빈 문자열
                            question.setImage_data(null); // 원본 데이터도 비움
                            // 에러 메시지를 결과 맵에 추가할 수도 있지만, 너무 많아질 수 있으므로 개별 로깅으로 처리
                        }
                    } else {
                        question.setImage_data_base64(""); // 이미지가 없거나 비어있으면 빈 문자열 설정
                        question.setImage_data(null); // byte[] 필드도 명시적으로 비움
                    }
                }
            }

            // 결과 Map에 담아 반환 (최종 업데이트)
            result.put("questions", questions);
            result.put("totalPages", totalPages);
            result.put("totalCount", totalCount);

        } catch (Exception e) {
            // searchQuestions 메서드 전체에서 발생하는 예상치 못한 예외 처리
            log.error("ServiceImpl.searchQuestions 메서드 실행 중 알 수 없는 예외 발생: " + e.getMessage(), e);
            e.printStackTrace();
            result.put("error", "서버 내부 오류가 발생했습니다: " + e.getMessage());
            // 이 경우 questions, totalCount, totalPages는 초기값(빈 리스트/0)을 유지
        }

        log.info("ServiceImpl: searchQuestions 결과 반환. questions size: " + ((List)result.get("questions")).size() + ", totalCount: " + result.get("totalCount") + ", error: " + result.get("error"));
        return result;
    }

    // 새롭게 추가된 문제 수정 메서드 구현
    @Override
    public void updateQuestion(QuestionDTO questionDTO, String category) {
        // 문제 ID(questionDTO.getId())를 사용하여 해당 카테고리 테이블에서 문제 수정
        // 예: adminMapper.updateQuestion(questionDTO, category);
        System.out.println("ServiceImpl: 문제 수정 실행 - 카테고리: " + category + ", DTO: " + questionDTO);
        adminMapper.updateQuestion(questionDTO, category);
    }
}