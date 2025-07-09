package org.joonzis.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.QuestionDTO;

public interface PlayMapper {
	
	// 카테고리 별 문제 가져오기
	List<QuestionDTO> getQuestionsByCategory(@Param("category") String category);
	
	// 올 랜덤 문제 가져오기(랭크모드)
	List<QuestionDTO> getRandomQuestions();

}
