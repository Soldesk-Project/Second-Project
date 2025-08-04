package org.joonzis.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UserQuestionHistoryDTO;

public interface PlayMapper {
	
	// 카테고리 별 문제 가져오기
	List<QuestionDTO> getQuestionsByCategory(@Param("category") String category);
	
	// 올 랜덤 문제 가져오기(랭크모드)
	List<QuestionDTO> getRandomQuestions();

	public void increaseRewardPoints(@Param("point") int point, @Param("rank_point") int rank_point, @Param("user_nick") String user_nick);
	
	public void insertHistory(UserQuestionHistoryDTO history);
	
	public void countFirst(@Param("user_nick") String user_nick);
	
	public void leavePanalty(@Param("user_nick") String user_nick);
	
	public List<UserQuestionHistoryDTO> getQuestionReviewList(@Param("user_nick") String user_nick);
	
	public List<UserQuestionHistoryDTO> getUserQuestionHistory(@Param("submittedAt") String submittedAt);
	
	public void saveReport(UserQuestionHistoryDTO report);
	
	public List<UserQuestionHistoryDTO> getReportQuestion(@Param("offset") int offset, @Param("size") int size);
	
	public int getReportQuestionCount();
}
