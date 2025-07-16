package org.joonzis.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.QuestionDTO;

@Mapper
public interface AdminMapper {

    // 각 카테고리별 테이블에 문제 등록 메소드
    void insertCPE_Q(QuestionDTO question);      // 정보처리기사
    void insertCPEI_Q(QuestionDTO question);     // 정보처리산업기사
    void insertCPET_Q(QuestionDTO question);     // 정보처리기능사
    void insertLM1_Q(QuestionDTO question);      // 리눅스마스터1급
    void insertLM2_Q(QuestionDTO question);      // 리눅스마스터2급
    void insertICTI_Q(QuestionDTO question);     // 정보통신산업기사
    void insertICT_Q(QuestionDTO question);      // 정보통신기사
    void insertSEC_Q(QuestionDTO question);      // 정보보안기사
    void insertNET1_Q(QuestionDTO question);     // 네트워크관리사1급
    void insertNET2_Q(QuestionDTO question);     // 네트워크관리사2급
    
    //문제 검색 메소드
    List<QuestionDTO> getQuestionsBySearch(Map<String, Object> params);
    int getTotalQuestionCount(Map<String, Object> params);
    
    //문제 수정 메소드
    void updateQuestion(@Param("question") QuestionDTO question, @Param("category") String category);
}